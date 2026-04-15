"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
// GET /api/dashboard/kpis
router.get("/kpis", (_req, res) => {
    res.json({
        user_metrics: {
            total_active_users: 1250,
            new_users_mtd: 47,
            new_users_ytd: 312,
            churned_users_mtd: 5,
            net_user_growth_mtd: 42,
            net_user_growth_pct: 3.47
        },
        review_metrics: {
            new_user_reviews_pending: 12,
            monthly_reviews_pending: 89,
            new_user_review_spillover: 3,
            monthly_review_spillover: 14,
            total_reviews_completed_mtd: 210,
            avg_review_turnaround_days: 2.4
        },
        aum_metrics: {
            total_aum: 84250000.00,
            aum_added_last_30_days: 4520000.00,
            aum_growth_pct_30d: 5.67,
            avg_aum_per_user: 67400.00,
            largest_portfolio_value: 8418709.22
        },
        action_metrics: {
            users_requiring_rebalance: 34,
            users_with_pending_trades: 18,
            users_with_action_alerts: 27,
            total_pending_sell_orders: 42,
            total_pending_buy_orders: 31,
            total_unsettled_cash: 2390866.54,
            portfolios_with_3star_funds: 156,
            portfolios_with_drift_above_5pct: 34
        },
        tax_and_cost_metrics: {
            total_estimated_tax_mtd: 435000.00,
            total_exit_loads_incurred_mtd: 12500.00,
            total_exit_loads_avoided_mtd: 87000.00,
            total_realized_gains_mtd: 1850000.00,
            tax_savings_from_hold_decisions: 64000.00
        },
        mandate_distribution: {
            conservative: 180,
            low: 250,
            moderate: 420,
            high: 280,
            aggressive: 120
        },
        trend_data: {
            aum_last_12_months: [
                { month: "2025-06", aum: 72000000 },
                { month: "2025-07", aum: 73500000 },
                { month: "2025-08", aum: 74200000 },
                { month: "2025-09", aum: 75800000 },
                { month: "2025-10", aum: 76100000 },
                { month: "2025-11", aum: 77500000 },
                { month: "2025-12", aum: 78900000 },
                { month: "2026-01", aum: 79400000 },
                { month: "2026-02", aum: 80200000 },
                { month: "2026-03", aum: 81500000 },
                { month: "2026-04", aum: 82800000 },
                { month: "2026-05", aum: 84250000 }
            ],
            user_growth_last_6_months: [
                { month: "2025-12", new: 38, churned: 4 },
                { month: "2026-01", new: 41, churned: 6 },
                { month: "2026-02", new: 55, churned: 3 },
                { month: "2026-03", new: 49, churned: 7 },
                { month: "2026-04", new: 52, churned: 5 },
                { month: "2026-05", new: 47, churned: 5 }
            ]
        }
    });
});
// GET /api/dashboard/review-queue
router.get("/review-queue", (_req, res) => {
    res.json({
        data: [
            { id: "rev-1", userId: "5201745730863104", type: "new_user_review", status: "spillover" },
            { id: "rev-2", userId: "6027827996524544", type: "monthly_review", status: "pending" }
        ],
        meta: { page: 1, total: 101 }
    });
});
// GET /api/dashboard/rebalance-alerts
router.get("/rebalance-alerts", (_req, res) => {
    res.json({
        data: [
            { id: "alert-1", userId: "4758446150778880", reason: "Drift > 5% (Equity Large)" },
            { id: "alert-2", userId: "5201745730863104", reason: "Holds 3★ fund > 5% cap" }
        ]
    });
});
exports.default = router;
