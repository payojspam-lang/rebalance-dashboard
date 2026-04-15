"use strict";
/**
 * portfolios.ts (route)
 * GET /api/portfolios
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const portfoliosService_1 = require("../services/portfoliosService");
const router = (0, express_1.Router)();
/**
 * GET /api/portfolios
 * Returns paginated list of portfolios.
 */
router.get('/', (req, res) => {
    const page = Number(req.query['page'] ?? 1);
    const pageSize = Number(req.query['pageSize'] ?? 50);
    if (isNaN(page) || page < 1 || isNaN(pageSize) || pageSize < 1) {
        res.status(422).json({
            error: 'VALIDATION_ERROR',
            message: 'page and pageSize must be positive integers.',
        });
        return;
    }
    const result = (0, portfoliosService_1.listPortfolios)({ page, pageSize });
    res.status(200).json(result);
});
exports.default = router;
