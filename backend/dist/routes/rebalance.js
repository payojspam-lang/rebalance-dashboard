"use strict";
/**
 * rebalance.ts
 * Route definitions for the rebalance domain.
 *
 * POST /api/rebalance
 *   Accepts a portfolio of MF holdings + a target mandate and returns
 *   the full action plan (Buy/Sell/Hold/Trim) with tax and exit load estimates.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const rebalanceController_1 = require("../controllers/rebalanceController");
const router = (0, express_1.Router)();
// ---------------------------------------------------------------------------
// Zod validation schemas — match the Holding interface in models/types.ts
// ---------------------------------------------------------------------------
const HoldingSchema = zod_1.z.object({
    fund_name: zod_1.z.string().min(1, 'fund_name is required'),
    isin: zod_1.z
        .string()
        .regex(/^INF[A-Z0-9]{9}$/, 'ISIN must be a valid Indian mutual fund ISIN (e.g., INF879O01027)'),
    category: zod_1.z.string().min(1, 'category is required'),
    rating: zod_1.z.number().int().min(1).max(5, 'rating must be 1–5'),
    asset_class: zod_1.z.enum(['Equity', 'Debt', 'Hybrid', 'Fixed Income']),
    available_units: zod_1.z.number().nonnegative(),
    short_term_units: zod_1.z.number().nonnegative(),
    long_term_units: zod_1.z.number().nonnegative(),
    short_term_gains: zod_1.z.number(), // can be negative (unrealized loss)
    long_term_gains: zod_1.z.number(),
    tax_payable: zod_1.z.number().nonnegative(),
    exit_load_amount: zod_1.z.number().nonnegative(),
    units_under_exit_load: zod_1.z.number().nonnegative(),
    units_free_from_exit_load: zod_1.z.number().nonnegative(),
    current_value: zod_1.z.number().positive('current_value must be greater than 0'),
});
const FundCandidateSchema = zod_1.z.object({
    isin: zod_1.z.string(),
    fund_name: zod_1.z.string(),
    category: zod_1.z.string(),
    allocation_bucket: zod_1.z.enum([
        'large_cap', 'mid_cap', 'small_cap', 'gold',
        'debt', 'thematic', 'international', 'hybrid',
    ]),
    rating: zod_1.z.number().int().min(1).max(5),
    rank_in_category: zod_1.z.number().int().positive(),
});
const RebalanceRequestSchema = zod_1.z.object({
    user_account_id: zod_1.z.string().min(1, 'user_account_id is required'),
    mandate: zod_1.z.enum(['Conservative', 'Low', 'Moderate', 'High', 'Aggressive']),
    holdings: zod_1.z
        .array(HoldingSchema)
        .min(1, 'At least one holding is required')
        .max(200, 'Maximum 200 holdings per request'),
    fund_universe: zod_1.z.array(FundCandidateSchema).optional(),
});
// ---------------------------------------------------------------------------
// Validation middleware
// ---------------------------------------------------------------------------
function validateRebalanceRequest(req, res, next) {
    const result = RebalanceRequestSchema.safeParse(req.body);
    if (!result.success) {
        const err = result.error;
        res.status(422).json({
            error: 'VALIDATION_ERROR',
            message: 'Request body failed validation.',
            details: err.errors.map((e) => ({
                path: e.path.join('.'),
                message: e.message,
            })),
        });
        return;
    }
    req.body = result.data; // replace body with parsed + typed data
    next();
}
// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
/**
 * POST /api/rebalance
 *
 * Accepts a portfolio of MF holdings and a risk mandate, runs the rules engine,
 * and returns the full Final Action plan with allocation analysis.
 *
 * See apidoc.md and context.md Section 6 for the full contract.
 */
router.post('/', validateRebalanceRequest, rebalanceController_1.rebalance);
exports.default = router;
