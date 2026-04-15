# System Architecture — Aegis Rebalance Engine

**Author:** Engineering Manager
**Version:** 2.0
**Last Updated:** 2026-04-06
**Status:** Draft
**Reference Data:** `Rebalance V0.xlsx`

---

## 1. Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend** | React 19, TypeScript | Component model, ecosystem maturity, type safety across the codebase. |
| **Styling** | Tailwind CSS | Utility-first CSS for rapid, consistent UI development without style drift. |
| **Data Visualization** | Recharts | Declarative charting library built on React and D3; sufficient for allocation charts and drift visualizations. |
| **State Management** | React Hooks (useState, useReducer, useContext) | MVP scope does not require a global store. Local component state and context are sufficient. |
| **Build Tool** | Vite 6 | Sub-second HMR, native ESM, and fast production builds. |
| **Backend** | Node.js 22 + Fastify | High-throughput HTTP framework with schema-based request validation, plugin architecture, and excellent TypeScript support. |
| **Database** | PostgreSQL 16 | ACID compliance critical for financial data integrity. Mature JSONB support for flexible metadata. Row-level security for future multi-tenancy. |
| **ORM** | Drizzle ORM | Type-safe SQL query builder with zero runtime overhead. Migrations via `drizzle-kit`. |
| **Authentication** | JWT (short-lived access + refresh tokens) | Stateless auth suitable for MVP. Role claims embedded in token payload. |
| **Real-time** | Server-Sent Events (SSE) | Simpler than WebSockets for unidirectional server-to-client notifications (state transition alerts). |
| **CSV Generation** | `csv-stringify` (Node.js) | Stream-based CSV generation for BSE Star formatted output. |
| **Testing** | Vitest (unit/integration), Playwright (E2E) | Vitest shares Vite config; Playwright for critical workflow E2E tests. |
| **Linting/Formatting** | ESLint 9 (flat config), Prettier | Consistent code quality and formatting across the monorepo. |
| **Infrastructure** | Docker Compose (local dev) | Single-command local environment with PostgreSQL, backend, and frontend services. |
| **CI/CD** | GitHub Actions | Lint, test, build, and deploy pipelines with environment-based promotion. |

---

## 2. High-Level System Design

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Browser (React SPA)                         │
│                                                                     │
│  ┌──────────────┐  ┌──────────────────┐  ┌───────────────────────┐ │
│  │  Research     │  │  Rebalance       │  │  Ops Bridge           │ │
│  │  Dashboard    │  │  (User Detail)   │  │  (Batch + CSV)        │ │
│  └──────┬───────┘  └────────┬─────────┘  └───────────┬───────────┘ │
│         │                   │                         │             │
│         └───────────────────┼─────────────────────────┘             │
│                             │  HTTP REST + SSE                      │
└─────────────────────────────┼───────────────────────────────────────┘
                              │
                   ┌──────────▼──────────┐
                   │   API Gateway       │
                   │   (Fastify)         │
                   │                     │
                   │  ┌───────────────┐  │
                   │  │ Auth Middleware│  │
                   │  │ (JWT + RBAC)  │  │
                   │  └───────────────┘  │
                   │                     │
                   │  ┌───────────────┐  │
                   │  │ State Machine │  │
                   │  │ Engine        │  │
                   │  └───────────────┘  │
                   │                     │
                   │  ┌───────────────┐  │
                   │  │ CSV Generator │  │
                   │  │ (BSE Star)    │  │
                   │  └───────────────┘  │
                   │                     │
                   │  ┌───────────────┐  │
                   │  │ SSE Notifier  │  │
                   │  └───────────────┘  │
                   └──────────┬──────────┘
                              │
               ┌──────────────┼──────────────┐
               │              │              │
    ┌──────────▼───────┐      │     ┌────────▼────────┐
    │  PostgreSQL 16   │      │     │  File System /  │
    │                  │      │     │  S3 (CSV Store) │
    │  - recommendations│     │     └─────────────────┘
    │  - approvals     │      │
    │  - audit_logs    │      │
    │  - users/roles   │      │
    └──────────────────┘      │
                              │
                   ┌──────────▼──────────┐
                   │  ML Recommendation  │
                   │  Engine (Upstream)   │
                   │  - Writes to DB     │
                   │  - or internal API  │
                   └─────────────────────┘
