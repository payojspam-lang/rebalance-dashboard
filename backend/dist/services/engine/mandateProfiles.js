"use strict";
/**
 * mandateProfiles.ts
 * Canonical risk mandate target allocations.
 * Source: "ML Recommendation" sheet rows 1-6 from Rebalance V0.xlsx.
 *
 * Each mandate maps to target % weights across asset allocation buckets.
 * Values are expressed as decimals (0.10 = 10%).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BUCKET_TO_BUY_RULE = exports.DEFAULT_FUND_UNIVERSE = exports.RISK_MANDATES = void 0;
// ---------------------------------------------------------------------------
// Risk Mandate Profiles (all 5 profiles from the spreadsheet)
// ---------------------------------------------------------------------------
exports.RISK_MANDATES = {
    Conservative: {
        name: 'Conservative',
        large_cap: 0.60,
        mid_cap: 0.10,
        small_cap: 0.05,
        gold: 0.10,
        debt: 0.15,
        thematic: 0.00,
        aif: 0.00,
        pms: 0.00,
        unlisted: 0.00,
    },
    Low: {
        name: 'Low',
        large_cap: 0.50,
        mid_cap: 0.125,
        small_cap: 0.125,
        gold: 0.125,
        debt: 0.125,
        thematic: 0.00,
        aif: 0.00,
        pms: 0.00,
        unlisted: 0.00,
    },
    Moderate: {
        name: 'Moderate',
        large_cap: 0.45,
        mid_cap: 0.15,
        small_cap: 0.15,
        gold: 0.15,
        debt: 0.10,
        thematic: 0.00,
        aif: 0.00,
        pms: 0.00,
        unlisted: 0.00,
    },
    High: {
        name: 'High',
        large_cap: 0.25,
        mid_cap: 0.25,
        small_cap: 0.25,
        gold: 0.10,
        debt: 0.00,
        thematic: 0.15,
        aif: 0.00,
        pms: 0.00,
        unlisted: 0.00,
    },
    Aggressive: {
        name: 'Aggressive',
        large_cap: 0.10,
        mid_cap: 0.30,
        small_cap: 0.30,
        gold: 0.10,
        debt: 0.00,
        thematic: 0.20,
        aif: 0.00,
        pms: 0.00,
        unlisted: 0.00,
    },
};
// ---------------------------------------------------------------------------
// Default Fund Universe for new purchases
// Source: "Buy Summary" sheet from Rebalance V0.xlsx
// In production this comes from a live fund database / ML ranking service.
// ---------------------------------------------------------------------------
exports.DEFAULT_FUND_UNIVERSE = [
    // Large Cap — Rank 1 (Buy Summary: EQ_LARGE_NEW_R5_RANK1)
    {
        isin: 'INF204K01D30',
        fund_name: 'Nippon India Large Cap Fund',
        category: 'Large Cap Fund',
        allocation_bucket: 'large_cap',
        rating: 5,
        rank_in_category: 1,
    },
    // Mid Cap — Rank 1 (Buy Summary: EQ_MID_NEW_R5_RANK1)
    {
        isin: 'INF917K01FZ1',
        fund_name: 'HSBC Midcap Fund',
        category: 'Mid Cap Fund',
        allocation_bucket: 'mid_cap',
        rating: 5,
        rank_in_category: 1,
    },
    // Small Cap — Rank 1 (Buy Summary: EQ_SMALL_NEW_R5_RANK1)
    {
        isin: 'INF194KB1AL4',
        fund_name: 'BANDHAN Small Cap Fund',
        category: 'Small Cap Fund',
        allocation_bucket: 'small_cap',
        rating: 5,
        rank_in_category: 1,
    },
    // Mid Cap — Rank 1 alternate (Sheet7 reference)
    {
        isin: 'INF205K01MA0',
        fund_name: 'Invesco India Large & Mid Cap Fund',
        category: 'Large & Mid Cap Fund',
        allocation_bucket: 'mid_cap',
        rating: 5,
        rank_in_category: 1,
    },
];
/**
 * Map an allocation bucket to the buy rule ID used in that bucket.
 */
exports.BUCKET_TO_BUY_RULE = {
    large_cap: 'EQ_LARGE_NEW_R5_RANK1',
    mid_cap: 'EQ_MID_NEW_R5_RANK1',
    small_cap: 'EQ_SMALL_NEW_R5_RANK1',
    thematic: 'EQ_THEMATIC_NEW_R5_RANK1',
};
