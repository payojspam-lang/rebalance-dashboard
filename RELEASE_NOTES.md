# Release Notes — Aegis Rebalance Engine v2.0

**Date:** April 15, 2026

---

## 🚀 What's New

### Full-Stack 5-Row KPI Dashboard
A comprehensive, data-driven dashboard landing page with real-time metrics:

| Row | Section | Metrics |
|---|---|---|
| 1 | **Primary Growth** | Total Active Users · New Users (MTD) · Total AUM · AUM Added (30d) · Avg AUM/User |
| 2 | **Review & Workflow** | New User Reviews Pending · Monthly Reviews Pending · New User Spillover · Monthly Spillover · Avg Review TAT |
| 3 | **Action Alerts** | Users Requiring Rebalance · Users with Pending Trades · Users with Action Alerts · Unsettled Cash |
| 4 | **Growth Charts** | 12-Month AUM Trend (Line) · User Growth (Bar) |
| 5 | **Risk Distribution** | Client Risk Mandate Donut Chart |

### Backend Architecture
- **Drizzle ORM Schema** — `users`, `user_reviews`, `portfolios`, `rebalance_actions`, `aum_snapshots`
- **REST API** — `GET /api/dashboard/kpis` · `GET /api/dashboard/review-queue` · `GET /api/dashboard/rebalance-alerts`

---

## 🔧 Changes

| Commit | Description |
|---|---|
| `4ecef73` | Implement 5-row PRD dashboard + remove deprecated churned user metrics |
| `b4ba371` | Restore original BSE Order File (3-tab UI) |
| `4d6819c` | Revert BSE restoration, keep newer version |

---

## 🗑️ Removed
- **Churned Users** data points stripped from schema, API, hooks, and UI across the entire stack.

---

## 📦 Active Files

| File | Purpose |
|---|---|
| `backend/src/database/schema.ts` | Drizzle ORM table definitions |
| `backend/src/routes/dashboard.routes.ts` | Dashboard API endpoints |
| `frontend/src/hooks/useDashboardKPIs.js` | React data-fetching hook |
| `frontend/src/views/admin/research-dashboard/components/ComplexMetricsCards.js` | Rows 1–3 metric cards |
| `frontend/src/views/admin/research-dashboard/components/DashboardCharts.js` | Rows 4–5 ApexCharts |
| `frontend/src/views/admin/research-dashboard/index.jsx` | Main dashboard page |
