# Product Requirements Document (PRD) — Aegis Rebalance Engine

**Author:** Senior Product Manager
**Version:** 2.0
**Last Updated:** 2026-04-06
**Status:** Draft
**Reference Data:** `Rebalance V0.xlsx`

---

## 1. Executive Summary

The Aegis Rebalance Engine is a scalable, semi-automated mutual fund portfolio rebalancing platform. It evaluates a user's current holdings against a predefined risk mandate (e.g., Aggressive, Moderate, Conservative) and generates optimized rebalancing actions — BUY, SELL, HOLD, or TRIM/HOLD — while optimizing for tax implications (STCG/LTCG), exit load windows, fund star ratings, and fund category exposure rules.

The system bridges the gap between Research (who define mandates and review recommendations) and Operations (who execute trades via BSE Star CSV uploads), enforcing strict sequential approval workflows and providing full audit trails.

---

## 2. Target Audience

| Persona | Role | Primary Need |
|---|---|---|
| **Financial Advisor** | Reviews ML rebalance recommendations for client portfolios | Approve or modify trades based on market conditions and client goals |
| **Wealth Manager** | Manages multiple client accounts and monitors portfolio health | Dashboard showing drift, mandate compliance, and pending actions across all accounts |
| **Compliance / L2 Manager** | Gatekeeper for deviations from ML recommendations | Review and approve/reject modifications to ensure regulatory compliance |
| **Operations Team** | Executes approved trades on BSE Star | Receive batched, approved data formatted for immediate BSE Star CSV upload |
| **Robo-Advisory Platform** | Automated pipeline (future scope) | API-driven ingestion and execution for automated account management |

---

## 3. Problem Statement

Portfolio rebalancing for mutual fund portfolios is a complex, multi-dimensional optimization problem involving:

- **Tax optimization:** Selling units triggers Short-Term Capital Gains (STCG at 12.5%) or Long-Term Capital Gains (LTCG at 12.5% above ₹1.25L exemption). The engine must prefer selling long-term units and avoid unnecessary STCG.
- **Exit load avoidance:** Many funds charge 1-2% exit loads for redemptions within 12-24 months. The engine must identify which units are free from exit load vs. still under lock-in.
- **Rating-based quality management:** Low-rated (2★-3★) funds should be replaced or capped, but only when the cost of selling (tax + exit load) doesn't outweigh the benefit.
- **Mandate compliance:** Each client's portfolio must align with their selected risk mandate (target allocation across Large Cap, Mid Cap, Small Cap, Gold, Debt, Thematic).
- **Execution scheduling:** Mutual fund sell settlements take T+2 to T+3 days. Buy orders can only be placed once sell cash settles, requiring multi-tranche execution across dates.

Currently these decisions are made manually, leading to errors, inconsistent rule application, and delayed execution.

---

## 4. Data Model: Portfolio Ingestion

### 4.1 Fund Level Detail (per holding)

Sourced from the user's portfolio (reference: `User Data` sheet).

| Field | Type | Example | Description |
|---|---|---|---|
| `fund_name` | string | Parag Parikh Flexi Cap Fund | Display name |
| `isin` | string | INF879O01027 | Unique fund identifier |
| `category` | string | Flexi Cap Fund | MF category (ELSS, Mid Cap, Index, etc.) |
| `rating` | integer | 4 | Star rating (1-5) |
| `asset_class` | string | Equity | Equity, Debt, Hybrid, Fixed Income |
| `available_units` | decimal | 5487.561 | Total redeemable units |
| `short_term_units` | decimal | 1392.908 | Units held < 1 year (STCG applicable) |
| `long_term_units` | decimal | 4094.653 | Units held >= 1 year (LTCG applicable) |
| `short_term_gains` | decimal | -2447.38 | Unrealized ST gains (negative = loss) |
| `long_term_gains` | decimal | 124573.22 | Unrealized LT gains |
| `tax_payable` | decimal | 15718.37 | Estimated total tax if fully sold |
| `exit_load_amount` | decimal | 3502.52 | Estimated exit load if sold now |
| `units_under_exit_load` | decimal | 2493.073 | Units still within exit load window |
| `units_free_from_exit_load` | decimal | 2994.488 | Units past exit load window |

### 4.2 Sample Portfolio (User Account: 5201745730863104)