```

---

## 3. Core Architecture Decisions

### 3.1 State Machine as First-Class Citizen

The approval workflow is the heart of the system. We implement it as an explicit state machine with:

- **Allowed transitions defined in code** as a constant map (not ad-hoc conditionals).
- **Role-gated transitions:** Each transition specifies which roles can trigger it.
- **Transition validation** at both the application layer (Fastify route handler) AND the database layer (CHECK constraints + trigger functions) for defense-in-depth.

```typescript
// State machine definition (source of truth)
// Status is at the USER/REQUEST level, not per individual fund recommendation.
const STATE_TRANSITIONS: Record<Status, TransitionRule[]> = {
  PENDING_REVIEW: [{ to: 'DRAFT',       role: 'L1' },
                   { to: 'APPROVED',    role: 'L1' }],
  DRAFT:          [{ to: 'APPROVED',    role: 'L1' },
                   { to: 'PENDING_REVIEW', role: 'L1' }],
  APPROVED:       [{ to: 'IN_PROGRESS', role: 'OPS' }],
  IN_PROGRESS:    [{ to: 'COMPLETED',   role: 'OPS' }],
  COMPLETED:      [],
};
```

### 3.2 Monorepo Structure

```
rebalance-engine/
├── apps/
│   ├── web/                    # React 19 + Vite frontend
│   │   ├── src/
│   │   │   ├── components/     # Shared UI components
│   │   │   ├── features/       # Feature-sliced modules
│   │   │   │   ├── dashboard/  # Research dashboard
│   │   │   │   ├── approval/   # L1/L2 approval workflows
│   │   │   │   ├── ops/        # Ops bridge & batch processing
│   │   │   │   └── audit/      # Audit log viewer
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   ├── lib/            # Utilities, API client, types
│   │   │   └── App.tsx
│   │   └── vite.config.ts
│   └── api/                    # Fastify backend
│       ├── src/
│       │   ├── routes/         # Route handlers
│       │   ├── services/       # Business logic
│       │   ├── middleware/     # Auth, RBAC, validation
│       │   ├── state-machine/  # Transition engine
│       │   ├── csv/            # BSE Star CSV generator
│       │   ├── sse/            # Server-Sent Events manager
│       │   ├── db/             # Drizzle schema + migrations
│       │   └── server.ts
│       └── tsconfig.json
├── packages/
│   └── shared/                 # Shared types, constants, state machine definition
│       ├── types.ts
│       └── states.ts
├── docker-compose.yml
├── context.md
├── arch.md
├── apidoc.md
├── plan.md
├── setup.md
└── README.md
```

### 3.3 SSE for Real-Time Notifications

Server-Sent Events over plain HTTP are chosen over WebSockets because:
- Notifications are **unidirectional** (server -> client only).
- SSE auto-reconnects natively in browsers.
- No additional infrastructure (no Redis pub/sub needed for MVP).
- Simpler to implement behind reverse proxies and load balancers.

Each connected client subscribes to an SSE endpoint with their user ID. When a state transition occurs, the backend publishes an event to all relevant subscribers (e.g., L2 managers when a new `L2_PENDING` arrives).

---

## 4. Data Flow

### 4.1 ML Recommendation Ingestion

1. The upstream ML engine writes recommendations to the `recommendations` table (or pushes via internal API).
2. Each recommendation row contains: portfolio ID, asset, current weight, target weight, recommended action, quantity, and a status of `PENDING`.
3. The Research Dashboard polls or receives SSE notifications for new `PENDING` recommendations.

### 4.2 Approval Flow

Status is tracked at the **user/request level**. All fund recommendations for a user share the same request status.

1. L1 Analyst navigates to a user's recommendations via the Rebalance page.
2. The recommendations table shows ML recommendations (read-only) alongside analyst values.
3. **Edit via Modal:** L1 clicks "Edit" on any row to open the detail modal with editable form (action, amount, qty, trim %, notes). NAV is displayed for reference.
4. **Save as Draft:** L1 saves edits without submitting → request status becomes `DRAFT`.
5. **Submit:** L1 submits all edits → request status becomes `APPROVED`.
   - If any edits deviate >5% from ML, deviations are flagged in the submission.
   - Audit log entry created.
6. No separate L2 review step in the current implementation — deviations are tracked but auto-submitted.

### 4.3 Batch Execution Flow

1. Ops fetches `APPROVED` recommendations via `GET /api/recommendations?status=APPROVED`.
2. Ops selects items and sends `POST /api/batches` with `{ recommendationIds: [...] }`.
3. Backend wraps the following in a single DB transaction:
   - Creates a `batch` record with status `IN_PROGRESS`.
   - Transitions all selected recommendations from `APPROVED` to `IN_PROGRESS`.
   - Generates the BSE Star CSV.
   - Stores the CSV file (filesystem or S3) and records the path in the batch record.
4. Response includes a download URL for the CSV.
5. Ops uploads CSV to BSE Star externally (out of system scope for MVP).
6. Ops sends `POST /api/batches/:id/complete` to mark all items as `COMPLETED`.

---

## 5. Database Schema

Schema derived from `Rebalance V0.xlsx` — maps each spreadsheet sheet to a database table.

```sql
-- Users and Roles (MVP: seeded, no self-registration)
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    name            VARCHAR(255) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(20) NOT NULL CHECK (role IN ('L1', 'L2', 'OPS', 'ADMIN')),
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- User portfolios (maps to "User Data" sheet header)
CREATE TABLE portfolios (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_account_id VARCHAR(50) NOT NULL,              -- e.g., '5201745730863104'
    name            VARCHAR(255) NOT NULL,
    total_aum       DECIMAL(18, 2) NOT NULL DEFAULT 0,
    mandate         VARCHAR(20) NOT NULL DEFAULT 'Moderate'
                    CHECK (mandate IN ('Conservative', 'Low', 'Moderate', 'High', 'Aggressive')),
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Risk mandate target allocations (maps to "ML Recommendation" sheet rows 1-6)
CREATE TABLE risk_mandates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(20) UNIQUE NOT NULL,        -- 'Conservative', 'Low', 'Moderate', 'High', 'Aggressive'
    large_cap_pct   DECIMAL(5, 4) NOT NULL,             -- e.g., 0.10 = 10%
    mid_cap_pct     DECIMAL(5, 4) NOT NULL,
    small_cap_pct   DECIMAL(5, 4) NOT NULL,
    gold_pct        DECIMAL(5, 4) NOT NULL,
    debt_pct        DECIMAL(5, 4) NOT NULL,
    thematic_pct    DECIMAL(5, 4) NOT NULL,
    aif_pct         DECIMAL(5, 4) NOT NULL DEFAULT 0,
    pms_pct         DECIMAL(5, 4) NOT NULL DEFAULT 0,
    unlisted_pct    DECIMAL(5, 4) NOT NULL DEFAULT 0
);

