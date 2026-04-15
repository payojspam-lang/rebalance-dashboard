"use strict";
/**
 * batchService.ts
 * Batch creation, CSV generation, and batch completion.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBatch = createBatch;
exports.getBatchById = getBatchById;
exports.generateBatchCsv = generateBatchCsv;
exports.completeBatch = completeBatch;
const recommendationsService_1 = require("./recommendationsService");
const auditService_1 = require("./auditService");
const sseService_1 = require("./sseService");
// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------
let batchCounter = 2; // start from 2 — batch-001 is in audit seed data
function nextBatchId() {
    return `batch-${String(batchCounter++).padStart(3, '0')}`;
}
const batches = [];
function createBatch(input) {
    const { recommendationIds, initiatedBy } = input;
    // Validate all recommendations exist and are APPROVED
    const invalid = [];
    const recs = [];
    for (const id of recommendationIds) {
        const rec = (0, recommendationsService_1.getRecommendationById)(id);
        if (!rec || rec.status !== 'APPROVED') {
            invalid.push(id);
        }
        else {
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
    (0, recommendationsService_1.bulkTransition)(recommendationIds, {
        action: 'START',
        performedBy: initiatedBy,
        comment: `Included in batch ${batchId}`,
    });
    const batch = {
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
    (0, auditService_1.addAuditLog)({
        action: 'BATCH_CREATED',
        resourceType: 'BATCH',
        resourceId: batchId,
        userId: initiatedBy.id,
        userName: initiatedBy.name,
        details: { itemCount: recs.length, recommendationIds },
    });
    (0, sseService_1.emitEvent)({
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
function getBatchById(id) {
    return batches.find((b) => b.id === id);
}
/**
 * Generate CSV rows for a batch.
 * Columns: Scheme Code, Folio Number, Transaction Type, Amount, Units, Remarks
 */
function generateBatchCsv(batch) {
    const headers = ['Scheme Code', 'Folio Number', 'Transaction Type', 'Amount', 'Units', 'Remarks'];
    const rows = [headers];
    for (const recId of batch.recommendationIds) {
        const rec = (0, recommendationsService_1.getRecommendationById)(recId);
        if (!rec)
            continue;
        let transactionType;
        let amount;
        let units;
        if (rec.recommendedAction === 'BUY') {
            transactionType = 'PURCHASE';
            amount = String(rec.amount);
            units = '';
        }
        else if (rec.recommendedAction === 'SELL') {
            transactionType = 'REDEMPTION';
            amount = '';
            units = String(rec.quantity);
        }
        else {
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
function completeBatch(id, input) {
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
    (0, recommendationsService_1.bulkTransition)(batch.recommendationIds, {
        action: 'COMPLETE',
        performedBy: input.completedBy,
        comment: input.notes,
    });
    batch.status = 'COMPLETED';
    batch.completedBy = input.completedBy.id;
    batch.completedByName = input.completedBy.name;
    batch.completedAt = now;
    batch.notes = input.notes;
    (0, auditService_1.addAuditLog)({
        action: 'BATCH_COMPLETED',
        resourceType: 'BATCH',
        resourceId: id,
        userId: input.completedBy.id,
        userName: input.completedBy.name,
        details: { notes: input.notes },
    });
    (0, sseService_1.emitEvent)({
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