| Fund | ISIN | Category | Rating | Asset Class | Value (₹) |
|---|---|---|---|---|---|
| Parag Parikh Flexi Cap Fund | INF879O01027 | Flexi Cap | 4★ | Equity | 494,608 |
| BANDHAN Flexi Cap Fund | INF194K01W62 | Flexi Cap | 3★ | Equity | 376,981 |
| Bandhan Govt Securities Fund | INF194K01Q29 | Gilt Fund | 4★ | Debt | 246,031 |
| HDFC Mid Cap Fund | INF179K01XQ0 | Mid Cap | 5★ | Equity | 1,897,906 |
| ICICI Prudential Value Fund | INF109K012K1 | Value Fund | 4★ | Equity | 384,202 |
| Canara Robeco Equity Hybrid | INF760K01EZ8 | Aggressive Hybrid | 3★ | Hybrid | 553,392 |
| UTI Nifty 50 Index Fund | INF789F01XA0 | Index Funds | 3★ | Equity | 753,085 |
| Franklin U.S. Opportunities FoF | INF090I01JR0 | FoF Overseas | 3★ | Equity | 226,101 |
| Axis Dynamic Bond Fund | INF846K01DI3 | Dynamic Bond | 5★ | Debt | 278,607 |
| Mirae Asset ELSS Tax Saver | INF769K01DM9 | ELSS | 5★ | Equity | 569,003 |
| Mirae Asset ELSS Tax Saver | INF769K01DK3 | ELSS | 5★ | Equity | 247,350 |
| Franklin India ELSS Tax Saver | INF090I01JS8 | ELSS | 2★ | Equity | 1,155,424 |
| Aditya Birla ELSS Tax Saver | INF209K01108 | ELSS | 5★ | Equity | 147,785 |
| Mirae Asset Large & Midcap | INF769K01101 | Large & Mid Cap | 3★ | Equity | 61,387 |
| Mirae Asset Large & Midcap | INF769K01BI1 | Large & Mid Cap | 3★ | Equity | 273,937 |
| Canara Robeco Equity Hybrid | INF760K01050 | Aggressive Hybrid | 3★ | Hybrid | 27,944 |
| Axis Overnight Fund | INF846K01N65 | Overnight Fund | 5★ | Debt | 724,967 |

---

## 5. Risk Mandate Profiles

Target allocation percentages by risk profile (reference: `ML Recommendation` sheet):

| Mandate | Large Cap | Mid Cap | Small Cap | Gold | Debt | Thematic | AIF | PMS | Unlisted |
|---|---|---|---|---|---|---|---|---|---|
| **Conservative** | 60% | 10% | 5% | 10% | 15% | 0% | — | — | — |
| **Low** | 50% | 12.5% | 12.5% | 12.5% | 12.5% | 0% | — | — | — |
| **Moderate** | 45% | 15% | 15% | 15% | 10% | 0% | — | — | — |
| **High** | 25% | 25% | 25% | 10% | 0% | 15% | — | — | — |
| **Aggressive** | 10% | 30% | 30% | 10% | 0% | 20% | — | — | — |

### Allocation Variance Calculation

The engine calculates drift between current and target allocation:

| Asset Item | Current % | Target % | Current Value (₹) | Target Value (₹) |
|---|---|---|---|---|
| Equity - Large (incl Unclassified) | 49.93% | 41.10% | 42,03,703 | 34,59,698 |
| Equity - Mid | 23.29% | 25.49% | 19,61,044 | 21,46,099 |
| Equity - Small | 10.39% | 17.11% | 8,74,354 | 14,40,194 |
| Debt | 16.39% | 16.08% | 13,79,609 | 13,53,702 |
| Commodity - Gold | 0.00% | 0.23% | 0 | 19,017 |

---

## 6. Rebalancing Rules Engine

The core engine evaluates each holding and outputs a **Final Action** based on these rules, applied in priority order:

### 6.1 Sell Rules

