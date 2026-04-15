"use strict";
/**
 * categoryMapper.ts
 * Maps SEBI MF category strings to internal allocation buckets.
 *
 * Source mapping derived from Rebalance V0.xlsx "User Data" categories
 * cross-referenced with the "ML Recommendation → Allocation" output.
 *
 * Rule: when in doubt, classify conservatively (large_cap is the default
 * for unclassified equity funds per the spreadsheet comment
 * "Equity - Large (incl Unclassified)").
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllocationBucket = getAllocationBucket;
exports.isLockInCategory = isLockInCategory;
exports.getCategoryGroup = getCategoryGroup;
exports.formatStarRating = formatStarRating;
/**
 * Exact SEBI category name → allocation bucket mapping.
 * Keys must match the `category` field in the Holding input exactly.
 */
const EXACT_CATEGORY_MAP = {
    // ── Large Cap bucket ───────────────────────────────────────────
    'Large Cap Fund': 'large_cap',
    'Index Funds': 'large_cap', // UTI Nifty 50 Index Fund
    'Value Fund': 'large_cap', // ICICI Prudential Value Fund
    'Flexi Cap Fund': 'large_cap', // Parag Parikh, BANDHAN Flexi Cap
    'ELSS': 'large_cap', // Equity Linked Savings Scheme (diversified equity, mostly large cap)
    'FoF Overseas': 'international', // Franklin US Opp — tracked separately
    'Large & Mid Cap Fund': 'mid_cap', // Mirae Asset L&MC — classified mid in spreadsheet Equity-Mid bucket
    // ── Mid Cap bucket ─────────────────────────────────────────────
    'Mid Cap Fund': 'mid_cap', // HDFC Mid Cap
    // ── Small Cap bucket ───────────────────────────────────────────
    'Small Cap Fund': 'small_cap',
    // ── Hybrid bucket ──────────────────────────────────────────────
    // Aggressive Hybrid: ~65-80% equity, rest debt. Tracked as hybrid.
    // The spreadsheet does NOT break hybrid into equity/debt sub-components.
    'Aggressive Hybrid Fund': 'hybrid',
    'Conservative Hybrid Fund': 'hybrid',
    'Balanced Hybrid Fund': 'hybrid',
    'Dynamic Asset Allocation': 'hybrid',
    'Multi Asset Allocation': 'hybrid',
    // ── Debt bucket ────────────────────────────────────────────────
    'Dynamic Bond': 'debt', // Axis Dynamic Bond Fund
    'Gilt Fund': 'debt', // Bandhan Gilt Fund
    'Overnight Fund': 'debt', // Axis Overnight Fund
    'Liquid Fund': 'debt',
    'Short Duration Fund': 'debt',
    'Medium Duration Fund': 'debt',
    'Long Duration Fund': 'debt',
    'Corporate Bond Fund': 'debt',
    'Banking and PSU Fund': 'debt',
    'Credit Risk Fund': 'debt',
    'Floater Fund': 'debt',
    'Ultra Short Duration Fund': 'debt',
    'Money Market Fund': 'debt',
    // ── Gold bucket ────────────────────────────────────────────────
    'Gold ETF': 'gold',
    'Gold Fund': 'gold',
    'Fund of Funds (Gold)': 'gold',
    // ── Thematic bucket ────────────────────────────────────────────
    'Thematic Fund': 'thematic',
    'Sectoral Fund': 'thematic',
    'Infrastructure Fund': 'thematic',
    'ESG Fund': 'thematic',
};
/**
 * Partial-string fallback patterns (checked in order if exact match fails).
 * Uses lowercase includes matching.
 */
const FUZZY_PATTERNS = [
    { pattern: 'small cap', bucket: 'small_cap' },
    { pattern: 'mid cap', bucket: 'mid_cap' },
    { pattern: 'large cap', bucket: 'large_cap' },
    { pattern: 'large & mid', bucket: 'mid_cap' },
    { pattern: 'multi cap', bucket: 'large_cap' },
    { pattern: 'flexi cap', bucket: 'large_cap' },
    { pattern: 'elss', bucket: 'large_cap' },
    { pattern: 'index', bucket: 'large_cap' },
    { pattern: 'value fund', bucket: 'large_cap' },
    { pattern: 'gilt', bucket: 'debt' },
    { pattern: 'bond', bucket: 'debt' },
    { pattern: 'liquid', bucket: 'debt' },
    { pattern: 'overnight', bucket: 'debt' },
    { pattern: 'duration', bucket: 'debt' },
    { pattern: 'money market', bucket: 'debt' },
    { pattern: 'gold', bucket: 'gold' },
    { pattern: 'thematic', bucket: 'thematic' },
    { pattern: 'sector', bucket: 'thematic' },
    { pattern: 'hybrid', bucket: 'hybrid' },
    { pattern: 'overseas', bucket: 'international' },
    { pattern: 'international', bucket: 'international' },
    { pattern: 'global', bucket: 'international' },
    { pattern: 'fof', bucket: 'international' },
];
/**
 * Resolve an MF category string to an AllocationBucket.
 * Falls back to 'large_cap' for unclassified equity funds (per spreadsheet convention).
 */
function getAllocationBucket(category) {
    // 1. Exact match (case-insensitive)
    const normalised = category.trim();
    const exact = EXACT_CATEGORY_MAP[normalised];
    if (exact !== undefined)
        return exact;
    // 2. Fuzzy match — lowercase includes
    const lower = normalised.toLowerCase();
    for (const { pattern, bucket } of FUZZY_PATTERNS) {
        if (lower.includes(pattern))
            return bucket;
    }
    // 3. Default: unclassified equity → large_cap
    //    (matches "Equity - Large (incl Unclassified)" label in the spreadsheet)
    return 'large_cap';
}
/**
 * Returns true if the MF category is a lock-in (ELSS) category.
 * Lock-in categories are subject to the R_LOCKIN_FREE_SELL rule.
 */
function isLockInCategory(category) {
    const lower = category.toLowerCase().trim();
    return lower === 'elss' || lower.includes('elss') || lower.includes('tax saver');
}
/**
 * Returns a friendly category group label for display.
 */
function getCategoryGroup(category) {
    const bucket = getAllocationBucket(category);
    if (bucket === 'debt')
        return 'Fixed Income';
    if (bucket === 'hybrid')
        return 'Hybrid';
    if (bucket === 'international')
        return 'Equity';
    return 'Equity';
}
/**
 * Convert a numeric star rating to the display string used in the spreadsheet.
 */
function formatStarRating(rating) {
    return `${rating}★`;
}
