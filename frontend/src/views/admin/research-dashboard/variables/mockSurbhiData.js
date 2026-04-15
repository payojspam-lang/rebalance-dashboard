// Mock data for Surbhi Narain — Moderate mandate, ~1.5 Cr AUM
// This is a handcrafted dataset similar to user-001 (Rahul Mehta)

export const surbhiPortfolio = {
  id: "port-surbhi",
  name: "Surbhi Narain",
  totalAum: 15200000,
  mandateType: "Moderate",
  currentDrift: 6.42,
  driftStatus: "WARNING",
  pendingRecommendations: 12,
  updatedAt: "2026-04-12T09:00:00Z",
};

export const surbhiAllocation = [
  { category: "Large Cap", current: 52.10, target: 45.00 },
  { category: "Mid Cap",   current: 11.80, target: 15.00 },
  { category: "Small Cap", current:  8.30, target: 12.00 },
  { category: "Debt",      current: 20.50, target: 18.00 },
  { category: "Gold",      current:  7.30, target: 10.00 },
];

// Raw recommendations — the mapping in mockData.js will add mlAction/mlAmount/mlQty/nav fields
export const surbhiBaseRecs = [
  // ── SELL ──────────────────────────────────────────────────────────────
  {
    id: "srec-001",
    isin: "INF740K01UN2",
    assetName: "Axis Bluechip Fund",
    category: "Large Cap",
    rating: 2,
    currentValue: 2280000,
    currentWeight: 15.00,
    recommendedAction: "SELL",
    amount: 2280000,
    status: "PENDING",
    comment:
      "2★ Large Cap fund. Immediate must-sell per quality-based sell rule. Full sell of 100% holding (₹22,80,000). No exit load — all units past 12-month window. LTCG applicable on 78% of units.",
    pctValueInStcg: 22.0,
    pctValueInExitLoad: 0,
    pctValueSellableNow: 100,
    exitAmtSold: 0,
    taxEstAmtSold: 44500,
    realizedGainSold: 356000,
    flags: {
      flagSoldLowRating: true,
    },
    createdAt: "2026-04-12T09:00:00Z",
  },
  {
    id: "srec-002",
    isin: "INF846K01DP8",
    assetName: "Axis Short Term Fund",
    category: "Short Duration",
    rating: 4,
    currentValue: 1520000,
    currentWeight: 10.00,
    recommendedAction: "SELL",
    amount: 1520000,
    status: "PENDING",
    comment:
      "4★ Short Duration (Debt) fund. Sell all pure Debt funds per debt rotation rule — shift to Arbitrage for superior tax treatment. Full sell (₹15,20,000). No exit load.",
    pctValueInStcg: 0,
    pctValueInExitLoad: 0,
    pctValueSellableNow: 100,
    exitAmtSold: 0,
    taxEstAmtSold: 18200,
    realizedGainSold: 145600,
    flags: {
      flagSoldDueToDebtRotation: true,
      flagDebtRotationCategory: true,
    },
    createdAt: "2026-04-12T09:00:00Z",
  },
  {
    id: "srec-003",
    isin: "INF200K01RJ3",
    assetName: "SBI Magnum Gilt Fund",
    category: "Gilt Fund",
    rating: 3,
    currentValue: 912000,
    currentWeight: 6.00,
    recommendedAction: "SELL",
    amount: 912000,
    status: "PENDING",
    comment:
      "3★ Gilt Fund. Sell per debt rotation rule — Arbitrage funds preferred for tax efficiency. Full sell (₹9,12,000). No exit load on any units.",
    pctValueInStcg: 0,
    pctValueInExitLoad: 0,
    pctValueSellableNow: 100,
    exitAmtSold: 0,
    taxEstAmtSold: 11400,
    realizedGainSold: 91200,
    flags: {
      flagSoldDueToDebtRotation: true,
      flagDebtRotationCategory: true,
    },
    createdAt: "2026-04-12T09:00:00Z",
  },

  // ── TRIM ──────────────────────────────────────────────────────────────
  {
    id: "srec-004",
    isin: "INF179K01BE8",
    assetName: "HDFC Top 100 Fund",
    category: "Large Cap",
    rating: 3,
    currentValue: 1368000,
    currentWeight: 9.00,
    recommendedAction: "TRIM",
    amount: 608000,
    status: "PENDING",
    comment:
      "3★ Large Cap at 9.0% weight — exceeds 5% cap (R3_cap_to_5pct). Trim ₹6,08,000 (44.4%) down to 5% weight. 32% of units are in STCG window — deferring those to May.",
    pctValueInStcg: 32.0,
    pctValueInExitLoad: 0,
    pctValueSellableNow: 68.0,
    exitAmtSold: 0,
    taxEstAmtSold: 9120,
    realizedGainSold: 72960,
    flags: {
      flagThreeOver5: true,
      flagTrim3StarCap: true,
    },
    createdAt: "2026-04-12T09:00:00Z",
  },
  {
    id: "srec-005",
    isin: "INF090I01953",
    assetName: "Franklin India Equity Hybrid Fund",
    category: "Aggressive Hybrid",
    rating: 3,
    currentValue: 988000,
    currentWeight: 6.50,
    recommendedAction: "TRIM",
    amount: 228000,
    status: "PENDING",
    comment:
      "3★ Aggressive Hybrid at 6.5% — exceeds 5% cap (R3_cap_to_5pct). Trim ₹2,28,000 (23.1%) down to 5% weight. Exit load of 1% on units under 12-month window.",
    pctValueInStcg: 40.5,
    pctValueInExitLoad: 28.3,
    pctValueSellableNow: 59.5,
    exitAmtSold: 2280,
    taxEstAmtSold: 5700,
    realizedGainSold: 45600,
    flags: {
      flagThreeOver5: true,
      flagTrim3StarCap: true,
    },
    createdAt: "2026-04-12T09:00:00Z",
  },

  // ── HOLD ──────────────────────────────────────────────────────────────
  {
    id: "srec-006",
    isin: "INF174K01LS2",
    assetName: "Kotak Bluechip Fund",
    category: "Large Cap",
    rating: 5,
    currentValue: 2128000,
    currentWeight: 14.00,
    recommendedAction: "HOLD",
    amount: 0,
    status: "PENDING",
    comment:
      "5★ Large Cap. Core mandate holding — top-rated in category. 18% of units are in exit load window. Hold to maintain quality exposure.",
    pctValueInStcg: 12.0,
    pctValueInExitLoad: 18.0,
    pctValueSellableNow: 70.0,
    exitAmtSold: 0,
    taxEstAmtSold: 0,
    realizedGainSold: 0,
    flags: {},
    createdAt: "2026-04-12T09:00:00Z",
  },
  {
    id: "srec-007",
    isin: "INF179K01XQ0",
    assetName: "HDFC Mid Cap Opportunities Fund",
    category: "Mid Cap",
    rating: 5,
    currentValue: 1794400,
    currentWeight: 11.80,
    recommendedAction: "HOLD",
    amount: 0,
    status: "PENDING",
    comment:
      "5★ Mid Cap. Core mandate holding. Post-rebalance weight aligns with 15% Mid Cap target. 22% of units in STCG window.",
    pctValueInStcg: 22.0,
    pctValueInExitLoad: 15.0,
    pctValueSellableNow: 63.0,
    exitAmtSold: 0,
    taxEstAmtSold: 0,
    realizedGainSold: 0,
    flags: {},
    createdAt: "2026-04-12T09:00:00Z",
  },
  {
    id: "srec-008",
    isin: "INF109K012K1",
    assetName: "ICICI Prudential Value Discovery Fund",
    category: "Value Fund",
    rating: 4,
    currentValue: 684000,
    currentWeight: 4.50,
    recommendedAction: "HOLD",
    amount: 0,
    status: "PENDING",
    comment:
      "4★ Value Fund. Sole 4★+ in Value category. Below 5% cap. Hold.",
    pctValueInStcg: 28.0,
    pctValueInExitLoad: 0,
    pctValueSellableNow: 72.0,
    exitAmtSold: 0,
    taxEstAmtSold: 0,
    realizedGainSold: 0,
    flags: {},
    createdAt: "2026-04-12T09:00:00Z",
  },
  {
    id: "srec-009",
    isin: "INF846K01N65",
    assetName: "Axis Overnight Fund",
    category: "Overnight Fund",
    rating: 5,
    currentValue: 684000,
    currentWeight: 4.50,
    recommendedAction: "HOLD",
    amount: 0,
    status: "PENDING",
    comment:
      "5★ Overnight Fund. Liquid buffer — hold. Cash will be deployed via buy schedule post settlement.",
    pctValueInStcg: 0,
    pctValueInExitLoad: 0,
    pctValueSellableNow: 100,
    exitAmtSold: 0,
    taxEstAmtSold: 0,
    realizedGainSold: 0,
    flags: {},
    createdAt: "2026-04-12T09:00:00Z",
  },

  // ── BUY ───────────────────────────────────────────────────────────────
  {
    id: "srec-010",
    isin: "INF204K01D30",
    assetName: "Nippon India Large Cap Fund",
    category: "Large Cap",
    rating: 5,
    currentValue: 0,
    currentWeight: 0,
    recommendedAction: "BUY",
    amount: 1520000,
    status: "PENDING",
    comment:
      "5★ Rank-1 Large Cap fund. Buy ₹15,20,000 to replace sold Axis Bluechip exposure and maintain Large Cap at 45% target. Multi-tranche: Apr 16 (₹12,80,000), Apr 22 (₹2,40,000).",
    pctValueInStcg: 0,
    pctValueInExitLoad: 0,
    pctValueSellableNow: 0,
    exitAmtSold: 0,
    taxEstAmtSold: 0,
    realizedGainSold: 0,
    flags: {},
    createdAt: "2026-04-12T09:00:00Z",
  },
  {
    id: "srec-011",
    isin: "INF917K01FZ1",
    assetName: "HSBC Midcap Fund",
    category: "Mid Cap",
    rating: 5,
    currentValue: 0,
    currentWeight: 0,
    recommendedAction: "BUY",
    amount: 486400,
    status: "PENDING",
    comment:
      "5★ Rank-1 Mid Cap fund. Buy ₹4,86,400 to close Mid Cap gap (current 11.8% vs 15% target). Single tranche on Apr 16.",
    pctValueInStcg: 0,
    pctValueInExitLoad: 0,
    pctValueSellableNow: 0,
    exitAmtSold: 0,
    taxEstAmtSold: 0,
    realizedGainSold: 0,
    flags: {},
    createdAt: "2026-04-12T09:00:00Z",
  },
  {
    id: "srec-012",
    isin: "INF194KB1AL4",
    assetName: "BANDHAN Small Cap Fund",
    category: "Small Cap",
    rating: 5,
    currentValue: 0,
    currentWeight: 0,
    recommendedAction: "BUY",
    amount: 562400,
    status: "PENDING",
    comment:
      "5★ Rank-1 Small Cap fund. Buy ₹5,62,400 to fill Small Cap gap (current 8.3% vs 12% target). Two tranches: Apr 16 (₹4,80,000), Apr 22 (₹82,400).",
    pctValueInStcg: 0,
    pctValueInExitLoad: 0,
    pctValueSellableNow: 0,
    exitAmtSold: 0,
    taxEstAmtSold: 0,
    realizedGainSold: 0,
    flags: {},
    createdAt: "2026-04-12T09:00:00Z",
  },
];

