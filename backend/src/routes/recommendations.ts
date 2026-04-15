/**
 * recommendations.ts (route)
 * GET  /api/recommendations
 * GET  /api/recommendations/:id
 * POST /api/recommendations/:id/transition
 */

import { Router } from 'express';
import { z, ZodError } from 'zod';
import {
  listRecommendations,
  getRecommendationById,
  transitionRecommendation,
} from '../services/recommendationsService';
import type {
  RecommendationStatus,
  RecommendedAction,
  TransitionAction,
} from '../services/recommendationsService';
import type { PublicUser } from '../services/authService';

const router = Router();

// ---------------------------------------------------------------------------
// GET /api/recommendations
// ---------------------------------------------------------------------------

router.get('/', (req, res) => {
  const page = Number(req.query['page'] ?? 1);
  const pageSize = Number(req.query['pageSize'] ?? 50);
  const status = req.query['status'] as RecommendationStatus | undefined;
  const portfolioId = req.query['portfolioId'] as string | undefined;
  const action = req.query['action'] as RecommendedAction | undefined;

  const result = listRecommendations({ status, portfolioId, action, page, pageSize });
  res.status(200).json(result);
});

// ---------------------------------------------------------------------------
// GET /api/recommendations/:id
// ---------------------------------------------------------------------------

router.get('/:id', (req, res) => {
  const rec = getRecommendationById(req.params['id'] ?? '');
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

const ModificationSchema = z.object({
  field: z.string(),
  oldValue: z.unknown(),
  newValue: z.unknown(),
});

const TransitionSchema = z.object({
  action: z.enum(['APPROVE', 'MODIFY', 'REJECT', 'RESET', 'START', 'COMPLETE']),
  modifications: z.array(ModificationSchema).optional(),
  rationale: z.string().optional(),
  comment: z.string().optional(),
  reason: z.string().optional(),
});

router.post('/:id/transition', (req, res) => {
  const result = TransitionSchema.safeParse(req.body);
  if (!result.success) {
    const err = result.error as ZodError;
    res.status(422).json({
      error: 'VALIDATION_ERROR',
      message: 'Request validation failed.',
      details: err.errors.map((e) => ({ path: e.path.join('.'), message: e.message })),
    });
    return;
  }

  const performedBy = req.user as PublicUser;
  const id = req.params['id'] ?? '';

  try {
    const transitionResult = transitionRecommendation(id, {
      action: result.data.action as TransitionAction,
      modifications: result.data.modifications as Array<{ field: string; oldValue: unknown; newValue: unknown }> | undefined,
      rationale: result.data.rationale,
      comment: result.data.comment,
      reason: result.data.reason,
      performedBy,
    });

    res.status(200).json({ data: transitionResult });
  } catch (err) {
    const e = err as NodeJS.ErrnoException;
    if (e.code === 'NOT_FOUND') {
      res.status(404).json({ error: 'NOT_FOUND', message: e.message });
    } else if (e.code === 'FORBIDDEN') {
      res.status(403).json({ error: 'FORBIDDEN', message: e.message });
    } else if (e.code === 'INVALID_TRANSITION' || e.code === 'INVALID_ACTION') {
      res.status(409).json({ error: 'INVALID_TRANSITION', message: e.message });
    } else if (e.code === 'VALIDATION_ERROR') {
      res.status(422).json({ error: 'VALIDATION_ERROR', message: e.message });
    } else {
      res.status(500).json({ error: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' });
    }
  }
});

export default router;