| Rule ID | Name | Logic | Example from Data |
|---|---|---|---|
| `R_LOCKIN_FREE_SELL` | Lock-in Free Sell | Sell all units from ELSS (lock-in category) funds where the lock-in period (3 years) has been completed. Applies regardless of star rating. | Franklin India ELSS (2★): sold ₹9,54,878 (82.64% of holding). Mirae Asset ELSS (5★): sold ₹3,23,111 (56.79%). Aditya Birla ELSS (5★): sold ₹1,47,785 (100%). |
| `R5_3star_zero_if_45_in_cat` | 3★ Full Sell if 4★/5★ Exists | Sell a 3★-rated fund entirely if a 4★ or 5★ fund exists in the same MF category. The better-rated fund supersedes. | BANDHAN Flexi Cap (3★): sold ₹3,76,981 (100%) because Parag Parikh Flexi Cap (4★) exists in same "Flexi Cap" category. |

### 6.2 Trim/Hold Rules

| Rule ID | Name | Logic | Example from Data |
|---|---|---|---|
| `R3_cap_to_5pct` | Cap 3★ to 5% | If a 3★ fund's portfolio weight exceeds 5%, trim the excess but hold the remainder to avoid unnecessary churn, high exit loads, or STCG. | UTI Nifty 50 Index (3★, 8.95%): trimmed ₹3,32,539 down to 5.00% weight. Canara Robeco Hybrid (3★, 6.58%): trimmed ₹1,32,174 down to 5.00%. |

### 6.3 Hold Rules

| Condition | Logic | Example from Data |
|---|---|---|
| **High rating (4★/5★)** | Retain unless forced by lock-in or mandate rules. | HDFC Mid Cap (5★): HOLD. Parag Parikh Flexi Cap (4★): HOLD. |
| **Excessive cost to sell** | Hold if selling incurs high exit loads or STCG tax, analyzing the % of units currently "sellable." | HDFC Mid Cap: only 55.5% sellable (44.5% under exit load + STCG windows). |
| **3★ under 5% cap** | If a 3★ fund is below 5% portfolio weight AND no 4★/5★ exists in its category, hold. | Franklin U.S. Opportunities (3★, 2.69%): HOLD — below 5% cap, no 4★/5★ in FoF Overseas category. Mirae L&MC (3★, 3.25%): HOLD — below cap. |

### 6.4 Buy Rules

| Rule ID | Name | Logic | Example from Data |
|---|---|---|---|
| `EQ_LARGE_NEW_R5_RANK1` | Buy 5★ Rank-1 Large Cap | Use cash from sells to buy the #1 ranked 5★ fund in the Large Cap category to hit target mandate %. | Nippon India Large Cap Fund (5★, Rank 1): buy ₹11,30,498 (47.29% of deployed cash). |
| `EQ_MID_NEW_R5_RANK1` | Buy 5★ Rank-1 Mid Cap | Same logic for Mid Cap gap. | HSBC Midcap Fund (5★, Rank 1): buy ₹2,70,075 (11.30% of deployed cash). |
| `EQ_SMALL_NEW_R5_RANK1` | Buy 5★ Rank-1 Small Cap | Same logic for Small Cap gap. | BANDHAN Small Cap Fund (5★, Rank 1): buy ₹9,90,293 (41.43% of deployed cash). |

---

## 7. Final Action Output (per holding)

The engine produces a comprehensive action plan per ISIN:

| Field | Description |
|---|---|
| `Action` | `BUY (NEW)`, `SELL`, `HOLD`, `TRIM/HOLD` |
| `Comment` | Human-readable explanation with rule reference, estimated tax, exit load, and sellability context. |
| `sold` / `buy` | ₹ amount to sell or buy |
| `final_val` | Post-rebalance value |
| `final_weight_pct` | Post-rebalance portfolio weight |
| `exit_amt_sold` | Exit load incurred on sell |
| `tax_est_amt_sold` | Estimated tax on realized gains |
| `realized_gain_sold` | Capital gains realized |
| `net_cash_from_sells_est` | Net cash generated after costs |
| `pct_value_in_stcg` | % of holding in STCG window |
| `pct_value_in_exit_load` | % of holding under exit load |
| `pct_value_sellable_now` | % freely sellable without penalties |

### Flags (Boolean)

