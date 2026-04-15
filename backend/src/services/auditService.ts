/**
 * auditService.ts
 * In-memory audit log store.
 *
 * Seeded with 10 initial entries reflecting the rec-003 approval in the
 * recommendations seed data, plus additional historical transitions.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AuditLogEntry {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string;
  userId: string;
  userName: string;
  details: Record<string, unknown>;
  timestamp: string;
}

export interface AuditLogFilters {
  resourceType?: string;
  resourceId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

let nextId = 11;

function makeId(): string {
  return `alog-${String(nextId++).padStart(3, '0')}`;
}

const d = (offset: number): string => {
  const dt = new Date();
  dt.setDate(dt.getDate() - offset);
  return dt.toISOString();
};

const auditLogs: AuditLogEntry[] = [
  {
    id: 'alog-001',
    action: 'RECOMMENDATION_APPROVE',
    resourceType: 'RECOMMENDATION',
    resourceId: 'rec-003',
    userId: 'u-002',
    userName: 'Arjun Kapoor',
    details: { previousStatus: 'PENDING', newStatus: 'APPROVED' },
    timestamp: d(5),
  },
  {
    id: 'alog-002',
    action: 'USER_LOGIN',
    resourceType: 'USER',
    resourceId: 'u-001',
    userId: 'u-001',
    userName: 'Priya Sharma',
    details: { ip: '127.0.0.1' },
    timestamp: d(5),
  },
  {
    id: 'alog-003',
    action: 'USER_LOGIN',
    resourceType: 'USER',
    resourceId: 'u-002',
    userId: 'u-002',
    userName: 'Arjun Kapoor',
    details: { ip: '127.0.0.1' },
    timestamp: d(4),
  },
  {
    id: 'alog-004',
    action: 'RECOMMENDATION_MODIFY',
    resourceType: 'RECOMMENDATION',
    resourceId: 'rec-001',
    userId: 'u-001',
    userName: 'Priya Sharma',
    details: { previousStatus: 'PENDING', newStatus: 'L2_PENDING', rationale: 'Reduce sell quantity' },
    timestamp: d(4),
  },
  {
    id: 'alog-005',
    action: 'RECOMMENDATION_REJECT',
    resourceType: 'RECOMMENDATION',
    resourceId: 'rec-001',
    userId: 'u-002',
    userName: 'Arjun Kapoor',
    details: { previousStatus: 'L2_PENDING', newStatus: 'REJECTED', reason: 'Client objected' },
    timestamp: d(3),
  },
  {
    id: 'alog-006',
    action: 'RECOMMENDATION_RESET',
    resourceType: 'RECOMMENDATION',
    resourceId: 'rec-001',
    userId: 'u-001',
    userName: 'Priya Sharma',
    details: { previousStatus: 'REJECTED', newStatus: 'PENDING' },
    timestamp: d(3),
  },
  {
    id: 'alog-007',
    action: 'RECOMMENDATION_APPROVE',
    resourceType: 'RECOMMENDATION',
    resourceId: 'rec-004',
    userId: 'u-001',
    userName: 'Priya Sharma',
    details: { previousStatus: 'PENDING', newStatus: 'APPROVED' },
    timestamp: d(2),
  },
  {
    id: 'alog-008',
    action: 'BATCH_CREATED',
    resourceType: 'BATCH',
    resourceId: 'batch-001',
    userId: 'u-003',
    userName: 'Rahul Verma',
    details: { itemCount: 2, recommendationIds: ['rec-003', 'rec-004'] },
    timestamp: d(2),
  },
  {
    id: 'alog-009',
    action: 'BATCH_COMPLETED',
    resourceType: 'BATCH',
    resourceId: 'batch-001',
    userId: 'u-003',
    userName: 'Rahul Verma',
    details: { notes: 'All BSE orders submitted successfully.' },
    timestamp: d(1),
  },
  {
    id: 'alog-010',
    action: 'USER_LOGIN',
    resourceType: 'USER',
    resourceId: 'u-003',
    userId: 'u-003',
    userName: 'Rahul Verma',
    details: { ip: '127.0.0.1' },
    timestamp: d(1),
  },
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function addAuditLog(
  entry: Omit<AuditLogEntry, 'id' | 'timestamp'>,
): AuditLogEntry {
  const log: AuditLogEntry = {
    ...entry,
    id: makeId(),
    timestamp: new Date().toISOString(),
  };
  auditLogs.push(log);
  return log;
}

export function listAuditLogs(filters: AuditLogFilters): {
  data: AuditLogEntry[];
  meta: { page: number; pageSize: number; totalCount: number; totalPages: number };
} {
  const {
    resourceType,
    resourceId,
    userId,
    startDate,
    endDate,
    page = 1,
    pageSize = 50,
  } = filters;

  let results = [...auditLogs].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  if (resourceType) {
    results = results.filter((l) => l.resourceType === resourceType);
  }
  if (resourceId) {
    results = results.filter((l) => l.resourceId === resourceId);
  }
  if (userId) {
    results = results.filter((l) => l.userId === userId);
  }
  if (startDate) {
    const start = new Date(startDate).getTime();
    results = results.filter((l) => new Date(l.timestamp).getTime() >= start);
  }
  if (endDate) {
    const end = new Date(endDate).getTime();
    results = results.filter((l) => new Date(l.timestamp).getTime() <= end);
  }

  const totalCount = results.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const offset = (page - 1) * pageSize;
  const data = results.slice(offset, offset + pageSize);

  return { data, meta: { page, pageSize, totalCount, totalPages } };
}
