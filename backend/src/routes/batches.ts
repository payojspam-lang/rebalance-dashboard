/**
 * batches.ts (route)
 * POST /api/batches
 * GET  /api/batches/:id/csv
 * POST /api/batches/:id/complete
 */

import { Router } from 'express';
import { z, ZodError } from 'zod';
import {
  createBatch,
  getBatchById,
  generateBatchCsv,
  completeBatch,
} from '../services/batchService';
import type { PublicUser } from '../services/authService';

const router = Router();

// ---------------------------------------------------------------------------
// POST /api/batches
// ---------------------------------------------------------------------------

const CreateBatchSchema = z.object({
  recommendationIds: z
    .array(z.string().min(1))
    .min(1, 'At least one recommendationId is required'),
});

router.post('/', (req, res) => {
  const result = CreateBatchSchema.safeParse(req.body);
  if (!result.success) {
    const err = result.error as ZodError;
    res.status(422).json({
      error: 'VALIDATION_ERROR',
      message: 'Request validation failed.',
      details: err.errors.map((e) => ({ path: e.path.join('.'), message: e.message })),
    });
    return;
  }

  const initiatedBy = req.user as PublicUser;
  const batchResult = createBatch({
    recommendationIds: result.data.recommendationIds,
    initiatedBy,
  });

  if ('error' in batchResult) {
    res.status(422).json({
      error: batchResult.error.code,
      message: batchResult.error.message,
      ...(batchResult.error.invalidIds ? { details: { invalidIds: batchResult.error.invalidIds } } : {}),
    });
    return;
  }

  const { batch } = batchResult;
  res.status(201).json({
    data: {
      id: batch.id,
      status: batch.status,
      itemCount: batch.itemCount,
      csvDownloadUrl: batch.csvDownloadUrl,
      initiatedBy: batch.initiatedBy,
      initiatedAt: batch.initiatedAt,
    },
  });
});

// ---------------------------------------------------------------------------
// GET /api/batches/:id/csv
// ---------------------------------------------------------------------------

router.get('/:id/csv', (req, res) => {
  const batch = getBatchById(req.params['id'] ?? '');
  if (!batch) {
    res.status(404).json({
      error: 'NOT_FOUND',
      message: `Batch ${req.params['id']} not found.`,
    });
    return;
  }

  const csv = generateBatchCsv(batch);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="batch-${batch.id}.csv"`,
  );
  res.status(200).send(csv);
});

// ---------------------------------------------------------------------------
// POST /api/batches/:id/complete
// ---------------------------------------------------------------------------

const CompleteBatchSchema = z.object({
  notes: z.string().min(1, 'notes is required'),
});

router.post('/:id/complete', (req, res) => {
  const result = CompleteBatchSchema.safeParse(req.body);
  if (!result.success) {
    const err = result.error as ZodError;
    res.status(422).json({
      error: 'VALIDATION_ERROR',
      message: 'Request validation failed.',
      details: err.errors.map((e) => ({ path: e.path.join('.'), message: e.message })),
    });
    return;
  }

  const completedBy = req.user as PublicUser;
  const completeResult = completeBatch(req.params['id'] ?? '', {
    notes: result.data.notes,
    completedBy,
  });

  if ('error' in completeResult) {
    const status = completeResult.error.code === 'NOT_FOUND' ? 404 : 409;
    res.status(status).json({
      error: completeResult.error.code,
      message: completeResult.error.message,
    });
    return;
  }

  const { batch } = completeResult;
  res.status(200).json({
    data: {
      id: batch.id,
      status: batch.status,
      completedBy: batch.completedBy,
      completedAt: batch.completedAt,
    },
  });
});

export default router;