| Flag | Meaning |
|---|---|
| `flag_under_2pct` | Holding is <2% of portfolio |
| `flag_over_25pct` | Holding is >25% of portfolio |
| `flag_three_over_5` | 3★ fund exceeding 5% cap |
| `flag_debt_rotation_category` | Fund is in a debt rotation category |
| `flag_lockin_category` | Fund is in a lock-in category (ELSS) |
| `flag_sold_due_to_debt_rotation` | Sold due to debt rotation rule |
| `flag_sold_due_to_lockin` | Sold due to lock-in completion |
| `flag_sold_low_rating` | Sold due to low rating rule |
| `flag_sold_overlap` | Sold due to category overlap |
| `flag_trim_3star_cap` | Trimmed to 3★ 5% cap |

---

## 8. Tax & Trade Settlement Optimizer

### 8.1 Sell Schedule

The engine breaks sells into granular, lot-level transactions (1,329 rows for this portfolio). Each row contains:

| Field | Description | Example |
|---|---|---|
| `User_ID` | Account identifier | 5201745730863104 |
| `MF_isin` | Fund ISIN | INF194K01W62 |
| `sell_amt` | Amount to sell from this lot | ₹3,76,981.19 |
| `best_sell_date` | Optimal sell date (avoids exit load windows) | 2026-04-10 |
| `settle_date` | Cash settlement date (T+2/T+3) | 2026-04-13 |
| `best_exit_rate` | Exit load rate for this lot (0% = free) | 0.0% |
| `best_tax_rate` | Applicable tax rate (12.5% STCG or 12.5% LTCG) | 12.5% |
| `realized_gain` | Capital gain realized on this lot | ₹2,13,452.39 |
| `exit_amt` | Exit load amount | ₹0 |
| `tax_est_amt` | Estimated tax | ₹26,681.55 |
| `why_selling` | Rule ID | R5_3star_zero_if_45_in_cat |
| `net_cash` | Net cash after all costs | ₹3,76,981.19 |

### 8.2 Sell Summary

Aggregated sell transactions per fund:

| Fund | ISIN | Sold Amount (₹) | First Sell | Last Settle | Rule | Rating | Sold % |
|---|---|---|---|---|---|---|---|
| Franklin India ELSS | INF090I01JS8 | 9,54,878 | Apr 10 | Apr 13 | R_LOCKIN_FREE_SELL | 2★ | 82.64% |
| BANDHAN Flexi Cap | INF194K01W62 | 3,76,981 | Apr 10 | Apr 13 | R5_3star_zero_if_45_in_cat | 3★ | 100% |
| UTI Nifty 50 Index | INF789F01XA0 | 3,32,539 | Apr 10 | May 2 | R3_cap_to_5pct | 3★ | 44.16% |
| Mirae Asset ELSS (DM9) | INF769K01DM9 | 3,23,111 | Apr 10 | Apr 13 | R_LOCKIN_FREE_SELL | 5★ | 56.79% |
| Aditya Birla ELSS | INF209K01108 | 1,47,785 | Apr 13 | Apr 16 | R_LOCKIN_FREE_SELL | 5★ | 100% |
| Canara Robeco Hybrid | INF760K01EZ8 | 1,32,174 | Apr 10 | Apr 13 | R3_cap_to_5pct | 3★ | 23.88% |
| Mirae Asset ELSS (DK3) | INF769K01DK3 | 1,23,398 | Apr 10 | Apr 13 | R_LOCKIN_FREE_SELL | 5★ | 49.89% |

**Total Sell Value: ~₹23,90,866**

### 8.3 Buy Schedule (Multi-Tranche)

Buys are scheduled after sell cash settles, across multiple dates:

| Buy Date | Fund | ISIN | Buy Amount (₹) | % of Deployed Cash | Rule |
|---|---|---|---|---|---|
| **Apr 13** | Nippon India Large Cap | INF204K01D30 | 10,39,700 | 43.49% | EQ_LARGE_NEW_R5_RANK1 |
| **Apr 13** | HSBC Midcap | INF917K01FZ1 | 2,70,075 | 11.30% | EQ_MID_NEW_R5_RANK1 |
| **Apr 13** | BANDHAN Small Cap | INF194KB1AL4 | 9,08,421 | 38.00% | EQ_SMALL_NEW_R5_RANK1 |
| **Apr 16** | Nippon India Large Cap | INF204K01D30 | 77,595 | 3.25% | EQ_LARGE_NEW_R5_RANK1 |
| **Apr 16** | BANDHAN Small Cap | INF194KB1AL4 | 70,190 | 2.94% | EQ_SMALL_NEW_R5_RANK1 |
| **May 2** | Nippon India Large Cap | INF204K01D30 | 13,203 | 0.55% | EQ_LARGE_NEW_R5_RANK1 |
| **May 2** | BANDHAN Small Cap | INF194KB1AL4 | 11,682 | 0.49% | EQ_SMALL_NEW_R5_RANK1 |

