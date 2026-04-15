/**
 * auditLogs.ts (route)
 * GET /api/audit-logs
 *
 * Bug 6 fix: ADMIN-only authorization guard per apidoc section 4.5.
 */

import { Router } from 'express';
import { authorize } from '../middleware/auth';
import { listAuditLogs } from '../services/auditService';

const router = Router();

// Bug 6 fix: restrict to ADMIN role only
router.get('/', authorize(['ADMIN']), (req, res) => {
  const page        = Number(req.query['page']     ?? 1);
  const pageSize    = Number(req.query['pageSize'] ?? 50);
  const resourceType = req.query['resourceType'] as string | undefined;
  const resourceId   = req.query['resourceId']   as string | undefined;
  const userId       = req.query['userId']        as string | undefined;
  const startDate    = req.query['startDate']     as string | undefined;
  const endDate      = req.query['endDate']       as string | undefined;

  const result = listAuditLogs({
    resourceType, resourceId, userId, startDate, endDate, page, pageSize,
  });

  res.status(200).json(result);
});

export default router;
