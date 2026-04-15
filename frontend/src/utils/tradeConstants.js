/**
 * tradeConstants.js
 * Shared trade-type constants used by both the BSE Order File view
 * and RecommendationsContext so both always agree on what constitutes a sell.
 *
 * Import from here — never redefine in consuming modules.
 */

/** All recommendedAction strings that belong on the SELL side of an execution */
export const SELL_ACTIONS = new Set(["SELL", "TRIM", "TRIM/HOLD"]);
