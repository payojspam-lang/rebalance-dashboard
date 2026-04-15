"use strict";
/**
 * auditLogs.ts (route)
 * GET /api/audit-logs
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auditService_1 = require("../services/auditService");
const router = (0, express_1.Router)();
/**
 * GET /api/audit-logs
 * Returns paginated audit log entries with optional filters.
 */
router.get('/', (req, res) => {
    const page = Number(req.query['page'] ?? 1);
    const pageSize = Number(req.query['pageSize'] ?? 50);
    const resourceType = req.query['resourceType'];
    const resourceId = req.query['resourceId'];
    const userId = req.query['userId'];
    const startDate = req.query['startDate'];
    const endDate = req.query['endDate'];
    const result = (0, auditService_1.listAuditLogs)({
        resourceType,
        resourceId,
        userId,
        startDate,
        endDate,
        page,
        pageSize,
    });
    res.status(200).json(result);
});
exports.default = router;
