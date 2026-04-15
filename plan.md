# Agile Execution Plan — Aegis Rebalance Engine

**Author:** Project Manager
**Version:** 2.0
**Last Updated:** 2026-04-06
**Reference Data:** `Rebalance V0.xlsx`
**Methodology:** Agile (2-week sprints)
**Estimated Duration:** 10 weeks (5 phases)

---

## Phase 1: Scaffolding & Data Model (Weeks 1-2)

**Goal:** Establish the monorepo, database schema matching the MF data model from `Rebalance V0.xlsx`, authentication, and developer tooling.

### Sprint 1 (Week 1)

| Task | Owner | Priority | Est. |
|---|---|---|---|
| Initialize monorepo: `apps/web` (React 19 + Vite), `apps/api` (Fastify), `packages/shared` | SDE4 Backend | P0 | 2h |
| Configure Tailwind CSS + base component library (Button, Card, Table, Badge, Modal) | SDE4 Frontend | P0 | 4h |
| Set up Docker Compose (PostgreSQL 16, Redis 7) | SDE4 Backend | P0 | 2h |
| Design database schema matching `User Data` sheet: `users`, `portfolios`, `holdings` tables | SDE4 Backend | P0 | 4h |
| Design `holdings` table with all MF-specific fields: ISIN, category, rating, asset_class, available_units, short_term_units, long_term_units, short_term_gains, long_term_gains, tax_payable, exit_load_amount, units_under_exit_load, units_free_from_exit_load | SDE4 Backend | P0 | 3h |
| Design `risk_mandates` table: mandate name → target allocations per asset category | SDE4 Backend | P0 | 2h |
| Implement Drizzle ORM schema definitions and run initial migrations | SDE4 Backend | P0 | 3h |
| Configure ESLint 9 + Prettier for monorepo | EM | P1 | 1h |

### Sprint 2 (Week 2)

| Task | Owner | Priority | Est. |
|---|---|---|---|
| Design `recommendations` table matching `ML Recommendation → Final Action` sheet: all 32 columns including action, comment, sold/buy amounts, flags | SDE4 Backend | P0 | 4h |
| Design `sell_schedule` table matching `Sell Schedule` sheet: 17 columns (user_id, isin, sell_amt, best_sell_date, settle_date, exit_rate, tax_rate, realized_gain, etc.) | SDE4 Backend | P0 | 3h |
| Design `buy_schedule` table matching `Buy Schedule` sheet: 15 columns (buy_date, isin, buy_amt, why_buying, pct_of_deployed_cash, etc.) | SDE4 Backend | P0 | 3h |
| Design `sell_summary` and `buy_summary` tables | SDE4 Backend | P0 | 2h |
| Implement JWT authentication (login, refresh, logout) | SDE4 Backend | P0 | 4h |
| Implement RBAC middleware (L1, L2, OPS, ADMIN roles) | SDE4 Backend | P0 | 3h |
| Create seed script importing data from `Rebalance V0.xlsx` (all 6 sheets) | SDE4 Backend | P0 | 4h |
| Build Login page UI and auth flow | SDE4 Frontend | P0 | 3h |
| Set up GitHub Actions CI (lint, typecheck, test) | EM | P1 | 2h |

### Definition of Done — Phase 1
- [ ] All database tables created matching `Rebalance V0.xlsx` column structure.
- [ ] Seed data imported: 18 holdings, 5 mandate profiles, 21 Final Action rows, 7 sell summary rows, 3 buy summary rows, 7 buy schedule rows.
- [ ] Login flow works end-to-end with JWT.
- [ ] Protected routes return 401/403 correctly.
- [ ] CI pipeline passes.

---

## Phase 2: Rules Engine & ML Recommendation API (Weeks 3-4)

**Goal:** Implement the rebalancing rules engine, portfolio analysis endpoints, and recommendation generation matching `Rebalance V0.xlsx` outputs.

### Sprint 3 (Week 3)

