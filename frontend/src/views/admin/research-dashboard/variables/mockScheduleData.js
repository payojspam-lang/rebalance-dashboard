// Sell schedule mock data — representative lot-level rows sourced from context.md §8.1
// Full production data will have 1,329 rows per portfolio; this shows one lot per fund
// for UI development purposes.

export const mockSellSchedule = [
  // BANDHAN Flexi Cap — R5_3star_zero_if_45_in_cat (single lot, 100% sellable)
  { id: "ss-001", isin: "INF194K01W62", fundName: "BANDHAN Flexi Cap Fund",
    sellAmt: 376981.19, bestSellDate: "2026-04-10", settleDate: "2026-04-13",
    exitRate: 0, taxRate: 12.5, realizedGain: 213452.39, exitAmt: 0,
    taxEstAmt: 26681.55, whySelling: "R5_3star_zero_if_45_in_cat", netCash: 350299.64 },

  // Franklin India ELSS — R_LOCKIN_FREE_SELL (multiple lots shown as 3 rows)
  { id: "ss-002", isin: "INF090I01JS8", fundName: "Franklin India ELSS Tax Saver",
    sellAmt: 400000.00, bestSellDate: "2026-04-10", settleDate: "2026-04-13",
    exitRate: 0, taxRate: 12.5, realizedGain: 95000.00, exitAmt: 0,
    taxEstAmt: 11875.00, whySelling: "R_LOCKIN_FREE_SELL", netCash: 388125.00 },
  { id: "ss-003", isin: "INF090I01JS8", fundName: "Franklin India ELSS Tax Saver",
    sellAmt: 300000.00, bestSellDate: "2026-04-10", settleDate: "2026-04-13",
    exitRate: 0, taxRate: 0, realizedGain: -8200.00, exitAmt: 0,
    taxEstAmt: 0, whySelling: "R_LOCKIN_FREE_SELL", netCash: 300000.00 },
  { id: "ss-004", isin: "INF090I01JS8", fundName: "Franklin India ELSS Tax Saver",
    sellAmt: 254878.00, bestSellDate: "2026-04-10", settleDate: "2026-04-13",
    exitRate: 0, taxRate: 12.5, realizedGain: 126800.00, exitAmt: 0,
    taxEstAmt: 15850.00, whySelling: "R_LOCKIN_FREE_SELL", netCash: 239028.00 },

  // Mirae Asset ELSS DM9 — R_LOCKIN_FREE_SELL (2 lots)
  { id: "ss-005", isin: "INF769K01DM9", fundName: "Mirae Asset ELSS Tax Saver (DM9)",
    sellAmt: 200000.00, bestSellDate: "2026-04-10", settleDate: "2026-04-13",
    exitRate: 0, taxRate: 12.5, realizedGain: 68000.00, exitAmt: 0,
    taxEstAmt: 8500.00, whySelling: "R_LOCKIN_FREE_SELL", netCash: 191500.00 },
  { id: "ss-006", isin: "INF769K01DM9", fundName: "Mirae Asset ELSS Tax Saver (DM9)",
    sellAmt: 123111.00, bestSellDate: "2026-04-10", settleDate: "2026-04-13",
    exitRate: 0, taxRate: 12.5, realizedGain: 45720.00, exitAmt: 0,
    taxEstAmt: 5715.00, whySelling: "R_LOCKIN_FREE_SELL", netCash: 117396.00 },

  // Mirae Asset ELSS DK3 — R_LOCKIN_FREE_SELL
  { id: "ss-007", isin: "INF769K01DK3", fundName: "Mirae Asset ELSS Tax Saver (DK3)",
    sellAmt: 123398.00, bestSellDate: "2026-04-10", settleDate: "2026-04-13",
    exitRate: 0, taxRate: 12.5, realizedGain: 43360.00, exitAmt: 0,
    taxEstAmt: 5420.00, whySelling: "R_LOCKIN_FREE_SELL", netCash: 117978.00 },

  // Aditya Birla ELSS — R_LOCKIN_FREE_SELL (settles Apr 16)
  { id: "ss-008", isin: "INF209K01108", fundName: "Aditya Birla SL ELSS Tax Saver",
    sellAmt: 147785.00, bestSellDate: "2026-04-13", settleDate: "2026-04-16",
    exitRate: 0, taxRate: 12.5, realizedGain: 51936.00, exitAmt: 0,
    taxEstAmt: 6492.00, whySelling: "R_LOCKIN_FREE_SELL", netCash: 141293.00 },

  // Canara Robeco Hybrid — R3_cap_to_5pct (has exit load)
  { id: "ss-009", isin: "INF760K01EZ8", fundName: "Canara Robeco Equity Hybrid Fund",
    sellAmt: 132174.00, bestSellDate: "2026-04-10", settleDate: "2026-04-13",
    exitRate: 1.0, taxRate: 12.5, realizedGain: 59800.00, exitAmt: 3503.00,
    taxEstAmt: 7475.00, whySelling: "R3_cap_to_5pct", netCash: 121196.00 },

  // UTI Nifty 50 — R3_cap_to_5pct, split across dates to exit STCG window
  { id: "ss-010", isin: "INF789F01XA0", fundName: "UTI Nifty 50 Index Fund",
    sellAmt: 120000.00, bestSellDate: "2026-04-10", settleDate: "2026-04-13",
    exitRate: 0, taxRate: 12.5, realizedGain: 28000.00, exitAmt: 0,
    taxEstAmt: 3500.00, whySelling: "R3_cap_to_5pct", netCash: 116500.00 },
  { id: "ss-011", isin: "INF789F01XA0", fundName: "UTI Nifty 50 Index Fund",
    sellAmt: 212539.00, bestSellDate: "2026-05-02", settleDate: "2026-05-05",
    exitRate: 0, taxRate: 12.5, realizedGain: 88640.00, exitAmt: 0,
    taxEstAmt: 11080.00, whySelling: "R3_cap_to_5pct", netCash: 201459.00 },
];