// NAVs for Surbhi's funds
export const surbhiNavByIsin = {
  "INF740K01UN2": 42,   // Axis Bluechip Fund
  "INF846K01DP8": 28,   // Axis Short Term Fund
  "INF200K01RJ3": 32,   // SBI Magnum Gilt Fund
  "INF179K01BE8": 520,  // HDFC Top 100 Fund
  "INF090I01953": 210,  // Franklin India Equity Hybrid Fund
  "INF174K01LS2": 480,  // Kotak Bluechip Fund
  "INF179K01XQ0": 180,  // HDFC Mid Cap Opportunities Fund
  "INF109K012K1": 310,  // ICICI Prudential Value Discovery Fund
  "INF846K01N65": 1150, // Axis Overnight Fund
  "INF204K01D30": 900,  // Nippon India Large Cap Fund
  "INF917K01FZ1": 120,  // HSBC Midcap Fund
  "INF194KB1AL4": 75,   // BANDHAN Small Cap Fund
};

// Process recommendations — add ML reference fields + NAV
export const surbhiRecommendations = surbhiBaseRecs.map((r) => {
  const nav = surbhiNavByIsin[r.isin] ?? 100;
  const mlQty = r.amount > 0 ? Math.round(r.amount / nav) : 0;
  return {
    ...r,
    nav,
    mlAction: r.recommendedAction,
    mlAmount: r.amount,
    mlQty,
    qty: mlQty,
  };
});

export const surbhiIdealCash = {
  liquidHoldings: 684000,
  expectedSellProceeds: 5548000,
  estimatedTaxOnSells: 88920,
  estimatedExitLoad: 2280,
  netCashAvailable: 6140800,
  buyBudget: 2568800,
};

export const surbhiMandateDetail = {
  riskMandate: "Moderate",
  description: "Balanced portfolio with equal emphasis on growth and capital preservation. Mix of large cap equity and debt instruments.",
  targetAllocation: [
    { assetClass: "Large Cap",  min: 40, max: 55, target: 45.00 },
    { assetClass: "Mid Cap",    min: 10, max: 20, target: 15.00 },
    { assetClass: "Small Cap",  min: 8,  max: 18, target: 12.00 },
    { assetClass: "Debt",       min: 12, max: 22, target: 18.00 },
    { assetClass: "Gold",       min: 5,  max: 15, target: 10.00 },
  ],
  specialInstructions: "Client prefers no direct equity. All equity via diversified mutual funds only. Exit load sensitive — avoid redemptions within 12-month window where possible. SIP mandates active on Kotak Bluechip and HDFC Mid Cap — do not redeem SIP units.",
};