| Task | Owner | Priority | Est. |
|---|---|---|---|
| Implement portfolio ingestion API: `POST /api/portfolios/:id/holdings` (bulk upsert from CSV/JSON) | SDE4 Backend | P0 | 4h |
| Implement `GET /api/portfolios/:id` with holdings, current allocation, and drift calculation | SDE4 Backend | P0 | 4h |
| Implement mandate assignment: `PUT /api/portfolios/:id/mandate` | SDE4 Backend | P0 | 2h |
| Implement allocation variance calculator: current % vs. target % per asset category | SDE4 Backend | P0 | 4h |
| Implement Rule `R_LOCKIN_FREE_SELL`: identify ELSS funds with completed lock-in, mark for sell | SDE4 Backend | P0 | 3h |
| Implement Rule `R5_3star_zero_if_45_in_cat`: 3★ full sell if 4★/5★ exists in same category | SDE4 Backend | P0 | 3h |
| Implement Rule `R3_cap_to_5pct`: trim 3★ fund exposure exceeding 5% cap | SDE4 Backend | P0 | 3h |

### Sprint 4 (Week 4)

| Task | Owner | Priority | Est. |
|---|---|---|---|
| Implement Hold logic: retain 4★/5★ funds, check exit load / STCG cost windows | SDE4 Backend | P0 | 4h |
| Implement Buy logic: identify Rank-1 5★ funds per category, allocate cash proportionally | SDE4 Backend | P0 | 4h |
| Implement sellability analysis: calculate `pct_value_in_stcg`, `pct_value_in_exit_load`, `pct_value_sellable_now` per holding | SDE4 Backend | P0 | 3h |
| Implement Final Action comment generator (human-readable explanations matching spreadsheet `Comment` column) | SDE4 Backend | P1 | 3h |
| Implement flag calculation: `flag_under_2pct`, `flag_over_25pct`, `flag_three_over_5`, `flag_lockin_category`, `flag_trim_3star_cap`, etc. | SDE4 Backend | P1 | 3h |
| Write comprehensive unit tests: validate rules engine output against all 21 rows from `ML Recommendation → Final Action` sheet | SDE4 Backend | P0 | 6h |
| Implement `GET /api/recommendations?portfolioId=...` returning Final Action table | SDE4 Backend | P0 | 3h |
| Implement state machine engine for recommendation lifecycle (PENDING → APPROVED / L2_PENDING → ...) | SDE4 Backend | P0 | 4h |

### Definition of Done — Phase 2
- [ ] Rules engine produces SELL, TRIM/HOLD, HOLD, and BUY actions matching `Rebalance V0.xlsx` exactly for the test portfolio.
- [ ] All 6 rules validated: R_LOCKIN_FREE_SELL, R5_3star_zero_if_45_in_cat, R3_cap_to_5pct, Hold logic, Buy Rank-1 logic.
- [ ] Allocation variance calculation matches spreadsheet `Allocation` section.
- [ ] State machine enforces valid transitions with role gating.
- [ ] Unit tests verify every row of the Final Action table.
- [ ] >80% backend code coverage.

---

## Phase 3: Tax Optimizer, Trade Scheduling & Approval UI (Weeks 5-7)

**Goal:** Implement the tax/exit load optimizer, sell/buy schedule generation, approval workflow UI, and the Research Dashboard.

### Sprint 5 (Week 5)

| Task | Owner | Priority | Est. |
|---|---|---|---|
| Implement lot-level sell schedule generator: break sell amounts into individual lot transactions with optimal sell dates | SDE4 Backend | P0 | 6h |
| Implement tax calculation per lot: apply STCG (12.5%) or LTCG (12.5%) based on holding period | SDE4 Backend | P0 | 4h |
| Implement exit load calculation per lot: apply fund-specific exit load rates based on purchase date | SDE4 Backend | P0 | 3h |
| Implement settlement date calculation (T+2 for equity, T+1 for debt/liquid) | SDE4 Backend | P0 | 2h |
| Implement buy schedule generator: allocate cash across buy dates based on sell settlement dates | SDE4 Backend | P0 | 4h |
| Implement `GET /api/recommendations/:id/sell-schedule` returning lot-level sell plan | SDE4 Backend | P0 | 2h |
| Implement `GET /api/recommendations/:id/buy-schedule` returning date-wise buy plan | SDE4 Backend | P0 | 2h |
| Validate sell schedule output against `Sell Schedule` sheet (1,329 rows) | SDE4 Backend | P0 | 4h |
| Validate buy schedule output against `Buy Schedule` sheet (7 rows) | SDE4 Backend | P0 | 2h |

