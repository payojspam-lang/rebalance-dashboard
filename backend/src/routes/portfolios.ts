/**
 * portfolios.ts (route)
 * GET /api/portfolios
 */

import { Router } from 'express';
import { listPortfolios } from '../services/portfoliosService';

const router = Router();

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

  const result = listPortfolios({ page, pageSize });
  res.status(200).json(result);
});

export default router;
