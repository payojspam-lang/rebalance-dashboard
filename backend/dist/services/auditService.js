"use strict";
/**
 * auditService.ts
 * In-memory audit log store.
 *
 * Bug 5 fix: Renamed `timestamp` → `createdAt` to match apidoc section 4.5.
 *            Added `ipAddress` field.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.addAuditLog = addAuditLog;
exports.listAuditLogs = listAuditLogs;
// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------
let nextId = 11;
function makeId() {
    return `alog-${String(nextId++).padStart(3, '0')}`;
}
const d = (offset) => {
    const dt = new Date();
    dt.setDate(dt.getDate() - offset);
    return dt.toISOString();
};
const auditLogs = [
    {
        id: 'alog-001',
        action: 'RECOMMENDATION_APPROVE',
        resourceType: 'RECOMMENDATION',
        resourceId: 'rec-003',
        userId: 'u-002',
        userName: 'Arjun Kapoor',
        details: { previousStatus: 'PENDING', newStatus: 'APPROVED' },
        ipAddress: '192.168.1.10',
        createdAt: d(5),
    },
    {
        id: 'alog-002',
        action: 'USER_LOGIN',
        resourceType: 'USER',
        resourceId: 'u-001',
        userId: 'u-001',
        userName: 'Priya Sharma',
        details: {},
        ipAddress: '192.168.1.11',
        createdAt: d(5),
    },
    {
        id: 'alog-003',
        action: 'USER_LOGIN',
        resourceType: 'USER',
        resourceId: 'u-002',
        userId: 'u-002',
        userName: 'Arjun Kapoor',
        details: {},
        ipAddress: '192.168.1.10',
        createdAt: d(4),
    },
    {
        id: 'alog-004',
        action: 'RECOMMENDATION_MODIFY',
        resourceType: 'RECOMMENDATION',
        resourceId: 'rec-001',
        userId: 'u-001',
        userName: 'Priya Sharma',
        details: { previousStatus: 'PENDING', newStatus: 'L2_PENDING', rationale: 'Reduce sell quantity' },
        ipAddress: '192.168.1.11',
        createdAt: d(4),
    },
    {
        id: 'alog-005',
        action: 'RECOMMENDATION_REJECT',
        resourceType: 'RECOMMENDATION',
        resourceId: 'rec-001',
        userId: 'u-002',
        userName: 'Arjun Kapoor',
        details: { previousStatus: 'L2_PENDING', newStatus: 'REJECTED', reason: 'Client objected' },
        ipAddress: '192.168.1.10',
        createdAt: d(3),
    },
    {
        id: 'alog-006',
        action: 'RECOMMENDATION_RESET',
        resourceType: 'RECOMMENDATION',
        resourceId: 'rec-001',
        userId: 'u-001',
        userName: 'Priya Sharma',
        details: { previousStatus: 'REJECTED', newStatus: 'PENDING' },
        ipAddress: '192.168.1.11',
        createdAt: d(3),
    },
    {
        id: 'alog-007',
        action: 'RECOMMENDATION_APPROVE',
        resourceType: 'RECOMMENDATION',
        resourceId: 'rec-004',
        userId: 'u-001',
        userName: 'Priya Sharma',
        details: { previousStatus: 'PENDING', newStatus: 'APPROVED' },
        ipAddress: '192.168.1.11',
        createdAt: d(2),
    },
    {
        id: 'alog-008',
        action: 'BATCH_CREATED',
        resourceType: 'BATCH',
        resourceId: 'batch-001',
        userId: 'u-003',
        userName: 'Rahul Verma',
        details: { itemCount: 2, recommendationIds: ['rec-003', 'rec-004'] },
        ipAddress: '192.168.1.12',
        createdAt: d(2),
    },
    {
        id: 'alog-009',
        action: 'BATCH_COMPLETED',
        resourceType: 'BATCH',
        resourceId: 'batch-001',
        userId: 'u-003',
        userName: 'Rahul Verma',
        details: { notes: 'All BSE orders submitted successfully.' },
        ipAddress: '192.168.1.12',
        createdAt: d(1),
    },
    {
        id: 'alog-010',
        action: 'USER_LOGIN',
        resourceType: 'USER',
        resourceId: 'u-003',
        userId: 'u-003',
        userName: 'Rahul Verma',
        details: {},
        ipAddress: '192.168.1.12',
        createdAt: d(1),
    },
];
// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
function addAuditLog(entry) {
    const log = {
        ...entry,
        id: makeId(),
        createdAt: new Date().toISOString(),
    };
    auditLogs.push(log);
    return log;
}
function listAuditLogs(filters) {
    const { resourceType, resourceId, userId, startDate, endDate, page = 1, pageSize = 50, } = filters;
    let results = [...auditLogs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (resourceType)
        results = results.filter((l) => l.resourceType === resourceType);
    if (resourceId)
        results = results.filter((l) => l.resourceId === resourceId);
    if (userId)
        results = results.filter((l) => l.userId === userId);
    if (startDate) {
        const start = new Date(startDate).getTime();
        results = results.filter((l) => new Date(l.createdAt).getTime() >= start);
    }
    if (endDate) {
        const end = new Date(endDate).getTime();
        results = results.filter((l) => new Date(l.createdAt).getTime() <= end);
    }
    const totalCount = results.length;
    const totalPages = Math.ceil(totalCount / pageSize) || 1;
    const offset = (page - 1) * pageSize;
    const data = results.slice(offset, offset + pageSize);
    return { data, meta: { page, pageSize, totalCount, totalPages } };
}