### Sprint 6 (Week 6)

| Task | Owner | Priority | Est. |
|---|---|---|---|
| Build Research Dashboard: portfolio metrics cards (AUM, drift %, pending recommendations, mandate type) | SDE4 Frontend | P0 | 3h |
| Build allocation chart: current vs. target allocation (ApexCharts bar) | SDE4 Frontend | P0 | 4h |
| Build recommendations table: fund name, ISIN, rating (star icons), ML rec column (action+amount+qty+comment), analyst action/amount/qty (read-only display), flags, Edit button | SDE4 Frontend | P0 | 5h |
| Build pill-style filter bar: status, action type, rating, search | SDE4 Frontend | P0 | 3h |
| Build recommendation edit modal (5xl, two-panel): left=ML reference (action, amount, qty, NAV, comment, flags, sellability, cost breakdown), right=Research Team Action (editable action/amount/qty/trim%/notes with deviation tracking) | SDE4 Frontend | P0 | 5h |
| Build flag indicators: visual badges for flag_under_2pct, flag_over_25pct, flag_trim_3star_cap, etc. | SDE4 Frontend | P1 | 2h |

### Sprint 7 (Week 7)

| Task | Owner | Priority | Est. |
|---|---|---|---|
| Build L1 Approval flow: Edit modal with Save as Draft / Submit actions. Deviation detection (>5%) with rationale requirement | SDE4 Frontend | P0 | 4h |
| Implement NAV service: fetch same-day NAV per ISIN, display in edit modal, auto-calculate amount from qty and vice versa | SDE4 Frontend | P0 | 3h |
| Build user detail page: two-tab layout (User Profile + Recommendations), nested sub-tabs for Sell/Buy Schedule | SDE4 Frontend | P0 | 4h |
| Build sell schedule viewer: sortable table by sell date, fund, lot amount, tax, exit load | SDE4 Frontend | P1 | 3h |
| Build buy schedule viewer: timeline/table by buy date, fund, amount, % of deployed cash | SDE4 Frontend | P1 | 3h |
| Implement trim percentage calculation: analyst sets %, amount auto-calculated from current value | SDE4 Frontend | P0 | 2h |
| Write integration tests for sell/buy schedule endpoints | SDE4 Backend | P0 | 4h |

### Definition of Done — Phase 3
- [ ] Sell schedule generates lot-level rows matching spreadsheet.
- [ ] Buy schedule generates multi-tranche rows matching spreadsheet.
- [ ] Tax and exit load estimates match within 1 tolerance.
- [ ] Research Dashboard shows portfolio metrics, allocation chart, and recommendations table.
- [ ] Recommendations table is read-only with Edit button per row opening the edit modal.
- [ ] Edit modal: two-panel layout (ML reference left, Research Team Action right) with NAV display.
- [ ] Trim action: analyst sets trim %, amount auto-calculated from current value.
- [ ] Save as Draft and Submit workflows functional end-to-end.
- [ ] Sell/buy schedule viewers display lot-level detail.
- [ ] Status tracked at user/request level, not per fund.

---

## Phase 4: Ops Bridge, BSE Star CSV & Batch Execution (Weeks 8-9)

**Goal:** Build the Operations execution hub with batch processing, BSE Star CSV generation, and audit logging.

### Sprint 8 (Week 8)

| Task | Owner | Priority | Est. |
|---|---|---|---|
| Build Ops Bridge: approved recommendations table with batch selection checkboxes | SDE4 Frontend | P0 | 4h |
| Implement `POST /api/batches` (atomic batch creation from approved recommendations) | SDE4 Backend | P0 | 4h |
| Implement BSE Star CSV generator with columns: Scheme Code (from ISIN mapping), Folio Number, Transaction Type (BUY/SELL mapped to PURCHASE/REDEMPTION), Amount, Units, Remarks | SDE4 Backend | P0 | 4h |
| Implement separate Sell CSV and Buy CSV generation (sells first, buys after settlement) | SDE4 Backend | P0 | 3h |
| Implement `GET /api/batches/:id/sell-csv` and `GET /api/batches/:id/buy-csv` downloads | SDE4 Backend | P0 | 2h |
| Build Ops batch initiation UI: "Start Batch" button, CSV download links, confirmation dialog | SDE4 Frontend | P0 | 3h |
| Implement `POST /api/batches/:id/complete` with mandatory notes | SDE4 Backend | P0 | 2h |
| Build batch completion UI | SDE4 Frontend | P0 | 2h |