-- Fund holdings (maps to "User Data → Fund Level Detail" rows)
CREATE TABLE holdings (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id            UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    fund_name               VARCHAR(255) NOT NULL,
    isin                    VARCHAR(20) NOT NULL,          -- e.g., 'INF879O01027'
    category                VARCHAR(100) NOT NULL,         -- 'Flexi Cap Fund', 'ELSS', 'Mid Cap Fund', etc.
    rating                  INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),  -- star rating
    asset_class             VARCHAR(50) NOT NULL,          -- 'Equity', 'Debt', 'Hybrid', 'Fixed Income'
    available_units         DECIMAL(18, 4) NOT NULL,
    short_term_units        DECIMAL(18, 4) NOT NULL DEFAULT 0,
    long_term_units         DECIMAL(18, 4) NOT NULL DEFAULT 0,
    short_term_gains        DECIMAL(18, 2) NOT NULL DEFAULT 0,  -- can be negative (unrealized loss)
    long_term_gains         DECIMAL(18, 2) NOT NULL DEFAULT 0,
    tax_payable             DECIMAL(18, 2) NOT NULL DEFAULT 0,
    exit_load_amount        DECIMAL(18, 2) NOT NULL DEFAULT 0,
    units_under_exit_load   DECIMAL(18, 4) NOT NULL DEFAULT 0,
    units_free_from_exit_load DECIMAL(18, 4) NOT NULL DEFAULT 0,
    current_value           DECIMAL(18, 2) NOT NULL DEFAULT 0,  -- computed: NAV × available_units
    created_at              TIMESTAMPTZ DEFAULT now(),
    updated_at              TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_holdings_portfolio ON holdings (portfolio_id);
