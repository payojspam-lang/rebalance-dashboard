/**
 * batchService.ts
 * Batch creation, CSV generation, and batch completion.
 */

import { getRecommendationById, bulkTransition, Recommendation } from './recommendationsService';
import { addAuditLog } from './auditService';
import { emitEvent } from './sseService';
import type { PublicUser } from './authService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BatchStatus = 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export interface Batch {
  id: string;
  status: BatchStatus;
  recommendationIds: string[];
  itemCount: number;
  csvDownloadUrl: string;
  initiatedBy: string;
  initiatedByName: string;
  initiatedAt: string;
  completedBy?: string;
  completedByName?: string;
  completedAt?: string;
  notes?: string;
}

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

let batchCounter = 2; // start from 2 — batch-001 is in audit seed data

function nextBatchId(): string {
  return `batch-${String(batchCounter++).padStart(3, '0')}`;
}

const batches: Batch[] = [];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface CreateBatchInput {
  recommendationIds: string[];
  initiatedBy: PublicUser;
}

export interface CreateBatchError {
  code: string;
  message: string;
  invalidIds?: string[];
}

export function createBatch(
  input: CreateBatchInput,
): { batch: Batch } | { error: CreateBatchError } {
  const { recommendationIds, initiatedBy } = input;

  // Validate all recommendations exist and are APPROVED
  const invalid: string[] = [];
  const recs: Recommendation[] = [];

  for (const id of recommendationIds) {
    const rec = getRecommendationById(id);
    if (!rec || rec.status !== 'APPROVED') {
      invalid.push(id);
    } else {
      recs.push(rec);
    }
  }

  if (invalid.length > 0) {
    return {
      error: {
        code: 'UNPROCESSABLE_ENTITY',
        message: 'All recommendations must exist and have status APPROVED.',
        invalidIds: invalid,
      },
    };
  }

  const batchId = nextBatchId();
  const now = new Date().toISOString();

  // Transition recommendations to IN_PROGRESS
  bulkTransition(recommendationIds, {
    action: 'START',
    performedBy: initiatedBy,
    comment: `Included in batch ${batchId}`,
  });

  const batch: Batch = {
    id: batchId,
    status: 'IN_PROGRESS',
    recommendationIds,
    itemCount: recs.length,
    csvDownloadUrl: `/api/batches/${batchId}/csv`,
    initiatedBy: initiatedBy.id,
    initiatedByName: initiatedBy.name,
    initiatedAt: now,
  };

  batches.push(batch);

  addAuditLog({
    action: 'BATCH_CREATED',
    resourceType: 'BATCH',
    resourceId: batchId,
    userId: initiatedBy.id,
    userName: initiatedBy.name,
    details: { itemCount: recs.length, recommendationIds },
  });

  emitEvent({
    type: 'BATCH_CREATED',
    payload: {
      id: batchId,
      status: 'IN_PROGRESS',
      itemCount: recs.length,
      initiatedBy: initiatedBy.id,
      initiatedAt: now,
    },
  });

  return { batch };
}

export function getBatchById(id: string): Batch | undefined {
  return batches.find((b) => b.id === id);
}

/**
 * Generate CSV rows for a batch.
 * Columns: Scheme Code, Folio Number, Transaction Type, Amount, Units, Remarks
 */
export function generateBatchCsv(batch: Batch): string {
  const headers = ['Scheme Code', 'Folio Number', 'Transaction Type', 'Amount', 'Units', 'Remarks'];
  const rows: string[][] = [headers];

  for (const recId of batch.recommendationIds) {
    const rec = getRecommendationById(recId);
    if (!rec) continue;

    let transactionType: string;
    let amount: string;
    let units: string;

    if (rec.recommendedAction === 'BUY') {
      transactionType = 'PURCHASE';
      amount = String(rec.amount);
      units = '';
    } else if (rec.recommendedAction === 'SELL') {
      transactionType = 'REDEMPTION';
      amount = '';
      units = String(rec.quantity);
    } else {
      // HOLD — skip
      continue;
    }

    rows.push([
      rec.schemeCode,
      rec.folioNumber,
      transactionType,
      amount,
      units,
      `Rebalance ${batch.id}`,
    ]);
  }

  return rows.map((r) => r.join(',')).join('\n');
}

export interface CompleteBatchInput {
  notes: string;
  completedBy: PublicUser;
}

export interface CompleteBatchError {
  code: string;
  message: string;
}

export function completeBatch(
  id: string,
  input: CompleteBatchInput,
): { batch: Batch } | { error: CompleteBatchError } {
  const batch = getBatchById(id);
  if (!batch) {
    return { error: { code: 'NOT_FOUND', message: `Batch ${id} not found.` } };
  }
  if (batch.status !== 'IN_PROGRESS') {
    return {
      error: {
        code: 'INVALID_STATE',
        message: `Batch is already ${batch.status}.`,
      },
    };
  }

  const now = new Date().toISOString();

  // Transition all recommendations to COMPLETED
  bulkTransition(batch.recommendationIds, {
    action: 'COMPLETE',
    performedBy: input.completedBy,
    comment: input.notes,
  });

  batch.status = 'COMPLETED';
  batch.completedBy = input.completedBy.id;
  batch.completedByName = input.completedBy.name;
  batch.completedAt = now;
  batch.notes = input.notes;

  addAuditLog({
    action: 'BATCH_COMPLETED',
    resourceType: 'BATCH',
    resourceId: id,
    userId: input.completedBy.id,
    userName: input.completedBy.name,
    details: { notes: input.notes },
  });

  emitEvent({
    type: 'BATCH_COMPLETED',
    payload: {
      id,
      status: 'COMPLETED',
      completedBy: input.completedBy.id,
      completedAt: now,
    },
  });

  return { batch };
}