// Buy schedule — exact 7 rows from context.md §8.3
export const mockBuySchedule = [
  { id: "bs-001", buyDate: "2026-04-13", isin: "INF204K01D30",
    fundName: "Nippon India Large Cap Fund", buyAmt: 1039700, pctOfCash: 43.49,
    rule: "EQ_LARGE_NEW_R5_RANK1", rating: 5, tranche: 1 },
  { id: "bs-002", buyDate: "2026-04-13", isin: "INF917K01FZ1",
    fundName: "HSBC Midcap Fund", buyAmt: 270075, pctOfCash: 11.30,
    rule: "EQ_MID_NEW_R5_RANK1", rating: 5, tranche: 1 },
  { id: "bs-003", buyDate: "2026-04-13", isin: "INF194KB1AL4",
    fundName: "BANDHAN Small Cap Fund", buyAmt: 908421, pctOfCash: 38.00,
    rule: "EQ_SMALL_NEW_R5_RANK1", rating: 5, tranche: 1 },
  { id: "bs-004", buyDate: "2026-04-16", isin: "INF204K01D30",
    fundName: "Nippon India Large Cap Fund", buyAmt: 77595, pctOfCash: 3.25,
    rule: "EQ_LARGE_NEW_R5_RANK1", rating: 5, tranche: 2 },
  { id: "bs-005", buyDate: "2026-04-16", isin: "INF194KB1AL4",
    fundName: "BANDHAN Small Cap Fund", buyAmt: 70190, pctOfCash: 2.94,
    rule: "EQ_SMALL_NEW_R5_RANK1", rating: 5, tranche: 2 },
  { id: "bs-006", buyDate: "2026-05-02", isin: "INF204K01D30",
    fundName: "Nippon India Large Cap Fund", buyAmt: 13203, pctOfCash: 0.55,
    rule: "EQ_LARGE_NEW_R5_RANK1", rating: 5, tranche: 3 },
  { id: "bs-007", buyDate: "2026-05-02", isin: "INF194KB1AL4",
    fundName: "BANDHAN Small Cap Fund", buyAmt: 11682, pctOfCash: 0.49,
    rule: "EQ_SMALL_NEW_R5_RANK1", rating: 5, tranche: 3 },
];
