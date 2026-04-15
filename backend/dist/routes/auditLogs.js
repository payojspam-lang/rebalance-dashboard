"use strict";
/**
 * auditLogs.ts (route)
 * GET /api/audit-logs
 *
 * Bug 6 fix: ADMIN-only authorization guard per apidoc section 4.5.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const auditService_1 = require("../services/auditService");
const router = (0, express_1.Router)();
// Bug 6 fix: restrict to ADMIN role only
router.get('/', (0, auth_1.authorize)(['ADMIN']), (req, res) => {
    const page = Number(req.query['page'] ?? 1);
    const pageSize = Number(req.query['pageSize'] ?? 50);
    const resourceType = req.query['resourceType'];
    const resourceId = req.query['resourceId'];
    const userId = req.query['userId'];
    const startDate = req.query['startDate'];
    const endDate = req.query['endDate'];
    const result = (0, auditService_1.listAuditLogs)({
        resourceType, resourceId, userId, startDate, endDate, page, pageSize,
    });
    res.status(200).json(result);
});
exports.default = router;
