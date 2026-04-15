/**
 * rebalanceEngine.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Aegis Rebalance Engine — Core Rules Engine
 *
 * Implements the MF portfolio rebalancing logic defined in context.md Section 6.
 * Reference data: Rebalance V0.xlsx (User Data, ML Recommendation, Sell Summary,
 * Buy Summary sheets).
 *
 * ARCHITECTURE:
 * The engine runs in four sequential phases:
 *   Phase 1 — calculateCurrentAllocation()  : map holdings → allocation buckets
 *   Phase 2 — evaluateSellRules()           : R_LOCKIN_FREE_SELL, R5_3star_zero_if_45_in_cat
 *   Phase 3 — evaluateTrimHoldRules()       : R3_cap_to_5pct
 *   Phase 4 — generateActionPlan()          : orchestrate all phases + buy logic
 *
 * FINANCIAL PRECISION:
 * All monetary calculations use Decimal.js. Never use native JS Number arithmetic
 * for ₹ amounts — floating point errors compound on large portfolios.
 *
 * TAX RATES (as per PRD / SEBI norms):
 *   STCG: 12.5% on gains from units held < 1 year
 *   LTCG: 12.5% on gains from units held ≥ 1 year (above ₹1.25L exemption — simplified here)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import Decimal from 'decimal.js';
import {
  Holding,
  MandateName,
  AllocationBucket,
  AllocationBreakdown,
  FundCandidate,
  RecommendationItem,
  RebalanceSummary,
  BuyRuleId,
  SellRuleId,
  TrimRuleId,
} from '../../models/types';
import {
  RISK_MANDATES,
  DEFAULT_FUND_UNIVERSE,
  BUCKET_TO_BUY_RULE,
} from './mandateProfiles';
import {
  getAllocationBucket,
  isLockInCategory,
  getCategoryGroup,
  formatStarRating,
} from './categoryMapper';

// ─── Tax rate constants ───────────────────────────────────────────────────────
const STCG_RATE = new Decimal('0.125'); // 12.5%
const LTCG_RATE = new Decimal('0.125'); // 12.5%

// ─── Rule thresholds ─────────────────────────────────────────────────────────
const THREE_STAR_CAP = new Decimal('0.05'); // R3: 3★ funds capped at 5% of portfolio

// ─── Internal sell decision (intermediate result) ────────────────────────────
interface SellDecision {
  isin: string;
  sell_amount: Decimal;
  rule_id: SellRuleId | TrimRuleId;
  is_full_sell: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 1: calculateCurrentAllocation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Maps each holding to an allocation bucket and computes the current allocation
 * breakdown in ₹ and percentage.
 *
 * Matches the "Allocation → Current_Pct / Current_Val" output in the spreadsheet.
 */
