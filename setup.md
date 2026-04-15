# Local Development Setup Guide — Aegis Rebalance Engine

**Author:** Engineering Manager / DevOps
**Version:** 1.0
**Last Updated:** 2026-04-06

---

## 1. Prerequisites

Ensure the following tools are installed on your development machine before proceeding.

| Tool | Minimum Version | Purpose | Installation |
|---|---|---|---|
| **Node.js** | v22.x LTS | JavaScript runtime for frontend and backend | [nodejs.org](https://nodejs.org/) or `nvm install 22` |
| **pnpm** | v9.x | Fast, disk-efficient package manager (monorepo workspace support) | `npm install -g pnpm` |
| **Docker** | v24.x | Containerized PostgreSQL and services | [docker.com](https://www.docker.com/) |
| **Docker Compose** | v2.x | Multi-container orchestration | Bundled with Docker Desktop |
| **Git** | v2.40+ | Version control | [git-scm.com](https://git-scm.com/) |
| **PostgreSQL Client** | v16.x (optional) | Direct DB access for debugging | `brew install postgresql@16` (macOS) |

### Recommended IDE

- **VS Code** with the following extensions:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - TypeScript Importer
  - Thunder Client or REST Client (for API testing)

---

## 2. Environment Variables

Create a `.env` file in the project root by copying the template:

```bash
cp .env.example .env
```

### `.env.example` Reference

```env
# ─── Database ───────────────────────────────────────────────
DATABASE_URL=postgresql://aegis:aegis_dev_password@localhost:5432/rebalance_engine
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=rebalance_engine
DATABASE_USER=aegis
DATABASE_PASSWORD=aegis_dev_password

# ─── Authentication ─────────────────────────────────────────
JWT_SECRET=replace-with-a-strong-random-secret-min-32-chars
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d

# ─── API Server ─────────────────────────────────────────────
API_HOST=0.0.0.0
API_PORT=3001
API_CORS_ORIGIN=http://localhost:5173

# ─── Frontend ───────────────────────────────────────────────
VITE_API_BASE_URL=http://localhost:3001/api
VITE_SSE_URL=http://localhost:3001/api/events

# ─── CSV Export ──────────────────────────────────────────────
CSV_STORAGE_PATH=./data/exports

# ─── Logging ─────────────────────────────────────────────────
LOG_LEVEL=debug
NODE_ENV=development
```

> **Security Note:** Never commit `.env` to version control. The `.gitignore` is pre-configured to exclude it.

---

## 3. Installation Steps

### 3.1 Clone the Repository

```bash
git clone git@github.com:your-org/rebalance-engine.git
cd rebalance-engine
```

### 3.2 Install Dependencies

```bash
pnpm install
```

This installs dependencies for all workspaces: `apps/web`, `apps/api`, and `packages/shared`.

### 3.3 Start Infrastructure (PostgreSQL)

```bash
docker compose up -d postgres
```

This starts a PostgreSQL 16 container with:
- Port: `5432`
- Database: `rebalance_engine`
- User: `aegis` / Password: `aegis_dev_password`
- Data persisted in a Docker volume (`pgdata`)

Verify the database is running:

```bash
docker compose ps
# Should show postgres container as "running (healthy)"
```

### 3.4 Run Database Migrations

```bash
pnpm --filter api db:migrate
```

This runs all Drizzle ORM migrations to create tables, indexes, and constraints defined in `arch.md`.

### 3.5 Seed the Database

```bash
pnpm --filter api db:seed
```

This populates the database with:
- **4 users:** L1 Analyst, L2 Manager, Ops Team Member, Admin (see credentials below).
- **3 sample portfolios** with allocation data.
- **15 sample recommendations** in various states for testing all workflow paths.

#### Default Seed User Credentials

| Role | Email | Password |
|---|---|---|
| L1 Analyst | `analyst@aegis.dev` | `analyst123` |
| L2 Manager | `manager@aegis.dev` | `manager123` |
| Ops | `ops@aegis.dev` | `ops123` |
| Admin | `admin@aegis.dev` | `admin123` |

> These credentials are for local development only. Production uses separate, secure credentials.

---

## 4. Run Commands

### 4.1 Start Everything (Recommended)

```bash
# Start PostgreSQL + API + Frontend concurrently
docker compose up -d postgres
pnpm dev
```

The `pnpm dev` command runs the API and frontend in parallel using pnpm workspace filtering:

| Service | URL | Description |
|---|---|---|
| Frontend (Vite) | `http://localhost:5173` | React development server with HMR |
| API (Fastify) | `http://localhost:3001` | Backend API server |
| PostgreSQL | `localhost:5432` | Database |

### 4.2 Run Services Individually

```bash
# Frontend only
pnpm --filter web dev

# Backend only
pnpm --filter api dev

# Shared package (watch mode for type changes)
pnpm --filter shared dev
```

### 4.3 Run Tests

```bash
# All tests across all workspaces
pnpm test

# Backend tests only
pnpm --filter api test

# Frontend tests only
pnpm --filter web test

# Watch mode (re-run on file changes)
pnpm --filter api test:watch

# E2E tests (requires running dev servers)
pnpm test:e2e
```

### 4.4 Lint & Type Check

```bash
# Lint all workspaces
pnpm lint

# Fix auto-fixable lint issues
pnpm lint:fix

# Type check all workspaces
pnpm typecheck
```

### 4.5 Database Commands

```bash
# Generate a new migration after schema changes
pnpm --filter api db:generate

# Run pending migrations
pnpm --filter api db:migrate

# Reset database (drop all tables, re-migrate, re-seed)
pnpm --filter api db:reset

# Open Drizzle Studio (visual DB browser)
pnpm --filter api db:studio
```

### 4.6 Build for Production

```bash
# Build all workspaces
pnpm build

# Preview production frontend build
pnpm --filter web preview
```

---

## 5. Docker Compose Reference

### Full Stack (Development)

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f api
docker compose logs -f web

# Stop all services
docker compose down

# Stop and remove volumes (full reset)
docker compose down -v
```

### `docker-compose.yml` Overview

```yaml
services:
  postgres:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: rebalance_engine
      POSTGRES_USER: aegis
      POSTGRES_PASSWORD: aegis_dev_password
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U aegis -d rebalance_engine"]
      interval: 5s
      timeout: 5s
      retries: 5

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
      target: development
    ports:
      - "3001:3001"
    env_file: .env
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./apps/api/src:/app/apps/api/src
      - ./packages:/app/packages

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
      target: development
    ports:
      - "5173:5173"
    env_file: .env
    depends_on:
      - api
    volumes:
      - ./apps/web/src:/app/apps/web/src

volumes:
  pgdata:
```

---

## 6. Troubleshooting

### Port already in use

```bash
# Find and kill the process on port 3001
lsof -ti:3001 | xargs kill -9

# Or change the port in .env
API_PORT=3002
```

### Database connection refused

```bash
# Check if PostgreSQL container is running
docker compose ps postgres

# Restart PostgreSQL
docker compose restart postgres

# Check logs for errors
docker compose logs postgres
```

### Migration fails

```bash
# Reset the database and re-run migrations from scratch
pnpm --filter api db:reset
```

### `pnpm install` fails on lockfile mismatch

```bash
# Delete node_modules and reinstall
pnpm store prune
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm install
```

### HMR not working (Vite)

Ensure your filesystem supports inotify events. On Docker (Linux host), you may need to increase the inotify watch limit:

```bash
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

---

## 7. Useful Scripts Quick Reference

| Command | Description |
|---|---|
| `pnpm dev` | Start all dev servers concurrently |
| `pnpm build` | Production build for all workspaces |
| `pnpm test` | Run all tests |
| `pnpm test:e2e` | Run Playwright E2E tests |
| `pnpm lint` | Lint all workspaces |
| `pnpm typecheck` | TypeScript type check all workspaces |
| `pnpm --filter api db:migrate` | Run database migrations |
| `pnpm --filter api db:seed` | Seed database with sample data |
| `pnpm --filter api db:reset` | Drop, migrate, and re-seed database |
| `pnpm --filter api db:studio` | Open Drizzle Studio GUI |
| `docker compose up -d` | Start all Docker services |
| `docker compose down -v` | Stop and remove all Docker services + volumes |
