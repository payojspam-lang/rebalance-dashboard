"use strict";
/**
 * portfoliosService.ts
 * In-memory portfolio store.
 *
 * Bug 4 fix: Added `driftThreshold` and `allocationSummary` fields
 * that apidoc section 4.4 requires in GET /portfolios responses.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.listPortfolios = listPortfolios;
exports.getPortfolioById = getPortfolioById;
// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------
const NOW = new Date().toISOString();
const portfolios = [
    {
        id: 'port-001',
        name: 'Rahul Mehta',
        totalAum: 8418710,
        mandateType: 'Aggressive',
        driftThreshold: 0.05,
        currentDrift: 0.0883,
        driftStatus: 'WARNING',
        allocationSummary: [
            { assetName: 'Franklin India ELSS Tax Saver', currentWeight: 0.1373, targetWeight: 0.0 },
            { assetName: 'HDFC Mid Cap Fund', currentWeight: 0.2253, targetWeight: 0.3000 },
            { assetName: 'Nippon India Large Cap Fund', currentWeight: 0.0, targetWeight: 0.1341 },
        ],
        pendingRecommendations: 14,
        updatedAt: NOW,
    },
    {
        id: 'port-002',
        name: 'Surbhi Jain',
        totalAum: 5200000,
        mandateType: 'Moderate',
        driftThreshold: 0.05,
        currentDrift: 0.032,
        driftStatus: 'OK',
        allocationSummary: [
            { assetName: 'Axis Bluechip Fund', currentWeight: 0.15, targetWeight: 0.45 },
            { assetName: 'HDFC Small Cap Fund', currentWeight: 0.08, targetWeight: 0.15 },
        ],
        pendingRecommendations: 6,
        updatedAt: NOW,
    },
    {
        id: 'port-003',
        name: 'Amit Shah',
        totalAum: 12000000,
        mandateType: 'Conservative',
        driftThreshold: 0.03,
        currentDrift: 0.015,
        driftStatus: 'OK',
        allocationSummary: [
            { assetName: 'SBI Bluechip Fund', currentWeight: 0.60, targetWeight: 0.60 },
            { assetName: 'HDFC Short Term Debt Fund', currentWeight: 0.25, targetWeight: 0.25 },
        ],
        pendingRecommendations: 2,
        updatedAt: NOW,
    },
];
function listPortfolios(filters = {}) {
    const { page = 1, pageSize = 50 } = filters;
    const totalCount = portfolios.length;
    const totalPages = Math.ceil(totalCount / pageSize) || 1;
    const offset = (page - 1) * pageSize;
    const data = portfolios.slice(offset, offset + pageSize);
    return { data, meta: { page, pageSize, totalCount, totalPages } };
}
function getPortfolioById(id) {
    return portfolios.find((p) => p.id === id);
}
