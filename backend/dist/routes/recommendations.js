"use strict";
/**
 * recommendations.ts (route)
 * GET  /api/recommendations
 * GET  /api/recommendations/:id
 * POST /api/recommendations/:id/transition
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const recommendationsService_1 = require("../services/recommendationsService");
const router = (0, express_1.Router)();
// ---------------------------------------------------------------------------
// GET /api/recommendations
// ---------------------------------------------------------------------------
router.get('/', (req, res) => {
    const page = Number(req.query['page'] ?? 1);
    const pageSize = Number(req.query['pageSize'] ?? 50);
    const status = req.query['status'];
    const portfolioId = req.query['portfolioId'];
    const action = req.query['action'];
    const result = (0, recommendationsService_1.listRecommendations)({ status, portfolioId, action, page, pageSize });
    res.status(200).json(result);
});
// ---------------------------------------------------------------------------
// GET /api/recommendations/:id
// ---------------------------------------------------------------------------
router.get('/:id', (req, res) => {
    const rec = (0, recommendationsService_1.getRecommendationById)(req.params['id'] ?? '');
    if (!rec) {
        res.status(404).json({
            error: 'NOT_FOUND',
            message: `Recommendation ${req.params['id']} not found.`,
        });
        return;
    }
    res.status(200).json({ data: rec });
});
// ---------------------------------------------------------------------------
// POST /api/recommendations/:id/transition
// ---------------------------------------------------------------------------
// Bug 7 fix: `modifications` is a plain object per apidoc, not an array.
// Schema matches: { newAction?: string, newQuantity?: number }
const ModificationsSchema = zod_1.z.object({
    newAction: zod_1.z.enum(['BUY', 'SELL', 'HOLD', 'TRIM']).optional(),
    newQuantity: zod_1.z.number().nonnegative().optional(),
}).optional();
const TransitionSchema = zod_1.z.object({
    action: zod_1.z.enum(['APPROVE', 'MODIFY', 'REJECT', 'RESET', 'START', 'COMPLETE']),
    modifications: ModificationsSchema,
    rationale: zod_1.z.string().optional(),
    comment: zod_1.z.string().optional(),
    reason: zod_1.z.string().optional(),
});
router.post('/:id/transition', (req, res) => {
    const result = TransitionSchema.safeParse(req.body);
    if (!result.success) {
        const err = result.error;
        res.status(422).json({
            error: 'VALIDATION_ERROR',
            message: 'Request validation failed.',
            details: err.errors.map((e) => ({ path: e.path.join('.'), message: e.message })),
        });
        return;
    }
    const performedBy = req.user;
    const id = req.params['id'] ?? '';
    // Normalise modifications to the shape the service expects
    const mods = result.data.modifications
        ? [
            ...(result.data.modifications.newAction
                ? [{ field: 'action', oldValue: undefined, newValue: result.data.modifications.newAction }]
                : []),
            ...(result.data.modifications.newQuantity !== undefined
                ? [{ field: 'quantity', oldValue: undefined, newValue: result.data.modifications.newQuantity }]
                : []),
        ]
        : undefined;
    try {
        const transitionResult = (0, recommendationsService_1.transitionRecommendation)(id, {
            action: result.data.action,
            modifications: mods,
            rationale: result.data.rationale,
            comment: result.data.comment,
            reason: result.data.reason,
            performedBy,
        });
        res.status(200).json({ data: transitionResult });
    }
    catch (err) {
        const e = err;
        if (e.code === 'NOT_FOUND') {
            res.status(404).json({ error: 'NOT_FOUND', message: e.message });
        }
        else if (e.code === 'FORBIDDEN') {
            res.status(403).json({ error: 'FORBIDDEN', message: e.message });
        }
        else if (e.code === 'INVALID_TRANSITION' || e.code === 'INVALID_ACTION') {
            res.status(409).json({ error: 'INVALID_TRANSITION', message: e.message });
        }
        else if (e.code === 'VALIDATION_ERROR') {
            res.status(422).json({ error: 'VALIDATION_ERROR', message: e.message });
        }
        else {
            res.status(500).json({ error: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' });
        }
    }
});
exports.default = router;
