"use strict";
/**
 * recommendationsService.ts
 * In-memory store for recommendations and state-machine transitions.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.listRecommendations = listRecommendations;
exports.getRecommendationById = getRecommendationById;
exports.transitionRecommendation = transitionRecommendation;
exports.bulkTransition = bulkTransition;
const sseService_1 = require("./sseService");
const auditService_1 = require("./auditService");
const TRANSITION_RULES = {
    APPROVE: {
        from: ['PENDING', 'L2_PENDING'],
        to: 'APPROVED',
        allowedRoles: ['L1', 'L2', 'ADMIN'],
    },
    MODIFY: {
        from: ['PENDING'],
        to: 'L2_PENDING',
        allowedRoles: ['L1', 'ADMIN'],
        requiresModifications: true,
        requiresRationale: true,
    },
    REJECT: {
        from: ['L2_PENDING'],
        to: 'REJECTED',
        allowedRoles: ['L2', 'ADMIN'],
        requiresReason: true,
    },
    RESET: {
        from: ['REJECTED'],
        to: 'PENDING',
        allowedRoles: ['L1', 'ADMIN'],
    },
    START: {
        from: ['APPROVED'],
        to: 'IN_PROGRESS',
        allowedRoles: ['OPS', 'ADMIN'],
    },
    COMPLETE: {
        from: ['IN_PROGRESS'],
        to: 'COMPLETED',
        allowedRoles: ['OPS', 'ADMIN'],
    },
};
// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------
const NOW = new Date().toISOString();
const seedRecommendations = [
    {
        id: 'rec-001',
        portfolioId: 'port-001',
        portfolioName: 'Rahul Mehta',
        assetName: 'Franklin India ELSS Tax Saver Fund',
        schemeCode: '125494',
        folioNumber: 'F-10023456',
        isin: 'INF090I01JS8',
        currentWeight: 12.5,
        targetWeight: 0,
        recommendedAction: 'SELL',
        quantity: 1250.0,
        amount: 487500,
        status: 'PENDING',
        mlModelVersion: 'v2.3.1',
        modification: null,
        createdAt: NOW,
        updatedAt: NOW,
        auditTrail: [],
    },
    {
        id: 'rec-002',
        portfolioId: 'port-001',
        portfolioName: 'Rahul Mehta',
        assetName: 'BANDHAN Flexi Cap Fund',
        schemeCode: '152931',
        folioNumber: 'F-10023457',
        isin: 'INF194K01W62',
        currentWeight: 9.2,
        targetWeight: 0,
        recommendedAction: 'SELL',
        quantity: 3120.0,
        amount: 358272,
        status: 'PENDING',
        mlModelVersion: 'v2.3.1',
        modification: null,
        createdAt: NOW,
        updatedAt: NOW,
        auditTrail: [],
    },
    {
        id: 'rec-003',
        portfolioId: 'port-001',
        portfolioName: 'Rahul Mehta',
        assetName: 'HDFC Mid Cap Opportunities Fund',
        schemeCode: '118989',
        folioNumber: 'F-10023458',
        isin: 'INF179K01XQ0',
        currentWeight: 18.4,
        targetWeight: 18.4,
        recommendedAction: 'HOLD',
        quantity: 0,
        amount: 0,
        status: 'APPROVED',
        mlModelVersion: 'v2.3.1',
        modification: null,
        createdAt: NOW,
        updatedAt: NOW,
        auditTrail: [
            {
                timestamp: NOW,
                action: 'APPROVE',
                previousStatus: 'PENDING',
                newStatus: 'APPROVED',
                performedBy: 'u-002',
                performedByName: 'Arjun Kapoor',
                comment: 'Hold confirmed, no action needed.',
            },
        ],
    },
    {
        id: 'rec-004',
        portfolioId: 'port-002',
        portfolioName: 'Surbhi Jain',
        assetName: 'Nippon India Large Cap Fund',
        schemeCode: '118825',
        folioNumber: 'F-20011234',
        isin: 'INF204K01D30',
        currentWeight: 5.1,
        targetWeight: 15.0,
        recommendedAction: 'BUY',
        quantity: 0,
        amount: 511800,
        status: 'PENDING',
        mlModelVersion: 'v2.3.1',
        modification: null,
        createdAt: NOW,
        updatedAt: NOW,
        auditTrail: [],
    },
    {
        id: 'rec-005',
        portfolioId: 'port-002',
        portfolioName: 'Surbhi Jain',
        assetName: 'BANDHAN Small Cap Fund',
        schemeCode: '153019',
        folioNumber: 'F-20011235',
        isin: 'INF194KB1AL4',
        currentWeight: 2.3,
        targetWeight: 8.0,
        recommendedAction: 'BUY',
        quantity: 0,
        amount: 295100,
        status: 'PENDING',
        mlModelVersion: 'v2.3.1',
        modification: null,
        createdAt: NOW,
        updatedAt: NOW,
        auditTrail: [],
    },
];
const recommendations = [...seedRecommendations];
function listRecommendations(filters) {
    const { status, portfolioId, action, page = 1, pageSize = 50 } = filters;
    let results = recommendations.filter((r) => {
        if (status && r.status !== status)
            return false;
        if (portfolioId && r.portfolioId !== portfolioId)
            return false;
        if (action && r.recommendedAction !== action)
            return false;
        return true;
    });
    const totalCount = results.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const offset = (page - 1) * pageSize;
    results = results.slice(offset, offset + pageSize);
    // Omit auditTrail from list responses
    const data = results.map(({ auditTrail: _at, ...rest }) => rest);
    return { data, meta: { page, pageSize, totalCount, totalPages } };
}
function getRecommendationById(id) {
    return recommendations.find((r) => r.id === id);
}
function transitionRecommendation(id, input) {
    const rec = recommendations.find((r) => r.id === id);
    if (!rec) {
        const err = new Error(`Recommendation ${id} not found`);
        err.code = 'NOT_FOUND';
        throw err;
    }
    const rule = TRANSITION_RULES[input.action];
    if (!rule) {
        const err = new Error(`Unknown action: ${input.action}`);
        err.code = 'INVALID_ACTION';
        throw err;
    }
    // Role check
    if (!rule.allowedRoles.includes(input.performedBy.role)) {
        const err = new Error(`Role ${input.performedBy.role} cannot perform action ${input.action}`);
        err.code = 'FORBIDDEN';
        throw err;
    }
    // State check
    if (!rule.from.includes(rec.status)) {
        const err = new Error(`Cannot perform ${input.action} on recommendation in status ${rec.status}. ` +
            `Expected: ${rule.from.join(' or ')}`);
        err.code = 'INVALID_TRANSITION';
        throw err;
    }
    // Field requirement checks
    if (rule.requiresModifications && (!input.modifications || input.modifications.length === 0)) {
        const err = new Error('modifications is required for MODIFY action');
        err.code = 'VALIDATION_ERROR';
        throw err;
    }
    if (rule.requiresRationale && !input.rationale) {
        const err = new Error('rationale is required for MODIFY action');
        err.code = 'VALIDATION_ERROR';
        throw err;
    }
    if (rule.requiresComment && !input.comment) {
        const err = new Error('comment is required when approving from L2_PENDING');
        err.code = 'VALIDATION_ERROR';
        throw err;
    }
    if (rule.requiresReason && !input.reason) {
        const err = new Error('reason is required for REJECT action');
        err.code = 'VALIDATION_ERROR';
        throw err;
    }
    const previousStatus = rec.status;
    const newStatus = rule.to;
    const now = new Date().toISOString();
    // Apply modifications
    if (input.action === 'MODIFY' && input.modifications) {
        rec.modification = input.modifications;
    }
    // Update status
    rec.status = newStatus;
    rec.updatedAt = now;
    // Append audit trail
    const auditEntry = {
        timestamp: now,
        action: input.action,
        previousStatus,
        newStatus,
        performedBy: input.performedBy.id,
        performedByName: input.performedBy.name,
        ...(input.comment !== undefined ? { comment: input.comment } : {}),
        ...(input.reason !== undefined ? { reason: input.reason } : {}),
        ...(input.modifications !== undefined ? { modifications: input.modifications } : {}),
    };
    rec.auditTrail.push(auditEntry);
    // Audit log
    (0, auditService_1.addAuditLog)({
        action: `RECOMMENDATION_${input.action}`,
        resourceType: 'RECOMMENDATION',
        resourceId: id,
        userId: input.performedBy.id,
        userName: input.performedBy.name,
        details: { previousStatus, newStatus },
    });
    // SSE broadcast
    (0, sseService_1.emitEvent)({
        type: 'RECOMMENDATION_STATUS_CHANGED',
        payload: {
            id,
            previousStatus,
            newStatus,
            transitionedBy: input.performedBy.id,
            transitionedAt: now,
        },
    });
    return {
        id,
        previousStatus,
        newStatus,
        transitionedBy: input.performedBy.id,
        transitionedAt: now,
    };
}
/**
 * Bulk transition — used by batch service to move APPROVED → IN_PROGRESS.
 */
function bulkTransition(ids, input) {
    return ids.map((id) => transitionRecommendation(id, { ...input }));
}