CREATE INDEX idx_holdings_isin ON holdings (isin);
CREATE INDEX idx_holdings_category ON holdings (category);

-- ML-generated rebalance recommendations (maps to "ML Recommendation → Final Action" rows)
CREATE TABLE recommendations (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id            UUID NOT NULL REFERENCES portfolios(id),
    isin                    VARCHAR(20) NOT NULL,
    fund_name               VARCHAR(255) NOT NULL,
    category_group          VARCHAR(50) NOT NULL,           -- 'Equity', 'Hybrid', 'Fixed Income'
    category                VARCHAR(100) NOT NULL,          -- 'Mid Cap Fund', 'ELSS', etc.
    rating                  INTEGER NOT NULL,
    rating_star             VARCHAR(5),                     -- '5★', '3★', etc.
    value_now               DECIMAL(18, 2) NOT NULL DEFAULT 0,
    sold_amount             DECIMAL(18, 2) NOT NULL DEFAULT 0,
    buy_amount              DECIMAL(18, 2) NOT NULL DEFAULT 0,
    final_value             DECIMAL(18, 2) NOT NULL DEFAULT 0,
    final_weight_pct        DECIMAL(7, 4) NOT NULL DEFAULT 0,
    exit_amt_sold           DECIMAL(18, 2) NOT NULL DEFAULT 0,
    tax_est_amt_sold        DECIMAL(18, 2) NOT NULL DEFAULT 0,
    realized_gain_sold      DECIMAL(18, 2) NOT NULL DEFAULT 0,
    net_cash_from_sells     DECIMAL(18, 2) NOT NULL DEFAULT 0,
    why_selling             VARCHAR(100),                   -- rule ID: 'R_LOCKIN_FREE_SELL', 'R5_3star_zero_if_45_in_cat', etc.
    why_buying              VARCHAR(100),                   -- 'EQ_LARGE_NEW_R5_RANK1', etc.
    pct_value_in_stcg       DECIMAL(7, 4) NOT NULL DEFAULT 0,
    pct_value_in_exit_load  DECIMAL(7, 4) NOT NULL DEFAULT 0,
    pct_value_sellable_now  DECIMAL(7, 4) NOT NULL DEFAULT 0,
    action                  VARCHAR(20) NOT NULL CHECK (action IN ('BUY', 'SELL', 'HOLD', 'TRIM')),
    comment                 TEXT,                           -- human-readable explanation
    -- Boolean flags
    flag_under_2pct         BOOLEAN NOT NULL DEFAULT false,
    flag_over_25pct         BOOLEAN NOT NULL DEFAULT false,
    flag_three_over_5       BOOLEAN NOT NULL DEFAULT false,
    flag_debt_rotation_category BOOLEAN NOT NULL DEFAULT false,
    flag_lockin_category    BOOLEAN NOT NULL DEFAULT false,
    flag_sold_due_to_debt_rotation BOOLEAN NOT NULL DEFAULT false,
    flag_sold_due_to_lockin BOOLEAN NOT NULL DEFAULT false,
    flag_sold_low_rating    BOOLEAN NOT NULL DEFAULT false,
    flag_sold_overlap       BOOLEAN NOT NULL DEFAULT false,
    flag_trim_3star_cap     BOOLEAN NOT NULL DEFAULT false,
    -- Workflow status
    status                  VARCHAR(20) NOT NULL DEFAULT 'PENDING_REVIEW'
                            CHECK (status IN ('PENDING_REVIEW', 'DRAFT', 'APPROVED', 'IN_PROGRESS', 'COMPLETED')),
    ml_model_version        VARCHAR(50),
    created_at              TIMESTAMPTZ DEFAULT now(),
    updated_at              TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_recommendations_status ON recommendations (status);
CREATE INDEX idx_recommendations_portfolio ON recommendations (portfolio_id);
CREATE INDEX idx_recommendations_isin ON recommendations (isin);

-- Sell schedule (maps to "Sell Schedule" sheet — lot-level, ~1000+ rows per portfolio)
CREATE TABLE sell_schedule (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recommendation_id       UUID NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
    user_account_id         VARCHAR(50) NOT NULL,
    isin                    VARCHAR(20) NOT NULL,
    fund_name               VARCHAR(255) NOT NULL,
    category_group          VARCHAR(50) NOT NULL,
    category                VARCHAR(100) NOT NULL,
    rating                  INTEGER NOT NULL,
    value_as_of_date        DECIMAL(18, 2) NOT NULL,
    sell_amt                DECIMAL(18, 2) NOT NULL,
    best_sell_date          DATE NOT NULL,
    settle_date             DATE NOT NULL,
    best_exit_rate          DECIMAL(7, 4) NOT NULL DEFAULT 0,   -- e.g., 0.01 = 1%
    best_tax_rate           DECIMAL(7, 4) NOT NULL DEFAULT 0,   -- e.g., 0.125 = 12.5%
    realized_gain           DECIMAL(18, 2) NOT NULL DEFAULT 0,
    exit_amt                DECIMAL(18, 2) NOT NULL DEFAULT 0,
    tax_est_amt             DECIMAL(18, 2) NOT NULL DEFAULT 0,
    why_selling             VARCHAR(100) NOT NULL,
    net_cash                DECIMAL(18, 2) NOT NULL DEFAULT 0,
    created_at              TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sell_schedule_rec ON sell_schedule (recommendation_id);
CREATE INDEX idx_sell_schedule_date ON sell_schedule (best_sell_date);
CREATE INDEX idx_sell_schedule_settle ON sell_schedule (settle_date);

-- Sell summary (maps to "Sell Summary" sheet — aggregated per fund)
CREATE TABLE sell_summary (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id            UUID NOT NULL REFERENCES portfolios(id),
    isin                    VARCHAR(20) NOT NULL,
    fund_name               VARCHAR(255) NOT NULL,
    category_group          VARCHAR(50) NOT NULL,
    category                VARCHAR(100) NOT NULL,
    rating                  INTEGER NOT NULL,
    rating_star             VARCHAR(5),
    value_now               DECIMAL(18, 2) NOT NULL,
    sold_amount             DECIMAL(18, 2) NOT NULL,
    sold_pct_of_holding     DECIMAL(7, 4) NOT NULL,
    first_sell_date         DATE NOT NULL,
    last_settle_date        DATE NOT NULL,
    why_selling             VARCHAR(100) NOT NULL,
    created_at              TIMESTAMPTZ DEFAULT now()
);

-- Buy schedule (maps to "Buy Schedule" sheet — date-wise tranches)
CREATE TABLE buy_schedule (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recommendation_id       UUID NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
    buy_date                DATE NOT NULL,
    isin                    VARCHAR(20) NOT NULL,
    fund_name               VARCHAR(255) NOT NULL,
    category_group          VARCHAR(50) NOT NULL,
    category                VARCHAR(100) NOT NULL,
    rating                  INTEGER NOT NULL,
    rating_star             VARCHAR(5),
    rank_in_category        INTEGER NOT NULL DEFAULT 1,
    buy_amt                 DECIMAL(18, 2) NOT NULL,
    why_buying              VARCHAR(100) NOT NULL,
    eq_pct                  DECIMAL(7, 4) NOT NULL DEFAULT 0,
    debt_pct                DECIMAL(7, 4) NOT NULL DEFAULT 0,
    comm_pct                DECIMAL(7, 4) NOT NULL DEFAULT 0,
    buy_pct_of_deployed_cash DECIMAL(7, 4) NOT NULL DEFAULT 0,
    est_units               DECIMAL(18, 4) NOT NULL DEFAULT 0,
    created_at              TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_buy_schedule_rec ON buy_schedule (recommendation_id);
CREATE INDEX idx_buy_schedule_date ON buy_schedule (buy_date);

-- Buy summary (maps to "Buy Summary" sheet — aggregated per fund)
CREATE TABLE buy_summary (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id            UUID NOT NULL REFERENCES portfolios(id),
    isin                    VARCHAR(20) NOT NULL,
    fund_name               VARCHAR(255) NOT NULL,
    category_group          VARCHAR(50) NOT NULL,
    category                VARCHAR(100) NOT NULL,
    rating                  INTEGER NOT NULL,
    rating_star             VARCHAR(5),
    rank_in_category        INTEGER NOT NULL DEFAULT 1,
    buy_amount              DECIMAL(18, 2) NOT NULL,
    buy_pct_of_deployed_cash DECIMAL(7, 4) NOT NULL,
    first_buy_date          DATE NOT NULL,
    why_buying              VARCHAR(100) NOT NULL,
    created_at              TIMESTAMPTZ DEFAULT now()
);

-- Modifications (L1 deviations from ML recommendations)
CREATE TABLE modifications (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recommendation_id   UUID NOT NULL REFERENCES recommendations(id),
    modified_by         UUID NOT NULL REFERENCES users(id),
    original_action     VARCHAR(20) NOT NULL,
    original_amount     DECIMAL(18, 2) NOT NULL,
    new_action          VARCHAR(20) NOT NULL,
    new_amount          DECIMAL(18, 2) NOT NULL,
    rationale           TEXT NOT NULL,
    created_at          TIMESTAMPTZ DEFAULT now()
);

-- Batch execution records
CREATE TABLE batches (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id    UUID NOT NULL REFERENCES portfolios(id),
    status          VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS'
                    CHECK (status IN ('IN_PROGRESS', 'COMPLETED')),
    sell_csv_path   TEXT,
    buy_csv_path    TEXT,
    total_sell_amt  DECIMAL(18, 2) NOT NULL DEFAULT 0,
    total_buy_amt   DECIMAL(18, 2) NOT NULL DEFAULT 0,
    total_tax_est   DECIMAL(18, 2) NOT NULL DEFAULT 0,
    total_exit_load DECIMAL(18, 2) NOT NULL DEFAULT 0,
    initiated_by    UUID NOT NULL REFERENCES users(id),
    completed_by    UUID REFERENCES users(id),
    notes           TEXT,
    initiated_at    TIMESTAMPTZ DEFAULT now(),
    completed_at    TIMESTAMPTZ
);

CREATE TABLE batch_items (
    batch_id            UUID NOT NULL REFERENCES batches(id),
    recommendation_id   UUID NOT NULL REFERENCES recommendations(id),
    PRIMARY KEY (batch_id, recommendation_id)
);

-- Immutable audit log
CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    action          VARCHAR(100) NOT NULL,
    resource_type   VARCHAR(50) NOT NULL,
    resource_id     UUID NOT NULL,
    previous_state  VARCHAR(20),
    new_state       VARCHAR(20),
    details         JSONB DEFAULT '{}',
    ip_address      INET,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_resource ON audit_logs (resource_type, resource_id);
CREATE INDEX idx_audit_user ON audit_logs (user_id, created_at DESC);

REVOKE UPDATE, DELETE ON audit_logs FROM PUBLIC;
```

---

## 6. Security Considerations

### 6.1 Authentication
- JWT-based authentication with short-lived access tokens (15 min) and refresh tokens (7 days).
- Passwords hashed with `argon2id` (memory-hard, timing-safe).
- Refresh token rotation: each use invalidates the previous token.

### 6.2 Authorization (RBAC)
- Role is embedded in the JWT payload: `{ sub: userId, role: "L1" | "L2" | "OPS" | "ADMIN" }`.
- Fastify `preHandler` hook validates role against the required role for each route.
- State machine enforces role checks independently of route-level RBAC (defense-in-depth).

### 6.3 Data Integrity
- All financial amounts stored as `DECIMAL`, never floating point.
- Batch transitions wrapped in serializable transactions to prevent race conditions.
- CHECK constraints on `status` column prevent invalid states at the DB level.
- Foreign key constraints with appropriate `ON DELETE` behavior.

### 6.4 Input Validation
- All request bodies validated against JSON Schema via Fastify's built-in Ajv integration.
- Parameterized queries only (Drizzle ORM prevents SQL injection by design).
- Rate limiting: 200 req/min per authenticated user (configurable).

### 6.5 Audit & Compliance
- Audit logs are append-only (no UPDATE/DELETE permissions granted).
- Every state transition produces an audit record before the response is sent (same transaction).
- Audit log retention: 7 years minimum (regulatory requirement).
- CSV files stored immutably with checksums for tamper detection.

### 6.6 Transport Security
- All traffic over HTTPS (TLS 1.2+ in production).
- Secure cookie flags for refresh tokens: `HttpOnly`, `Secure`, `SameSite=Strict`.
- CORS restricted to known frontend origins.
