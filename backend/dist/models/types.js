"use strict";
/**
 * types.ts
 * Canonical TypeScript interfaces for the Aegis Rebalance Engine.
 * Every field maps 1:1 to the Rebalance V0.xlsx schema documented in arch.md.
 *
 * FINANCIAL ARITHMETIC RULE: All monetary values arrive as `number` from JSON.
 * Inside the engine we immediately box them with Decimal.js. Never do float
 * arithmetic on ₹ amounts directly.
 */
Object.defineProperty(exports, "__esModule", { value: true });