export function calculateCurrentAllocation(holdings: Holding[]): AllocationBreakdown {
  const buckets: Record<AllocationBucket, Decimal> = {
    large_cap:     new Decimal(0),
    mid_cap:       new Decimal(0),
    small_cap:     new Decimal(0),
    gold:          new Decimal(0),
    debt:          new Decimal(0),
    thematic:      new Decimal(0),
    international: new Decimal(0),
    hybrid:        new Decimal(0),
  };

  let total = new Decimal(0);

  for (const h of holdings) {
    const value = new Decimal(h.current_value.toString());
    const bucket = getAllocationBucket(h.category);
    buckets[bucket] = buckets[bucket].plus(value);
    total = total.plus(value);
  }

  // Build percentage map — guard against empty portfolio (division by zero)
  const pct = (val: Decimal): number =>
    total.isZero() ? 0 : val.dividedBy(total).times(100).toDecimalPlaces(4).toNumber();

  const percentages: Record<AllocationBucket, number> = {
    large_cap:     pct(buckets.large_cap),
    mid_cap:       pct(buckets.mid_cap),
    small_cap:     pct(buckets.small_cap),
    gold:          pct(buckets.gold),
    debt:          pct(buckets.debt),
    thematic:      pct(buckets.thematic),
    international: pct(buckets.international),
    hybrid:        pct(buckets.hybrid),
  };

  return {
    large_cap:     buckets.large_cap.toNumber(),
    mid_cap:       buckets.mid_cap.toNumber(),
    small_cap:     buckets.small_cap.toNumber(),
    gold:          buckets.gold.toNumber(),
    debt:          buckets.debt.toNumber(),
    thematic:      buckets.thematic.toNumber(),
    international: buckets.international.toNumber(),
    hybrid:        buckets.hybrid.toNumber(),
    total:         total.toNumber(),
    percentages,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 2: evaluateSellRules
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Evaluates mandatory sell rules against every holding.
 * Returns a map of ISIN → SellDecision for all holdings that must be (at least
 * partially) sold.
 *
 * Rules applied (in priority order):
 *   1. R_LOCKIN_FREE_SELL   — ELSS funds: sell units past the 3-year lock-in.
 *   2. R5_3star_zero_if_45_in_cat — 3★ fund: full sell if 4★/5★ exists in same category.
 *
 * Example outcomes from Rebalance V0.xlsx:
 *   - Franklin India ELSS (2★, INF090I01JS8): R_LOCKIN_FREE_SELL → sell 82.64%
 *   - BANDHAN Flexi Cap (3★, INF194K01W62): R5 → sell 100% (Parag Parikh 4★ in same category)
 */
export function evaluateSellRules(
  holdings: Holding[],
  totalPortfolioValue: Decimal,
): Map<string, SellDecision> {
  const sellDecisions = new Map<string, SellDecision>();

  // ─── Rule 1: R_LOCKIN_FREE_SELL ───────────────────────────────────────────
  // Applies to all ELSS funds.
  // Logic: if units_free_from_exit_load > 0, sell the proportional value of those units.
  for (const h of holdings) {
    if (!isLockInCategory(h.category)) continue;

    const freeUnits = new Decimal(h.units_free_from_exit_load.toString());
    const availUnits = new Decimal(h.available_units.toString());

    if (freeUnits.isZero() || availUnits.isZero()) continue;

    // Proportion of the holding that is freely redeemable
    const freePct = freeUnits.dividedBy(availUnits);
    const sellAmount = new Decimal(h.current_value.toString()).times(freePct);

    if (sellAmount.isZero()) continue;

    sellDecisions.set(h.isin, {
      isin: h.isin,
      sell_amount: sellAmount,
      rule_id: 'R_LOCKIN_FREE_SELL',
      is_full_sell: freePct.gte(new Decimal('0.9999')), // treat ≥99.99% as full sell
    });
  }

  // ─── Rule 2: R5_3star_zero_if_45_in_cat ──────────────────────────────────
  // For every 3★ fund, check if any other holding is 4★ or 5★ in the same
  // MF category. If yes, fully sell the 3★ fund.
  // NOTE: If R_LOCKIN_FREE_SELL already applies, skip (ELSS logic takes priority).

  // Build a set of categories that have at least one 4★/5★ fund.
  const highRatedCategories = new Set<string>();
  for (const h of holdings) {
    if (h.rating >= 4) {
      highRatedCategories.add(h.category.toLowerCase().trim());
    }
  }

  for (const h of holdings) {
    if (h.rating !== 3) continue;
    if (sellDecisions.has(h.isin)) continue; // already being handled by R_LOCKIN_FREE_SELL

    const categoryKey = h.category.toLowerCase().trim();
    if (!highRatedCategories.has(categoryKey)) continue;

    // Verify the higher-rated fund in same category is not the fund itself
    const higherRatedInSameCat = holdings.some(
      (other) =>
        other.isin !== h.isin &&
        other.category.toLowerCase().trim() === categoryKey &&
        other.rating >= 4,
    );

    if (!higherRatedInSameCat) continue;

    sellDecisions.set(h.isin, {
      isin: h.isin,
      sell_amount: new Decimal(h.current_value.toString()),
      rule_id: 'R5_3star_zero_if_45_in_cat',
      is_full_sell: true,
    });
  }

  void totalPortfolioValue; // used by trim rules; kept in signature for API symmetry
  return sellDecisions;
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 3: evaluateTrimHoldRules
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Evaluates trim/hold rules for holdings not already flagged for full sell.
 * Returns additional sell decisions (partial — TRIM/HOLD) to merge into the sell map.
 *
 * Rules applied:
 *   R3_cap_to_5pct — If a 3★ fund exceeds 5% of total portfolio value, trim the
 *                    excess. Only the "sellable" portion (units_free_from_exit_load)
 *                    is trimmed; the rest is held.
 *
 * Example outcomes from Rebalance V0.xlsx:
 *   - UTI Nifty 50 Index (3★, 8.95% weight): trim to 5.00% → sell ₹3,32,539 (44.16%)
 *   - Canara Robeco Hybrid (3★, 6.58% weight): trim to 5.00% → sell ₹1,32,174 (23.88%)
 */
export function evaluateTrimHoldRules(
  holdings: Holding[],
  existingSellDecisions: Map<string, SellDecision>,
  totalPortfolioValue: Decimal,
): Map<string, SellDecision> {
  const trimDecisions = new Map<string, SellDecision>();

  for (const h of holdings) {
    // Only applies to 3★ funds not already being sold
    if (h.rating !== 3) continue;
    if (existingSellDecisions.has(h.isin)) continue;

    const currentValue = new Decimal(h.current_value.toString());
    const currentWeight = currentValue.dividedBy(totalPortfolioValue);

    if (currentWeight.lte(THREE_STAR_CAP)) continue; // below cap → HOLD as-is

    // Target value after capping to 5%
    const targetValue = totalPortfolioValue.times(THREE_STAR_CAP);
    const idealTrimAmount = currentValue.minus(targetValue);

    // We can only sell the freely redeemable portion
    const availUnits = new Decimal(h.available_units.toString());
    const freeUnits = new Decimal(h.units_free_from_exit_load.toString());
    const sellablePct = availUnits.isZero()
      ? new Decimal(0)
      : freeUnits.dividedBy(availUnits);

    const maxSellableAmount = currentValue.times(sellablePct);
    const actualTrimAmount = Decimal.min(idealTrimAmount, maxSellableAmount);

    if (actualTrimAmount.isZero()) continue; // nothing sellable → pure HOLD

    trimDecisions.set(h.isin, {
      isin: h.isin,
      sell_amount: actualTrimAmount,
      rule_id: 'R3_cap_to_5pct',
      is_full_sell: false,
    });
  }

  return trimDecisions;
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4: generateActionPlan
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Master orchestrator — runs all phases and produces the Final Action table.
 *
 * Steps:
 *   1. Calculate total portfolio value and current allocation.
 *   2. Run sell rules (Phase 2).
 *   3. Run trim/hold rules (Phase 3).
 *   4. Build RecommendationItem for every holding (SELL / TRIM/HOLD / HOLD).
 *   5. Compute net cash from all sells.
 *   6. Calculate allocation gaps vs. mandate target.
 *   7. Generate BUY recommendations using Rank-1 5★ funds.
 *   8. Return the full action plan with summary totals.
 *
 * @param holdings       - Current holdings from "User Data" sheet.
 * @param mandate        - Target risk mandate name.
 * @param fundUniverse   - Available funds for new purchases (defaults to built-in list).
 */
export function generateActionPlan(
  holdings: Holding[],
  mandate: MandateName,
  fundUniverse: FundCandidate[] = DEFAULT_FUND_UNIVERSE,
): {
  recommendations: RecommendationItem[];
  currentAllocation: AllocationBreakdown;
  summary: RebalanceSummary;
} {
  // ── Step 1: Portfolio totals ──────────────────────────────────────────────
  const totalPortfolioValue = holdings.reduce(
    (sum, h) => sum.plus(new Decimal(h.current_value.toString())),
    new Decimal(0),
  );

  const currentAllocation = calculateCurrentAllocation(holdings);

  // ── Step 2: Sell rules ───────────────────────────────────────────────────
  const sellDecisions = evaluateSellRules(holdings, totalPortfolioValue);

  // ── Step 3: Trim/hold rules ───────────────────────────────────────────────
  const trimDecisions = evaluateTrimHoldRules(
    holdings,
    sellDecisions,
    totalPortfolioValue,
  );

  // Merge all sell/trim decisions into one map
  const allSellDecisions = new Map<string, SellDecision>([
    ...sellDecisions,
    ...trimDecisions,
  ]);

  // ── Step 4: Build recommendation items for existing holdings ─────────────
  const recommendations: RecommendationItem[] = [];
  let totalNetCash = new Decimal(0);

  for (const h of holdings) {
    const currentValue = new Decimal(h.current_value.toString());
    const portfolioWeight = totalPortfolioValue.isZero()
      ? new Decimal(0)
      : currentValue.dividedBy(totalPortfolioValue).times(100);

    // Sellability metrics
    const availUnits = new Decimal(h.available_units.toString());
    const freeUnits = new Decimal(h.units_free_from_exit_load.toString());
    const exitLoadUnits = new Decimal(h.units_under_exit_load.toString());
    const stcgUnits = new Decimal(h.short_term_units.toString());

    const pctSellable = availUnits.isZero()
      ? 0
      : freeUnits.dividedBy(availUnits).times(100).toDecimalPlaces(2).toNumber();
    const pctExitLoad = availUnits.isZero()
      ? 0
      : exitLoadUnits.dividedBy(availUnits).times(100).toDecimalPlaces(2).toNumber();
    const pctStcg = availUnits.isZero()
      ? 0
      : stcgUnits.dividedBy(availUnits).times(100).toDecimalPlaces(2).toNumber();

    const decision = allSellDecisions.get(h.isin);

    // ── Case A: Fund being sold (full or partial) ─────────────────────────
    if (decision !== undefined) {
      const sellAmt = decision.sell_amount;
      const isFullSell = decision.is_full_sell || sellAmt.gte(currentValue.times('0.9999'));

      // Tax estimate: proportional gains × tax rate
      const sellPct = currentValue.isZero()
        ? new Decimal(0)
        : sellAmt.dividedBy(currentValue);

      const stGains = new Decimal(h.short_term_gains.toString());
      const ltGains = new Decimal(h.long_term_gains.toString());

      const realizedStGain = stGains.times(sellPct).toDecimalPlaces(2);
      const realizedLtGain = ltGains.times(sellPct).toDecimalPlaces(2);

      const taxOnSt = realizedStGain.gt(0)
        ? realizedStGain.times(STCG_RATE).toDecimalPlaces(2)
        : new Decimal(0);
      const taxOnLt = realizedLtGain.gt(0)
        ? realizedLtGain.times(LTCG_RATE).toDecimalPlaces(2)
        : new Decimal(0);
      const totalTax = taxOnSt.plus(taxOnLt);

      const realizedGain = realizedStGain.plus(realizedLtGain);

      // Exit load: proportional
      const exitLoadAmt = new Decimal(h.exit_load_amount.toString())
        .times(sellPct)
        .toDecimalPlaces(2);

      const netCash = sellAmt.minus(exitLoadAmt); // tax is advisory, not deducted from gross proceeds
      totalNetCash = totalNetCash.plus(netCash);

      const finalValue = currentValue.minus(sellAmt).toDecimalPlaces(2);
      const finalWeight = totalPortfolioValue.isZero()
        ? 0
        : finalValue.dividedBy(totalPortfolioValue).times(100).toDecimalPlaces(4).toNumber();

      const isTrim = decision.rule_id === 'R3_cap_to_5pct';
      const action: 'SELL' | 'TRIM/HOLD' = isTrim && !isFullSell ? 'TRIM/HOLD' : 'SELL';

      // Build human-readable comment matching the spreadsheet style
      const comment = buildSellComment(h, action, decision.rule_id, {
        exitLoadAmt,
        totalTax,
        pctSellable,
        pctExitLoad,
        pctStcg,
      });

      recommendations.push({
        isin: h.isin,
        fund_name: h.fund_name,
        category: h.category,
        category_group: getCategoryGroup(h.category),
        rating: h.rating,
        rating_star: formatStarRating(h.rating),
        value_now: currentValue.toNumber(),
        sold_amount: sellAmt.toDecimalPlaces(2).toNumber(),
        buy_amount: 0,
        final_value: finalValue.toNumber(),
        final_weight_pct: finalWeight,
        exit_amt_sold: exitLoadAmt.toNumber(),
        tax_est_amt_sold: totalTax.toNumber(),
        realized_gain_sold: realizedGain.toNumber(),
        net_cash_from_sells: netCash.toNumber(),
        why_selling: decision.rule_id,
        why_buying: null,
        pct_value_in_stcg: pctStcg,
        pct_value_in_exit_load: pctExitLoad,
        pct_value_sellable_now: pctSellable,
        action,
        comment,
        flag_under_2pct: portfolioWeight.lt(2),
        flag_over_25pct: portfolioWeight.gt(25),
        flag_three_over_5: h.rating === 3 && portfolioWeight.gt(5),
        flag_debt_rotation_category: false,
        flag_lockin_category: isLockInCategory(h.category),
        flag_sold_due_to_debt_rotation: false,
        flag_sold_due_to_lockin: decision.rule_id === 'R_LOCKIN_FREE_SELL',
        flag_sold_low_rating: decision.rule_id === 'R5_3star_zero_if_45_in_cat',
        flag_sold_overlap: false,
        flag_trim_3star_cap: decision.rule_id === 'R3_cap_to_5pct',
      });

      continue;
    }

    // ── Case B: HOLD ─────────────────────────────────────────────────────
    const comment = buildHoldComment(h, {
      portfolioWeight,
      pctSellable,
      pctExitLoad,
      pctStcg,
      holdings,
    });

    recommendations.push({
      isin: h.isin,
      fund_name: h.fund_name,
      category: h.category,
      category_group: getCategoryGroup(h.category),
      rating: h.rating,
      rating_star: formatStarRating(h.rating),
      value_now: currentValue.toNumber(),
      sold_amount: 0,
      buy_amount: 0,
      final_value: currentValue.toNumber(),
      final_weight_pct: portfolioWeight.toDecimalPlaces(4).toNumber(),
      exit_amt_sold: 0,
      tax_est_amt_sold: 0,
      realized_gain_sold: 0,
      net_cash_from_sells: 0,
      why_selling: null,
      why_buying: null,
      pct_value_in_stcg: pctStcg,
      pct_value_in_exit_load: pctExitLoad,
      pct_value_sellable_now: pctSellable,
      action: 'HOLD',
      comment,
      flag_under_2pct: portfolioWeight.lt(2),
      flag_over_25pct: portfolioWeight.gt(25),
      flag_three_over_5: false,
      flag_debt_rotation_category: false,
      flag_lockin_category: isLockInCategory(h.category),
      flag_sold_due_to_debt_rotation: false,
      flag_sold_due_to_lockin: false,
      flag_sold_low_rating: false,
      flag_sold_overlap: false,
      flag_trim_3star_cap: false,
    });
  }

  // ── Step 5: Calculate allocation gaps ────────────────────────────────────
  const mandateTarget = RISK_MANDATES[mandate];

  // Post-sell portfolio value (after subtracting all sells from holdings)
  const postSellValue = totalPortfolioValue.minus(
    [...allSellDecisions.values()].reduce(
      (sum, d) => sum.plus(d.sell_amount),
      new Decimal(0),
    ),
  );

  // Target ₹ amounts per bucket
  const targetValues: Partial<Record<AllocationBucket, Decimal>> = {
    large_cap:  postSellValue.times(mandateTarget.large_cap),
    mid_cap:    postSellValue.times(mandateTarget.mid_cap),
    small_cap:  postSellValue.times(mandateTarget.small_cap),
    gold:       postSellValue.times(mandateTarget.gold),
    debt:       postSellValue.times(mandateTarget.debt),
    thematic:   postSellValue.times(mandateTarget.thematic),
  };

  // Current ₹ per bucket after sells
  const postSellBuckets: Partial<Record<AllocationBucket, Decimal>> = {};
  for (const rec of recommendations) {
    const bucket = getAllocationBucket(rec.category);
    const val = new Decimal(rec.final_value.toString());
    postSellBuckets[bucket] = (postSellBuckets[bucket] ?? new Decimal(0)).plus(val);
  }

  // ── Step 6: Generate BUY recommendations ──────────────────────────────────
  // Allocate totalNetCash proportionally to buckets that are below target.
  let remainingCash = totalNetCash;

  const gaps: Array<{ bucket: AllocationBucket; gap: Decimal }> = [];
  for (const [bucket, targetVal] of Object.entries(targetValues) as [AllocationBucket, Decimal][]) {
    const currentVal = postSellBuckets[bucket] ?? new Decimal(0);
    const gap = targetVal.minus(currentVal);
    if (gap.gt(0)) {
      gaps.push({ bucket, gap });
    }
  }

  const totalGap = gaps.reduce((sum, g) => sum.plus(g.gap), new Decimal(0));

  for (const { bucket, gap } of gaps) {
    if (remainingCash.isZero() || totalGap.isZero()) break;

    // Proportional allocation from available sell cash
    const buyAmount = remainingCash.times(gap.dividedBy(totalGap)).toDecimalPlaces(2);
    if (buyAmount.lte(0)) continue;

    // Find Rank-1 5★ fund for this bucket
    const candidate = (fundUniverse)
      .filter((f) => f.allocation_bucket === bucket && f.rating === 5)
      .sort((a, b) => a.rank_in_category - b.rank_in_category)[0];

    if (!candidate) continue;

    const buyRuleId = BUCKET_TO_BUY_RULE[bucket] as BuyRuleId | undefined;
    if (!buyRuleId) continue;

    const buyPctOfDeployedCash = totalNetCash.isZero()
      ? 0
      : buyAmount.dividedBy(totalNetCash).times(100).toDecimalPlaces(2).toNumber();

    recommendations.push({
      isin: candidate.isin,
      fund_name: candidate.fund_name,
      category: candidate.category,
      category_group: 'Equity',
      rating: candidate.rating,
      rating_star: formatStarRating(candidate.rating),
      value_now: 0,
      sold_amount: 0,
      buy_amount: buyAmount.toNumber(),
      final_value: buyAmount.toNumber(),
      final_weight_pct: postSellValue.isZero()
        ? 0
        : buyAmount.dividedBy(postSellValue).times(100).toDecimalPlaces(4).toNumber(),
      exit_amt_sold: 0,
      tax_est_amt_sold: 0,
      realized_gain_sold: 0,
      net_cash_from_sells: 0,
      why_selling: null,
      why_buying: buyRuleId,
      pct_value_in_stcg: 0,
      pct_value_in_exit_load: 0,
      pct_value_sellable_now: 0,
      action: 'BUY (NEW)',
      comment: buildBuyComment(candidate, buyRuleId, buyPctOfDeployedCash),
      flag_under_2pct: false,
      flag_over_25pct: false,
      flag_three_over_5: false,
      flag_debt_rotation_category: false,
      flag_lockin_category: false,
      flag_sold_due_to_debt_rotation: false,
      flag_sold_due_to_lockin: false,
      flag_sold_low_rating: false,
      flag_sold_overlap: false,
      flag_trim_3star_cap: false,
    });

    remainingCash = remainingCash.minus(buyAmount);
  }

  // ── Step 7: Build summary ─────────────────────────────────────────────────
  const summary = buildSummary(recommendations, totalPortfolioValue);

  return { recommendations, currentAllocation, summary };
}

// ─────────────────────────────────────────────────────────────────────────────
// Comment builders — match the human-readable format in the spreadsheet
// ─────────────────────────────────────────────────────────────────────────────

function buildSellComment(
  _h: Holding,
  action: 'SELL' | 'TRIM/HOLD',
  ruleId: SellRuleId | TrimRuleId,
  ctx: {
    exitLoadAmt: Decimal;
    totalTax: Decimal;
    pctSellable: number;
    pctExitLoad: number;
    pctStcg: number;
  },
): string {
  const exitFmt = `₹${ctx.exitLoadAmt.toFixed(0)}`;
  const taxFmt = `₹${ctx.totalTax.toFixed(0)}`;

  const ruleDesc: Record<SellRuleId | TrimRuleId, string> = {
    R_LOCKIN_FREE_SELL: 'Lock-in completed: sell free units from lock-in category.',
    R5_3star_zero_if_45_in_cat: '3★ fund removed because a 4★/5★ fund exists in the same category.',
    R3_cap_to_5pct: 'Trim 3★ exposure down to 5% cap.',
  };

  const verb = action === 'TRIM/HOLD' ? 'Partially sold/trimmed because' : 'Sold because';
  const holdNote =
    action === 'TRIM/HOLD'
      ? ` Held remainder due to cost/timing: ${ctx.pctSellable < 100 ? `Only ${ctx.pctSellable.toFixed(1)}% was sellable within horizon` : 'remaining lots kept to avoid unnecessary churn'}.`
      : '';

  return (
    `${verb}: ${ruleDesc[ruleId]}${holdNote} ` +
    `Est. exit load ${exitFmt}, tax ${taxFmt}. ` +
    `Context: Sellable-now=${ctx.pctSellable.toFixed(1)}%, ` +
    `Exit-load-window=${ctx.pctExitLoad.toFixed(1)}%, ` +
    `STCG-window=${ctx.pctStcg.toFixed(1)}%.`
  );
}

function buildHoldComment(
  h: Holding,
  ctx: {
    portfolioWeight: Decimal;
    pctSellable: number;
    pctExitLoad: number;
    pctStcg: number;
    holdings: Holding[];
  },
): string {
  const wt = ctx.portfolioWeight.toDecimalPlaces(2).toNumber();
  const base = `Held (no trade). Rating=${formatStarRating(h.rating)}. Category=${h.category}.`;

  let reason = '';

  if (h.rating >= 4) {
    reason = ` Why held: Rating is 4★/5★ (not sold unless cost-free + rules demand it).`;
  } else if (h.rating === 3) {
    const hasHigherInCat = ctx.holdings.some(
      (o) =>
        o.isin !== h.isin &&
        o.category.toLowerCase() === h.category.toLowerCase() &&
        o.rating >= 4,
    );
    if (!hasHigherInCat) {
      reason = ` Why held: Rating is 3★, but no 4★/5★ fund exists in same category. Weight ${wt.toFixed(2)}% ≤ 5.00% cap.`;
    } else {
      reason = ` Why held: 3★ but weight ${wt.toFixed(2)}% ≤ 5.00% cap; no forced-sell rule matched.`;
    }
  }

  return (
    base +
    reason +
    ` Context: Sellable-now=${ctx.pctSellable.toFixed(1)}%, ` +
    `Exit-load-window=${ctx.pctExitLoad.toFixed(1)}%, ` +
    `STCG-window=${ctx.pctStcg.toFixed(1)}%.`
  );
}

function buildBuyComment(
  candidate: FundCandidate,
  ruleId: BuyRuleId,
  pctOfCash: number,
): string {
  const bucketLabel: Record<string, string> = {
    EQ_LARGE_NEW_R5_RANK1:    'Large-cap',
    EQ_MID_NEW_R5_RANK1:      'Mid-cap',
    EQ_SMALL_NEW_R5_RANK1:    'Small-cap',
    EQ_THEMATIC_NEW_R5_RANK1: 'Thematic',
  };
  const label = bucketLabel[ruleId] ?? 'category';
  return (
    `New buy to rebalance toward mandates. ` +
    `Selection reason: New buy: 5★ ${label} Rank ${candidate.rank_in_category}. ` +
    `Deployed ${pctOfCash.toFixed(2)}% of available sell cash.`
  );
}

function buildSummary(
  recommendations: RecommendationItem[],
  totalPortfolioValue: Decimal,
): RebalanceSummary {
  let totalSell = new Decimal(0);
  let totalBuy = new Decimal(0);
  let totalExitLoad = new Decimal(0);
  let totalTax = new Decimal(0);
  let netCash = new Decimal(0);
  let sellCount = 0;
  let buyCount = 0;
  let holdCount = 0;
  let trimCount = 0;

  for (const rec of recommendations) {
    switch (rec.action) {
      case 'SELL':
        totalSell = totalSell.plus(rec.sold_amount);
        totalExitLoad = totalExitLoad.plus(rec.exit_amt_sold);
        totalTax = totalTax.plus(rec.tax_est_amt_sold);
        netCash = netCash.plus(rec.net_cash_from_sells);
        sellCount++;
        break;
      case 'TRIM/HOLD':
        totalSell = totalSell.plus(rec.sold_amount);
        totalExitLoad = totalExitLoad.plus(rec.exit_amt_sold);
        totalTax = totalTax.plus(rec.tax_est_amt_sold);
        netCash = netCash.plus(rec.net_cash_from_sells);
        trimCount++;
        break;
      case 'BUY (NEW)':
        totalBuy = totalBuy.plus(rec.buy_amount);
        buyCount++;
        break;
      case 'HOLD':
        holdCount++;
        break;
    }
  }

  return {
    total_portfolio_value: totalPortfolioValue.toNumber(),
    total_sell_value: totalSell.toDecimalPlaces(2).toNumber(),
    total_buy_value: totalBuy.toDecimalPlaces(2).toNumber(),
    total_exit_load_est: totalExitLoad.toDecimalPlaces(2).toNumber(),
    total_tax_est: totalTax.toDecimalPlaces(2).toNumber(),
    net_cash_generated: netCash.toDecimalPlaces(2).toNumber(),
    funds_to_sell: sellCount,
    funds_to_buy: buyCount,
    funds_to_hold: holdCount,
    funds_to_trim: trimCount,
  };
}
