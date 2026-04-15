/**
 * types.ts
 * Canonical TypeScript interfaces for the Aegis Rebalance Engine.
 * Every field maps 1:1 to the Rebalance V0.xlsx schema documented in arch.md.
 *
 * FINANCIAL ARITHMETIC RULE: All monetary values arrive as `number` from JSON.
 * Inside the engine we immediately box them with Decimal.js. Never do float
 * arithmetic on ₹ amounts directly.
 */

// ---------------------------------------------------------------------------
// Mandate / Allocation types
// ---------------------------------------------------------------------------

export type MandateName =
  | 'Conservative'
  | 'Low'
  | 'Moderate'
  | 'High'
  | 'Aggressive';

/**
 * Allocation bucket labels. These are the categories used in target mandates.
 * Maps to the column headers in the ML Recommendation sheet.
 */
export type AllocationBucket =
  | 'large_cap'
  | 'mid_cap'
  | 'small_cap'
  | 'gold'
  | 'debt'
  | 'thematic'
  | 'international' // FoF Overseas — not in mandate targets for Aggressive but tracked
  | 'hybrid'; // Aggressive Hybrid — tracked separately, counts toward large_cap in mandate

export interface MandateAllocation {
  name: MandateName;
  large_cap: number; // 0.0 – 1.0
  mid_cap: number;
  small_cap: number;
  gold: number;
  debt: number;
  thematic: number;
  aif: number;
  pms: number;
  unlisted: number;
}

export interface AllocationBreakdown {
  large_cap: number; // current value in ₹
  mid_cap: number;
  small_cap: number;
  gold: number;
  debt: number;
  thematic: number;
  international: number;
  hybrid: number;
  total: number;
  percentages: Record<AllocationBucket, number>; // 0.0 – 100.0
}

// ---------------------------------------------------------------------------
// Holding — maps to "User Data → Fund Level Detail" rows
// ---------------------------------------------------------------------------

export interface Holding {
  /** Display name of the mutual fund */
  fund_name: string;
  /** ISIN: unique fund identifier, e.g. INF879O01027 */
  isin: string;
  /** MF category as per SEBI classification, e.g. "Flexi Cap Fund", "ELSS" */
  category: string;
  /** Star rating: 1–5 */
  rating: number;
  /** Broad asset class: "Equity" | "Debt" | "Hybrid" | "Fixed Income" */
  asset_class: string;
  /** Total redeemable units currently held */
  available_units: number;
  /** Units held < 1 year; STCG (12.5%) applies on gains */
  short_term_units: number;
  /** Units held ≥ 1 year; LTCG (12.5% above ₹1.25L) applies on gains */
  long_term_units: number;
  /** Unrealized short-term gains (can be negative = unrealized loss) */
  short_term_gains: number;
  /** Unrealized long-term gains */
  long_term_gains: number;
  /** Estimated total tax payable if fully redeemed today */
  tax_payable: number;
  /** Estimated exit load payable if fully redeemed today */
  exit_load_amount: number;
  /** Units still within the exit load window */
  units_under_exit_load: number;
  /** Units past the exit load window — freely redeemable without penalty */
  units_free_from_exit_load: number;
  /** Current market value: NAV × available_units */
  current_value: number;
}

// ---------------------------------------------------------------------------
// Fund Universe — candidates available for new purchases
// ---------------------------------------------------------------------------

export interface FundCandidate {
  isin: string;
  fund_name: string;
  category: string;
  /** SEBI allocation bucket this fund targets */
  allocation_bucket: AllocationBucket;
  rating: number;
  /** Lower = better. Rank 1 = top pick in category. */
  rank_in_category: number;
}

// ---------------------------------------------------------------------------
// Rule identifiers
// ---------------------------------------------------------------------------

