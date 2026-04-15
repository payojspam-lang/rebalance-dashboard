/**
 * mockPortfolioData.js
 * Generates deterministic full portfolio data for all 50 clients.
 * All values are seeded from the user's ID so they're stable across reloads.
 */
import { mockUsers } from './mockData';

// ── Seeded random ──────────────────────────────────────────────────────────────
function idSeed(userId) {
  return parseInt(userId.replace('user-', ''), 10);
}
function sf(n) {                       // seeded float [0, 1)
  const x = Math.sin(n * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}
function sfRange(n, lo, hi) { return lo + sf(n) * (hi - lo); }
function pick(arr, n)        { return arr[Math.floor(sf(n) * arr.length)]; }
function round2(v)           { return Math.round(v * 100) / 100; }

// ── Mandate templates ──────────────────────────────────────────────────────────
const MANDATES = {
  Aggressive: {
    description: "High-growth portfolio targeting long-term capital appreciation. Higher exposure to mid and small-cap equities; minimal debt allocation.",
    targetAllocation: [
      { assetClass: "Large Cap",  min: 35, max: 50, target: 41.10 },
      { assetClass: "Mid Cap",    min: 20, max: 30, target: 25.49 },
      { assetClass: "Small Cap",  min: 10, max: 20, target: 17.11 },
      { assetClass: "Debt",       min: 10, max: 20, target: 16.08 },
      { assetClass: "Gold",       min: 0,  max: 5,  target: 0.23  },
    ],
  },
  Moderate: {
    description: "Balanced portfolio with equal emphasis on growth and capital preservation. Mix of large cap equity and debt instruments.",
    targetAllocation: [
      { assetClass: "Large Cap",  min: 40, max: 55, target: 45.00 },
      { assetClass: "Mid Cap",    min: 10, max: 20, target: 15.00 },
      { assetClass: "Small Cap",  min: 8,  max: 18, target: 12.00 },
      { assetClass: "Debt",       min: 12, max: 22, target: 18.00 },
      { assetClass: "Gold",       min: 5,  max: 15, target: 10.00 },
    ],
  },
  Conservative: {
    description: "Capital preservation focused portfolio with dominant large cap and debt allocation. Minimal equity risk.",
    targetAllocation: [
      { assetClass: "Large Cap",  min: 50, max: 70, target: 60.00 },
      { assetClass: "Mid Cap",    min: 5,  max: 15, target: 10.00 },
      { assetClass: "Small Cap",  min: 2,  max: 8,  target: 5.00  },
      { assetClass: "Debt",       min: 12, max: 25, target: 15.00 },
      { assetClass: "Gold",       min: 5,  max: 15, target: 10.00 },
    ],
  },
};

const SPECIAL_INSTRUCTIONS = [
  "No single fund to exceed 25% of portfolio. ELSS allocation to be wound down progressively per client instruction. Prefer LTCG-friendly sell windows.",
  "Client is NRI — ensure compliance with applicable FEMA/SEBI regulations on fund categories. Avoid funds with NRI restrictions. Minimize FPI exposure.",
  "Client prefers no direct equity. All equity via diversified mutual funds only. Exit load sensitive — avoid redemptions within 12-month window where possible.",
  "Tax-harvesting strategy preferred: realise losses in STCG window to offset gains. Client is in 30% tax bracket. Maximise LTCG treatment on all sells.",
  "Client is approaching retirement in 3 years. Gradually shift equity allocation down by 5% per annum. Increase debt and gold allocation accordingly.",
  "SIP mandates running on the following funds — do not redeem SIP units separately. Rebalance only free units. Coordinate new buys with SIP dates.",
  "Client has existing PMS allocation of ₹50L (not reflected here). Net rebalancing targets must account for total portfolio including PMS.",
  "Mandate reviewed and updated this quarter. Previous mandate was Conservative — client upgraded to Moderate. Phased transition over 2 rebalancing cycles.",
];

// ── Fund pool ──────────────────────────────────────────────────────────────────
const FUNDS = {
  largeCap5: [
    { name: "Nippon India Large Cap Fund",    isin: "INF204K01D30", rating: 5, category: "Large Cap" },
    { name: "ICICI Pru Bluechip Fund",        isin: "INF109K01Z13", rating: 5, category: "Large Cap" },
    { name: "HDFC Top 100 Fund",              isin: "INF179K01VW4", rating: 5, category: "Large Cap" },
  ],
  largeCap4: [
    { name: "Mirae Asset Large Cap Fund",     isin: "INF769K01023", rating: 4, category: "Large Cap" },
    { name: "SBI Bluechip Fund",              isin: "INF200K01RB2", rating: 4, category: "Large Cap" },
    { name: "Axis Bluechip Fund",             isin: "INF846K01Y43", rating: 4, category: "Large Cap" },
  ],
  largeCap3: [
    { name: "UTI Mastershare Fund",           isin: "INF789F01RS7", rating: 3, category: "Large Cap" },
    { name: "Franklin India Bluechip Fund",   isin: "INF090I01FH5", rating: 3, category: "Large Cap" },
  ],
  midCap5: [
    { name: "HDFC Mid Cap Opportunities",     isin: "INF179K01XQ0", rating: 5, category: "Mid Cap"   },
    { name: "Kotak Emerging Equity Fund",     isin: "INF174K01LS2", rating: 5, category: "Mid Cap"   },
    { name: "HSBC Midcap Fund",               isin: "INF917K01FZ1", rating: 5, category: "Mid Cap"   },
  ],
  midCap4: [
    { name: "PGIM India Mid Cap Fund",        isin: "INF663L01DE2", rating: 4, category: "Mid Cap"   },
    { name: "DSP Mid Cap Fund",               isin: "INF740K01LQ0", rating: 4, category: "Mid Cap"   },
  ],
  midCap3: [
    { name: "Axis Mid Cap Fund",              isin: "INF846K01EZ9", rating: 3, category: "Mid Cap"   },
    { name: "UTI Mid Cap Fund",               isin: "INF789F01YO2", rating: 3, category: "Mid Cap"   },
  ],
  smallCap5: [
    { name: "Nippon India Small Cap Fund",    isin: "INF204K01I28", rating: 5, category: "Small Cap" },
    { name: "SBI Small Cap Fund",             isin: "INF200K01RN7", rating: 5, category: "Small Cap" },
    { name: "BANDHAN Small Cap Fund",         isin: "INF194KB1AL4", rating: 5, category: "Small Cap" },
  ],
  smallCap3: [
    { name: "Quant Small Cap Fund",           isin: "INF966L01075", rating: 3, category: "Small Cap" },
    { name: "UTI Small Cap Fund",             isin: "INF789F01TZ6", rating: 3, category: "Small Cap" },
  ],
  debt5: [
    { name: "Axis Banking & PSU Debt Fund",   isin: "INF846K01DI3", rating: 5, category: "Dynamic Bond" },
    { name: "HDFC Short Term Debt Fund",      isin: "INF179K01VQ7", rating: 5, category: "Short Duration" },
  ],
  debt4: [
    { name: "Kotak Bond Short Term Fund",     isin: "INF174K01MO1", rating: 4, category: "Short Duration" },
    { name: "Bandhan Govt Securities Fund",   isin: "INF194K01Q29", rating: 4, category: "Gilt Fund"      },
  ],
  liquid5: [
    { name: "Axis Overnight Fund",            isin: "INF846K01N65", rating: 5, category: "Overnight Fund" },
    { name: "HDFC Liquid Fund",               isin: "INF179K01XN7", rating: 5, category: "Liquid Fund"    },
  ],
  elss5: [
    { name: "Mirae Asset ELSS Tax Saver",     isin: "INF769K01DM9", rating: 5, category: "ELSS" },
    { name: "Axis ELSS Tax Saver Fund",       isin: "INF846K01A77", rating: 5, category: "ELSS" },
  ],
  elss2: [
    { name: "Franklin India ELSS Tax Saver",  isin: "INF090I01JS8", rating: 2, category: "ELSS" },
    { name: "Aditya Birla SL ELSS Tax Saver", isin: "INF209K01108", rating: 2, category: "ELSS" },
  ],
  flexiCap4: [
    { name: "Parag Parikh Flexi Cap Fund",    isin: "INF879O01027", rating: 4, category: "Flexi Cap" },
    { name: "HDFC Flexi Cap Fund",            isin: "INF179K01VJ9", rating: 4, category: "Flexi Cap" },
  ],
  flexiCap3: [
    { name: "BANDHAN Flexi Cap Fund",         isin: "INF194K01W62", rating: 3, category: "Flexi Cap" },
    { name: "UTI Flexi Cap Fund",             isin: "INF789F01XH5", rating: 3, category: "Flexi Cap" },
  ],
  index3: [
    { name: "UTI Nifty 50 Index Fund",        isin: "INF789F01XA0", rating: 3, category: "Index Funds" },
    { name: "HDFC Nifty 50 Index Fund",       isin: "INF179KB1BO7", rating: 3, category: "Index Funds" },
  ],
};

// ── Allocation ─────────────────────────────────────────────────────────────────
function makeAllocation(user, mandate) {
  const s = idSeed(user.id);
  const targets = mandate.targetAllocation;
  const drift = user.drift;

  // Primary asset class deviation = drift (Large Cap over or under)
  const dir = sf(s + 1) > 0.4 ? 1 : -1;
  const primaryExcess = drift * sfRange(s + 2, 0.7, 1.0) * dir;

  const raw = targets.map((t, i) => {
    if (i === 0) return t.target + primaryExcess;
    // Distribute inverse proportionally across other classes
    return t.target - (primaryExcess * t.target) / (100 - targets[0].target);
  });

  // Normalize to sum = 100
  const sum = raw.reduce((a, v) => a + v, 0);
  return targets.map((t, i) => ({
    category:   t.assetClass,
    current:    round2(Math.max(0.1, raw[i] * 100 / sum)),
    target:     t.target,
  }));
}

// ── Mandate detail ─────────────────────────────────────────────────────────────
function makeMandateDetail(user, mandate) {
  const s = idSeed(user.id);
  return {
    riskMandate:          mandate.riskMandate ?? user.riskMandate,
    description:          mandate.description,
    targetAllocation:     mandate.targetAllocation,
    specialInstructions:  pick(SPECIAL_INSTRUCTIONS, s + 50),
  };
}

// ── Recommendations ────────────────────────────────────────────────────────────
const STATUS_POOL = {
  P1: ["PENDING","PENDING","PENDING","PENDING","APPROVED","APPROVED","L2_PENDING","REJECTED"],
  P2: ["PENDING","PENDING","PENDING","APPROVED","APPROVED","IN_PROGRESS"],
  P3: ["APPROVED","APPROVED","COMPLETED","COMPLETED"],
};
const REC_STATUS_MAP = { P1: 8, P2: 6, P3: 4 };

function makeRecommendations(user, mandate) {
  const s = idSeed(user.id);
  const count = REC_STATUS_MAP[user.priority];
  const statusPool = STATUS_POOL[user.priority];

  // Build a pool of fund-action pairs based on drift and mandate
  const pool = [];

  if (user.drift > 5) {
    // SELL — low rated or ELSS lock-in
    pool.push({ ...pick(FUNDS.elss2, s + 1),  action: "SELL",      sellPct: sfRange(s+11, 60, 100) });
    pool.push({ ...pick(FUNDS.flexiCap3, s+2), action: "SELL",      sellPct: 100 });
    // TRIM/HOLD — 3★ over cap
    pool.push({ ...pick(FUNDS.index3, s+3),    action: "TRIM/HOLD", sellPct: sfRange(s+12, 20, 45) });
    if (user.drift > 7) {
      pool.push({ ...pick(FUNDS.midCap3, s+4), action: "TRIM/HOLD", sellPct: sfRange(s+13, 15, 35) });
    }
  }
  // HOLD — high rated funds
  pool.push({ ...pick(FUNDS.largeCap5, s+5), action: "HOLD", sellPct: 0 });
  pool.push({ ...pick(FUNDS.midCap5,   s+6), action: "HOLD", sellPct: 0 });
  pool.push({ ...pick(FUNDS.debt5,     s+7), action: "HOLD", sellPct: 0 });
  pool.push({ ...pick(FUNDS.liquid5,   s+8), action: "HOLD", sellPct: 0 });
  if (mandate.riskMandate !== "Conservative") {
    pool.push({ ...pick(FUNDS.elss5,   s+9), action: "HOLD", sellPct: 0 });
  }
  // BUY — new 5★ positions
  pool.push({ ...pick(FUNDS.largeCap5, s+15), action: "BUY", sellPct: 0 });
  if (user.drift > 3) {
    pool.push({ ...pick(FUNDS.smallCap5, s+16), action: "BUY", sellPct: 0 });
  }

  const selected = pool.slice(0, count);

  return selected.map((f, i) => {
    const si = s + i * 7;
    const currentValue = Math.round(sfRange(si, 0.03, 0.18) * user.aum);
    const sellAmount   = f.action !== "HOLD" ? Math.round(currentValue * f.sellPct / 100) : 0;

    return {
      id:                `${user.id}-rec-${String(i+1).padStart(3,"0")}`,
      isin:              f.isin,
      assetName:         f.name,
      category:          f.category,
      rating:            f.rating,
      currentValue:      f.action === "BUY" ? 0 : currentValue,
      currentWeight:     f.action === "BUY" ? 0 : round2(sfRange(si+1, 2, 18)),
      recommendedAction: f.action,
      amount:            f.action === "BUY" ? Math.round(sfRange(si+2, 0.05, 0.15) * user.aum) : sellAmount,
      status:            statusPool[i % statusPool.length],
      comment:           buildComment(f, user),
      pctValueInStcg:    round2(sfRange(si+3, 0, 40)),
      pctValueInExitLoad: round2(sfRange(si+4, 0, 35)),
      pctValueSellableNow: round2(sfRange(si+5, 55, 100)),
      exitAmtSold:       Math.round(sfRange(si+6, 0, 0.015) * sellAmount),
      taxEstAmtSold:     f.action !== "HOLD" ? Math.round(sfRange(si+7, 0.05, 0.125) * sellAmount) : 0,
      realizedGainSold:  Math.round(sfRange(si+8, 0.2, 0.6) * sellAmount),
      flags:             buildFlags(f, user),
      createdAt:         "2026-04-06T09:00:00Z",
    };
  });
}

function buildComment(f, user) {
  if (f.action === "SELL") {
    if (f.category === "ELSS") return `${f.rating}★ ELSS — lock-in period completed. Redeeming eligible units per R_LOCKIN_FREE_SELL rule.`;
    return `${f.rating}★ ${f.category} — full sell under category overlap rule. Higher-rated peer exists in same category.`;
  }
  if (f.action === "TRIM/HOLD") return `${f.rating}★ fund exceeds 5% portfolio weight. Trimming excess per R3_cap_to_5pct. Holding remainder to avoid STCG.`;
  if (f.action === "BUY")       return `5★ Rank-1 ${f.category} fund selected to fill mandate allocation gap.`;
  return `${f.rating}★ ${f.category}. Quality holding — no action required at this time.`;
}

function buildFlags(f, user) {
  const flags = {};
  if (f.action === "SELL" && f.category === "ELSS") { flags.flagLockinCategory = true; flags.flagSoldDueToLockin = true; }
  if (f.action === "SELL" && f.rating <= 3)          flags.flagSoldLowRating = true;
  if (f.action === "TRIM/HOLD")                      flags.flagTrim3StarCap = true;
  if (f.rating <= 3 && f.action !== "BUY")           flags.flagThreeOver5 = true;
  return flags;
}

// ── Sell Schedule ──────────────────────────────────────────────────────────────
const SELL_RULES = {
  "SELL":      (f) => f.category === "ELSS" ? "R_LOCKIN_FREE_SELL" : "R5_3star_zero_if_45_in_cat",
  "TRIM/HOLD": ()  => "R3_cap_to_5pct",
};

function makeSellSchedule(user, recs) {
  const s = idSeed(user.id);
  const sells = recs.filter((r) => r.recommendedAction !== "HOLD" && r.recommendedAction !== "BUY");
  const schedule = [];
  const dates = ["2026-04-10","2026-04-13","2026-04-16","2026-05-02"];
  const settle = ["2026-04-13","2026-04-16","2026-04-19","2026-05-05"];

  sells.forEach((rec, i) => {
    const si     = s + i * 11;
    const lots   = Math.ceil(sfRange(si, 1, 4));
    let remaining = rec.amount;

    for (let l = 0; l < lots && remaining > 0; l++) {
      const lotAmt  = l === lots - 1 ? remaining : Math.round(remaining * sfRange(si+l, 0.3, 0.7));
      remaining    -= lotAmt;
      const exitRate = sfRange(si+l+1, 0, 1) > 0.7 ? round2(sfRange(si+l+2, 0.5, 1.5)) : 0;
      const taxRate  = sfRange(si+l+3, 0, 1) > 0.4 ? 12.5 : 0;
      const gain     = Math.round(lotAmt * sfRange(si+l+4, 0.2, 0.55));
      const exitAmt  = Math.round(lotAmt * exitRate / 100);
      const taxAmt   = taxRate > 0 ? Math.round(gain * taxRate / 100) : 0;
      const di       = Math.min(l, dates.length - 1);
      schedule.push({
        id:          `${user.id}-ss-${i+1}-${l+1}`,
        isin:        rec.isin,
        fundName:    rec.assetName,
        sellAmt:     lotAmt,
        bestSellDate: dates[di],
        settleDate:  settle[di],
        exitRate,
        taxRate,
        realizedGain: gain,
        exitAmt,
        taxEstAmt:   taxAmt,
        whySelling:  SELL_RULES[rec.recommendedAction]?.(rec) ?? "R5_3star_zero_if_45_in_cat",
        netCash:     lotAmt - exitAmt - taxAmt,
      });
    }
  });
  return schedule;
}

// ── Buy Schedule ───────────────────────────────────────────────────────────────
function makeBuySchedule(user, recs) {
  const s = idSeed(user.id);
  const buys = recs.filter((r) => r.recommendedAction === "BUY");
  const schedule = [];
  const tranches = [
    { date: "2026-04-13", pct: sfRange(s+30, 0.75, 0.90) },
    { date: "2026-04-16", pct: sfRange(s+31, 0.07, 0.18) },
    { date: "2026-05-02", pct: null }, // remainder
  ];

  buys.forEach((rec, i) => {
    let remaining = rec.amount;
    tranches.forEach((tr, ti) => {
      const pct    = ti < 2 ? tr.pct : 1;
      const buyAmt = ti < 2 ? Math.round(rec.amount * tr.pct) : remaining;
      remaining   -= buyAmt;
      if (buyAmt <= 0) return;
      schedule.push({
        id:          `${user.id}-bs-${i+1}-${ti+1}`,
        buyDate:     tr.date,
        isin:        rec.isin,
        fundName:    rec.assetName,
        buyAmt,
        pctOfCash:   round2(pct * 100 / buys.length),
        rule:        rec.category.includes("Large") ? "EQ_LARGE_NEW_R5_RANK1"
                   : rec.category.includes("Mid")   ? "EQ_MID_NEW_R5_RANK1"
                   :                                  "EQ_SMALL_NEW_R5_RANK1",
        rating:      5,
        tranche:     ti + 1,
      });
    });
  });
  return schedule;
}

// ── Ideal Cash ─────────────────────────────────────────────────────────────────
function makeIdealCash(user, sellSchedule) {
  const s = idSeed(user.id);
  const liquidHoldings      = Math.round(sfRange(s+40, 0.04, 0.09) * user.aum);
  const expectedSellProceeds = sellSchedule.reduce((sum, r) => sum + r.netCash, 0);
  const exitLoadCosts        = sellSchedule.reduce((sum, r) => sum + r.exitAmt, 0);
  const estimatedTax         = sellSchedule.reduce((sum, r) => sum + r.taxEstAmt, 0);
  const netDeployable        = liquidHoldings + expectedSellProceeds;

  return {
    liquidHoldings,
    expectedSellProceeds,
    exitLoadCosts,
    estimatedTax,
    netDeployable,
    note: `Tranche 1 deployable from 2026-04-13. Tranche 2 from 2026-04-16. Final tranche from 2026-05-02.`,
  };
}

// ── Transaction History ────────────────────────────────────────────────────────
const TXN_TYPES   = ["BUY","BUY","SELL","BUY","SWITCH"];
const TXN_STATUS  = ["EXECUTED","EXECUTED","EXECUTED","PENDING","EXECUTED","FAILED"];
const TXN_DATES_FM = ["2026-04-10","2026-04-08","2026-04-13","2026-04-05","2026-04-16"];
const TXN_DATES_CL = ["2026-02-14","2026-01-10","2025-12-01","2026-03-05","2026-02-28"];
const ALL_FUNDS    = [
  ...FUNDS.largeCap5, ...FUNDS.largeCap4,
  ...FUNDS.midCap5,   ...FUNDS.midCap4,
  ...FUNDS.smallCap5, ...FUNDS.debt5,
  ...FUNDS.elss5,     ...FUNDS.flexiCap4,
];

function makeTransactionHistory(user) {
  const s = idSeed(user.id);

  const fmCount = user.priority === "P1" ? 5 : user.priority === "P2" ? 4 : 3;
  const clCount = 3;

  const fundManagerInitiated = Array.from({ length: fmCount }, (_, i) => {
    const si   = s + i * 13;
    const type = pick(TXN_TYPES, si);
    const fund = pick(ALL_FUNDS, si + 1);
    const amt  = Math.round(sfRange(si + 2, 0.02, 0.12) * user.aum);
    return {
      id:          `${user.id}-fm-${i+1}`,
      date:        TXN_DATES_FM[i % TXN_DATES_FM.length],
      type,
      fundName:    fund.name,
      isin:        fund.isin,
      amount:      amt,
      status:      TXN_STATUS[i % TXN_STATUS.length],
      initiatedBy: i === 0 ? "ML Engine" : "Priya Sharma (L1)",
      reference:   `TXN-${TXN_DATES_FM[i % TXN_DATES_FM.length].replace(/-/g,"")}-${String(i+1).padStart(3,"0")}`,
    };
  });

  const clientInitiated = Array.from({ length: clCount }, (_, i) => {
    const si   = s + i * 17 + 200;
    const fund = pick(ALL_FUNDS, si);
    const amt  = Math.round(sfRange(si + 1, 0.01, 0.07) * user.aum);
    return {
      id:          `${user.id}-cl-${i+1}`,
      date:        TXN_DATES_CL[i % TXN_DATES_CL.length],
      type:        "BUY",
      fundName:    fund.name,
      isin:        fund.isin,
      amount:      amt,
      status:      "EXECUTED",
      initiatedBy: i % 2 === 0 ? "Client" : "Client (SIP)",
      reference:   `TXN-${TXN_DATES_CL[i % TXN_DATES_CL.length].replace(/-/g,"")}-${String(i+5).padStart(3,"0")}`,
    };
  });

  return { fundManagerInitiated, clientInitiated };
}

// ── Build full portfolio per user ─────────────────────────────────────────────
function buildPortfolio(user) {
  const mandate         = MANDATES[user.riskMandate] ?? MANDATES.Moderate;
  const allocation      = makeAllocation(user, mandate);
  const mandateDetail   = makeMandateDetail(user, mandate);
  const recommendations = makeRecommendations(user, mandate);
  const sellSchedule    = makeSellSchedule(user, recommendations);
  const buySchedule     = makeBuySchedule(user, recommendations);
  const idealCash       = makeIdealCash(user, sellSchedule);
  const transactionHistory = makeTransactionHistory(user);

  return { allocation, mandateDetail, recommendations, sellSchedule, buySchedule, idealCash, transactionHistory };
}

// ── Export ────────────────────────────────────────────────────────────────────
export const portfolioData = {};
mockUsers.forEach((u) => {
  portfolioData[u.id] = buildPortfolio(u);
});
