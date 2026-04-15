/**
 * portfoliosService.ts
 * In-memory portfolio store.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DriftStatus = 'OK' | 'WARNING' | 'CRITICAL';

export interface Portfolio {
  id: string;
  name: string;
  totalAum: number;
  mandateType: string;
  currentDrift: number;
  driftStatus: DriftStatus;
  pendingRecommendations: number;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

const NOW = new Date().toISOString();

const portfolios: Portfolio[] = [
  {
    id: 'port-001',
    name: 'Rahul Mehta',
    totalAum: 8418710,
    mandateType: 'Aggressive',
    currentDrift: 8.83,
    driftStatus: 'WARNING',
    pendingRecommendations: 14,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'port-002',
    name: 'Surbhi Jain',
    totalAum: 5200000,
    mandateType: 'Moderate',
    currentDrift: 3.2,
    driftStatus: 'OK',
    pendingRecommendations: 6,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'port-003',
    name: 'Amit Shah',
    totalAum: 12000000,
    mandateType: 'Conservative',
    currentDrift: 1.5,
    driftStatus: 'OK',
    pendingRecommendations: 2,
    createdAt: NOW,
    updatedAt: NOW,
  },
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface PortfolioFilters {
  page?: number;
  pageSize?: number;
}

export function listPortfolios(filters: PortfolioFilters = {}): {
  data: Portfolio[];
  meta: { page: number; pageSize: number; totalCount: number; totalPages: number };
} {
  const { page = 1, pageSize = 50 } = filters;
  const totalCount = portfolios.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const offset = (page - 1) * pageSize;
  const data = portfolios.slice(offset, offset + pageSize);

  return { data, meta: { page, pageSize, totalCount, totalPages } };
}

export function getPortfolioById(id: string): Portfolio | undefined {
  return portfolios.find((p) => p.id === id);
}
