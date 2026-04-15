# Aegis Rebalance Engine

A scalable, semi-automated portfolio rebalancing infrastructure that bridges Research and Operations teams through ML-driven recommendations, tiered approval workflows, and BSE Star CSV execution bridging.

---

## Overview

Aegis Rebalance Engine streamlines the lifecycle of portfolio rebalancing:

1. **ML recommendations** are generated for portfolio drift correction.
2. **L1 Analysts** review and approve recommendations — or propose deviations.
3. **L2 Managers** review deviations for compliance, approving or rejecting them.
4. **Operations** batch-process approved recommendations and generate BSE Star CSV files for execution.

Every action is tracked in an immutable audit trail, ensuring full regulatory compliance.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Tailwind CSS, Recharts, Vite 6 |
| Backend | Node.js 22, Fastify, Drizzle ORM |
| Database | PostgreSQL 16 |
| Auth | JWT (access + refresh tokens), RBAC |
| Real-time | Server-Sent Events (SSE) |
| Testing | Vitest, Playwright |
| Infrastructure | Docker Compose |

---

## Quick Start

```bash
# 1. Clone and install
git clone git@github.com:your-org/rebalance-engine.git
cd rebalance-engine
pnpm install

# 2. Set up environment
cp .env.example .env

# 3. Start database
docker compose up -d postgres

# 4. Run migrations and seed
pnpm --filter api db:migrate
pnpm --filter api db:seed

# 5. Start development servers
pnpm dev
```

- Frontend: http://localhost:5173
- API: http://localhost:3001

See [setup.md](./setup.md) for detailed instructions, environment variables, and troubleshooting.

---

## Documentation

| Document | Description |
|---|---|
| [context.md](./context.md) | **Product Requirements Document (PRD)** — Product vision, user personas, feature requirements, state machine, success metrics, and risk analysis. |
| [arch.md](./arch.md) | **System Architecture** — Tech stack decisions, high-level design, data flow diagrams, database schema (SQL), monorepo structure, and security considerations. |
| [apidoc.md](./apidoc.md) | **API Documentation** — Authentication flow, rate limiting, all REST endpoints with request/response examples, SSE events, and error code reference. |
| [plan.md](./plan.md) | **Agile Execution Plan** — 4-phase, 8-week sprint plan with task breakdowns, definitions of done, risk register, branch strategy, and ceremony schedule. |
| [setup.md](./setup.md) | **Development Setup Guide** — Prerequisites, environment variables, installation steps, run commands, Docker Compose reference, and troubleshooting. |

---

## Agent Personas

The `agents/` directory contains system prompt files for Claude Code to adopt specialized roles during development:

| Agent | File | Focus Area |
|---|---|---|
| Sr. Product Manager | [agents/pm-agent.md](./agents/pm-agent.md) | User needs, scope management, feature acceptance criteria |
| Engineering Manager | [agents/em-agent.md](./agents/em-agent.md) | Architecture decisions, code reviews, scaling, unblocking |
| SDE4 Frontend | [agents/sde4-frontend.md](./agents/sde4-frontend.md) | React UI, state management, API integration, performance |
| SDE4 Backend | [agents/sde4-backend.md](./agents/sde4-backend.md) | Database design, API endpoints, state machine, security |
| Project Manager | [agents/project-manager.md](./agents/project-manager.md) | Sprint tracking, risk management, git workflow, releases |

---

## Project Structure

```
rebalance-engine/
├── apps/
│   ├── web/              # React 19 + Vite frontend
│   └── api/              # Fastify backend
├── packages/
│   └── shared/           # Shared types, constants, state machine
├── agents/               # Claude Code agent persona files
├── context.md            # PRD
├── arch.md               # Architecture
├── apidoc.md             # API docs
├── plan.md               # Execution plan
├── setup.md              # Setup guide
├── docker-compose.yml    # Dev infrastructure
└── README.md             # This file
```

## New Features (v2.0)
- **Massive 5-Row Dashboard KPI Tracking:** Full-stack implementation featuring complex aggregated React ApexCharts matrices backed by PostgreSQL Drizzle ORM definitions querying live `user_reviews` and `rebalance_actions` models via strict Fastify/Express validation pipelines. Added exhaustive 12-month metrics reporting.

---

## License

Proprietary. Internal use only.