**Total Buy Value: ~₹23,90,866**

### 8.4 Execution Timeline

```
Apr 10 (Thu)  ─── Sell: 6 funds (lots settle by Apr 13)
                   └── BANDHAN Flexi (100%), Franklin ELSS (partial), Mirae ELSS x2,
                       Canara Robeco Hybrid, UTI Nifty 50 (partial lots)

Apr 13 (Sun)  ─── Settle: Tranche 1 cash arrives
              ─── Sell: Aditya Birla ELSS (100%, settles Apr 16)
              ─── Buy Tranche 1: Nippon Large Cap ₹10.4L, HSBC Mid ₹2.7L, BANDHAN Small ₹9.1L

Apr 16 (Wed)  ─── Settle: Aditya Birla ELSS cash arrives
              ─── Buy Tranche 2: Nippon Large Cap ₹0.78L, BANDHAN Small ₹0.70L

May 2 (Fri)   ─── Settle: UTI Nifty 50 remaining lots
              ─── Buy Tranche 3: Nippon Large Cap ₹0.13L, BANDHAN Small ₹0.12L
```

---

## 9. System States (Request Lifecycle)

| State | Description | Transitions |
|---|---|---|
| `PENDING` | ML recommendation generated, awaiting L1 review. | → `APPROVED`, → `L2_PENDING` |
| `L2_PENDING` | L1 Analyst modified the recommendation. Awaiting L2 Manager review. | → `APPROVED`, → `REJECTED` |
| `REJECTED` | L2 Manager rejected the modification. Returned to L1. | → `PENDING` |
| `APPROVED` | Cleared for execution (directly by L1 or after L2 review). | → `IN_PROGRESS` |
| `IN_PROGRESS` | Ops started batch execution. BSE Star CSV generated. | → `COMPLETED` |
| `COMPLETED` | Ops confirmed execution finalized. Terminal state. | None |

---

## 10. Success Metrics

| Metric | Target | Measurement |
|---|---|---|
| Rebalance cycle time | 70% reduction vs. manual | Time from ML recommendation to COMPLETED |
| Execution error rate | <0.1% per batch | CSV output vs. approved recommendations |
| Tax optimization accuracy | Sell schedule minimizes STCG exposure | Compare STCG vs. LTCG ratio in sell schedule |
| Compliance audit pass rate | 100% | All trades have complete approval chain |
| Rule engine accuracy | 100% match with reference spreadsheet | Automated test against `Rebalance V0.xlsx` |
| Ops CSV generation time | <5 seconds for 200 line items | Backend monitoring |

---

## 11. Out of Scope (MVP)

- Direct API integration with BSE Star (replacing CSV downloads).
- Real-time market data feeds for live NAV / drift calculation.
- Automated L2 compliance rule engine (reducing manual L2 checks).
- OAuth/SSO integration for RBAC.
- Multi-currency support.
- Gold and commodity fund buying (target allocation shows 0.23% gold but no buy rule implemented yet).
- Historical backtesting of rebalance strategies.
- Automated lot-level optimization (currently pre-computed by ML engine).

---

## 12. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| BSE Star CSV format changes without notice | Medium | High | Abstract CSV generation behind template engine; version templates. |
| ML recommendation quality causes analyst fatigue | Medium | Medium | Track override rate; feed back to ML team. |
| Tax calculation discrepancy with actual AMC statements | Medium | High | Clearly label as "estimated"; reconcile with AMC data post-execution. |
| Multi-tranche buy timing misaligns with market volatility | Medium | Medium | Allow Ops to defer individual tranche buys; re-quote amounts at execution time. |
| State machine bypass via direct DB manipulation | Low | Critical | Enforce transitions in app layer AND DB constraints. |
| ELSS lock-in period miscalculated | Low | Critical | Validate lock-in dates against AMC records; require L1 confirmation. |