### Sprint 9 (Week 9)

| Task | Owner | Priority | Est. |
|---|---|---|---|
| Implement immutable audit log: every state transition, modification, batch action logged | SDE4 Backend | P0 | 4h |
| Build Audit Log viewer (admin-only): filterable table by user, action, resource, date | SDE4 Frontend | P1 | 3h |
| Implement sell/buy summary aggregation endpoints (`GET /api/batches/:id/sell-summary`, `/buy-summary`) | SDE4 Backend | P1 | 3h |
| Build batch summary view: total sell amount, total buy amount, tax estimate, exit load estimate, net cash flow | SDE4 Frontend | P1 | 3h |
| Write integration tests for batch endpoints and CSV generation | SDE4 Backend | P0 | 4h |
| Validate generated CSV against BSE Star format specification | SDE4 Backend | P0 | 3h |

### Definition of Done — Phase 4
- [ ] Ops can batch-select approved recommendations, initiate execution, and download separate Sell/Buy CSVs.
- [ ] CSV columns match BSE Star format.
- [ ] Batch completion records operator ID and timestamp.
- [ ] Audit log captures every action with user, timestamp, payload diff.
- [ ] Sell/buy summary aggregations match `Sell Summary` and `Buy Summary` sheets.

---

## Phase 5: Integration Testing, Polish & Deployment (Week 10)

**Goal:** E2E testing against `Rebalance V0.xlsx` reference data, performance optimization, security review, and production preparation.

### Sprint 10 (Week 10)

| Task | Owner | Priority | Est. |
|---|---|---|---|
| Write Playwright E2E: full cycle — login, view portfolio, review recommendations, approve, batch, download CSV | SDE4 Frontend | P0 | 6h |
| Build automated regression test: import `Rebalance V0.xlsx` data, run rules engine, compare output against all 6 sheets | SDE4 Backend | P0 | 5h |
| Performance audit: optimize slow queries, add indexes for sell_schedule (1,329 rows × N users) | SDE4 Backend | P1 | 3h |
| Security review: RBAC bypass testing, input validation, JWT flow | EM | P0 | 4h |
| Fix P0/P1 bugs | All | P0 | 6h |
| Production Docker config: multi-stage builds, health checks, non-root user | EM | P1 | 3h |
| UAT with representative L1, L2, and Ops users | PM | P0 | 4h |
| Finalize all documentation | PM | P1 | 2h |
| Tag v1.0.0 release | EM | P0 | 1h |

### Definition of Done — Phase 5
- [ ] Automated regression test passes: rules engine output matches `Rebalance V0.xlsx` for all 21 Final Action rows.
- [ ] E2E test suite passes for all critical workflows.
- [ ] No P0/P1 bugs open.
- [ ] Security review completed, no critical findings.
- [ ] UAT signed off by L1, L2, and Ops representatives.
- [ ] v1.0.0 tagged.

---

## Branch Strategy

| Branch | Purpose |
|---|---|
| `main` | Production-ready. Protected, requires PR + 1 approval. |
| `develop` | Integration branch. |
| `feature/p<phase>-<task>` | e.g., `feature/p2-rules-engine`, `feature/p3-sell-schedule` |
| `fix/<description>` | Bug fixes. |
| `release/v1.0.0` | Release candidate from `develop`. |

---

## Risk Register

| Risk | Phase | Mitigation |
|---|---|---|
| Rules engine edge cases not covered by single test portfolio | 2 | Test with multiple mandate profiles (Conservative, High) using synthetic data. |
| Lot-level sell schedule computation is O(n × lots) and may be slow for large portfolios | 3 | Benchmark at 500 holdings × 50 lots each. Cache results. |
| BSE Star CSV format not fully documented internally | 4 | Obtain sample CSVs from Ops in Phase 1. |
| Tax calculation discrepancies with AMC statements | 3 | Label as "estimated"; add reconciliation step post-execution. |
| Multi-tranche buy timing misaligns with market moves | 4 | Allow Ops to defer tranches; re-quote at execution time. |
