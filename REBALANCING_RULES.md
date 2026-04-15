# Rebalancing Rules & Logic

## Objective

Restore portfolio health by aligning investments with the user's risk appetite and financial goals.

Three core outcomes:
1. **Realignment** — Reset the portfolio to its Ideal Asset Weights to manage risk per the user's mandate.
2. **Sanitization** — Remove Bad Performing Funds (laggards) that drag down returns.
3. **Optimization** — Inject new Alpha Generating Funds (market beaters) to enhance future growth potential.

---

## Inputs

**Input A — User Portfolio Ledger**
- Transaction details: date of investment, purchase NAV, units held
- Tax status: STCG vs LTCG calculation per lot
- Exit barriers: applicable exit loads if sold today

**Input B — User Mandate (Target)**
- Primary allocation: Equity vs Debt vs Commodities
- Equity sub-split: Large Cap vs Mid & Small Cap
- Debt sub-split: Low Yield (Safe) vs High Yield (Risk)
- Metals: Gold vs Silver

---

## Output — Rebalancing Report

Five possible actions per fund:

| Action | Description |
|--------|-------------|
| **Buy New** | Purchase high-alpha fund to fill an asset gap |
| **Top-Up** | Add capital to an existing 5-star fund |
| **Hold** | Retain well-performing mandate-aligned funds |
| **Sell** | Exit bad funds completely (tax-efficient) |
| **Trim** | Partially reduce overweight positions |

---

## 1. Sell Rules

### Quality-Based Sells

**1★ & 2★ Funds — Immediate Must Sell**
- No exceptions; exit all units.

**Debt & Liquid Funds**
- Sell all pure Debt and Liquid funds regardless of rating.
- Strategy: shift strictly to Arbitrage Funds for superior tax treatment.

**3★ Funds — Conditional**

Sell if:
- A 4★ or 5★ fund exists in the same category, OR
- High similarity (>40% overlap) exists with a 4★/5★ fund already held.

Hold & Review if:
- The fund is unique in the portfolio (no overlap, no duplicates).
- Retained 3★ funds are re-evaluated if ratings change.

### Concentration-Based Sells

**3★ Fund Cap (5% rule)**
- If a retained 3★ fund exceeds 5% of total portfolio value → sell the excess to bring allocation back to 5%.

### Tax & Exit Load Optimisation

- System looks ahead to month-end for upcoming tax/load relief windows.
- If a fund becomes LTCG-eligible or Exit Load–free within that window → sell is deferred to the optimal date.

---

## 2. Buy Rules

### Asset Allocation Driver
- Equity vs Commodity allocation follows Analyst views on the current market scenario.
- Optimiser targets scenario-defined weights from the user's mandate.

### Fixed Income
- All capital allocated to "Debt" is invested only in Arbitrage Funds.
- Rationale: equity taxation treatment; avoids higher debt tax rates.

### Equity Selection Logic (The "5★ Rule")

| Scenario | User's Current Holding | Action |
|----------|----------------------|--------|
| A | Holds a 5★ fund in the category | Top-up the existing 5★ fund |
| B | Holds a 4★ fund in the category | Hold the 4★; no sell. New money → Rank-1 5★ fund in category |
| C | Holds nothing in the category | Buy the Rank-1 5★ fund in that category |

---

## 3. Allocation & Optimisation (Convex Optimiser)

### Band Limits
- Enforced per Analyst Market Scenario (e.g. Equity 70%, Debt 20%).

### Fund Caps
| Rule | Cap |
|------|-----|
| New buys | Max 25% of portfolio |
| Top-ups | Max 20% of portfolio |
| 3★ total exposure | Max 30% of portfolio |
| Minimum ticket size | ₹5,000 (no order below this) |

---

## 4. Execution & Timing

### Settlement Awareness
- Buy orders execute **only after sell proceeds have settled**.
- Standard equity settlement: **T+3 business days**.

### Sequential Workflow
```
TRIGGERED → SELL_PENDING → AWAITING_SETTLEMENT → RECONCILIATION → BUY_PENDING → COMPLETE
```

### Buy Formula
```
Buy Units = (Realised Amount × Target %) / Current NAV
```

---

## 5. Review Workflow (Human-in-the-Loop)

Status is tracked at the **user/request level**, not per individual fund recommendation. All recommendations for a user share the same request status.

### L1 (Analyst)
- Reviews ML recommendations per user.
- Can edit any fund's action, amount, qty, or trim % via the Edit modal.
- Editing uses a draft system — changes are not applied until saved or submitted.
- NAV is displayed in the modal for amount/qty cross-reference.
- Trim action: analyst sets a trim percentage, and the amount is auto-calculated from current value.
- Can Save as Draft (persist edits without submitting) or Submit.
- If any edit deviates >5% from the ML recommendation, deviations are flagged on submission.

### Request Statuses
| Status | Meaning |
|--------|---------|
| `DRAFT` | Analyst has saved edits, not yet submitted |
| `PENDING_REVIEW` | Awaiting L1 review |
| `APPROVED` | Cleared for BSE Star execution |
| `IN_PROGRESS` | Batch started by Ops |
| `COMPLETED` | Execution confirmed by Ops |

### NAV Reference
- Same-day NAV values are available per ISIN for amount/qty calculations.
- Displayed in the recommendation edit modal for analyst reference.
- Buy Formula: `Buy Units = Amount / Current NAV`