/** Sell rule IDs — applied in Phase 1 (sell pass) */
export type SellRuleId =
  | 'R_LOCKIN_FREE_SELL'       // ELSS lock-in period completed → sell free units
  | 'R5_3star_zero_if_45_in_cat'; // 3★ fund fully replaced by 4★/5★ in same category

/** Trim/hold rule IDs — applied in Phase 2 (trim pass) */
export type TrimRuleId =
  | 'R3_cap_to_5pct'; // Cap 3★ fund exposure at 5% of portfolio

/** Buy rule IDs — applied in Phase 3 (buy pass) */
export type BuyRuleId =
  | 'EQ_LARGE_NEW_R5_RANK1'
  | 'EQ_MID_NEW_R5_RANK1'
  | 'EQ_SMALL_NEW_R5_RANK1'
  | 'EQ_THEMATIC_NEW_R5_RANK1';

export type RuleId = SellRuleId | TrimRuleId | BuyRuleId;

// ---------------------------------------------------------------------------
// Final Action — output of the rules engine (maps to ML Recommendation sheet)
// ---------------------------------------------------------------------------

export type FinalActionType = 'BUY (NEW)' | 'SELL' | 'HOLD' | 'TRIM/HOLD';

export interface RecommendationItem {
  isin: string;
  fund_name: string;
  category: string;
  category_group: string; // 'Equity' | 'Hybrid' | 'Fixed Income'
  rating: number;
  rating_star: string; // '5★', '3★' etc.
  value_now: number; // Current holding value before rebalance
  sold_amount: number; // Amount to sell (0 for HOLD / BUY)
  buy_amount: number; // Amount to buy (0 for SELL / HOLD)
  final_value: number; // value_now - sold_amount + buy_amount
  final_weight_pct: number; // % of total portfolio after rebalance
  exit_amt_sold: number; // Exit load incurred on sell
  tax_est_amt_sold: number; // Estimated tax on realized gains
  realized_gain_sold: number; // Capital gain realized
  net_cash_from_sells: number; // Net cash after exit load (before tax)
  why_selling: RuleId | null;
  why_buying: RuleId | null;
  /** % of holding currently in STCG window */
  pct_value_in_stcg: number;
  /** % of holding currently under exit load window */
  pct_value_in_exit_load: number;
  /** % of holding freely sellable right now */
  pct_value_sellable_now: number;
  action: FinalActionType;
  comment: string;
  // --- Boolean flags ---
  flag_under_2pct: boolean;
  flag_over_25pct: boolean;
  flag_three_over_5: boolean;
  flag_debt_rotation_category: boolean;
  flag_lockin_category: boolean;
  flag_sold_due_to_debt_rotation: boolean;
  flag_sold_due_to_lockin: boolean;
  flag_sold_low_rating: boolean;
  flag_sold_overlap: boolean;
  flag_trim_3star_cap: boolean;
}

// ---------------------------------------------------------------------------
// Rebalance summary totals
// ---------------------------------------------------------------------------

export interface RebalanceSummary {
  total_portfolio_value: number;
  total_sell_value: number;
  total_buy_value: number;
  total_exit_load_est: number;
  total_tax_est: number;
  net_cash_generated: number;
  funds_to_sell: number;
  funds_to_buy: number;
  funds_to_hold: number;
  funds_to_trim: number;
}

// ---------------------------------------------------------------------------
// API Request / Response
// ---------------------------------------------------------------------------

export interface RebalanceRequest {
  user_account_id: string;
  mandate: MandateName;
  holdings: Holding[];
  /** Optional universe of candidate funds for new purchases.
   *  If omitted, engine uses built-in defaults from mandateProfiles. */
  fund_universe?: FundCandidate[];
}

export interface RebalanceResponse {
  data: {
    user_account_id: string;
    mandate: MandateName;
    total_portfolio_value: number;
    current_allocation: AllocationBreakdown;
    target_allocation: AllocationBreakdown;
    recommendations: RecommendationItem[];
    summary: RebalanceSummary;
  };
}
