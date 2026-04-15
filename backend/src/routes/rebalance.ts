/**
 * rebalance.ts
 * Route definitions for the rebalance domain.
 *
 * POST /api/rebalance
 *   Accepts a portfolio of MF holdings + a target mandate and returns
 *   the full action plan (Buy/Sell/Hold/Trim) with tax and exit load estimates.
 */

import { Router } from 'express';
import { z, ZodError } from 'zod';
import { rebalance } from '../controllers/rebalanceController';

const router = Router();

// ---------------------------------------------------------------------------
// Zod validation schemas — match the Holding interface in models/types.ts
// ---------------------------------------------------------------------------

const HoldingSchema = z.object({
  fund_name: z.string().min(1, 'fund_name is required'),
  isin: z
    .string()
    .regex(/^INF[A-Z0-9]{9}$/, 'ISIN must be a valid Indian mutual fund ISIN (e.g., INF879O01027)'),
  category: z.string().min(1, 'category is required'),
  rating: z.number().int().min(1).max(5, 'rating must be 1–5'),
  asset_class: z.enum(['Equity', 'Debt', 'Hybrid', 'Fixed Income']),
  available_units: z.number().nonnegative(),
  short_term_units: z.number().nonnegative(),
  long_term_units: z.number().nonnegative(),
  short_term_gains: z.number(), // can be negative (unrealized loss)
  long_term_gains: z.number(),
  tax_payable: z.number().nonnegative(),
  exit_load_amount: z.number().nonnegative(),
  units_under_exit_load: z.number().nonnegative(),
  units_free_from_exit_load: z.number().nonnegative(),
  current_value: z.number().positive('current_value must be greater than 0'),
});

const FundCandidateSchema = z.object({
  isin: z.string(),
  fund_name: z.string(),
  category: z.string(),
  allocation_bucket: z.enum([
    'large_cap', 'mid_cap', 'small_cap', 'gold',
    'debt', 'thematic', 'international', 'hybrid',
  ]),
  rating: z.number().int().min(1).max(5),
  rank_in_category: z.number().int().positive(),
});

const RebalanceRequestSchema = z.object({
  user_account_id: z.string().min(1, 'user_account_id is required'),
  mandate: z.enum(['Conservative', 'Low', 'Moderate', 'High', 'Aggressive']),
  holdings: z
    .array(HoldingSchema)
    .min(1, 'At least one holding is required')
    .max(200, 'Maximum 200 holdings per request'),
  fund_universe: z.array(FundCandidateSchema).optional(),
});

// ---------------------------------------------------------------------------
// Validation middleware
// ---------------------------------------------------------------------------

function validateRebalanceRequest(
  req: import('express').Request,
  res: import('express').Response,
  next: import('express').NextFunction,
): void {
  const result = RebalanceRequestSchema.safeParse(req.body);

  if (!result.success) {
    const err = result.error as ZodError;
    res.status(422).json({
      error: 'VALIDATION_ERROR',
      message: 'Request body failed validation.',
      details: err.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  req.body = result.data; // replace body with parsed + typed data
  next();
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/**
 * POST /api/rebalance
 *
 * Accepts a portfolio of MF holdings and a risk mandate, runs the rules engine,
 * and returns the full Final Action plan with allocation analysis.
 *
 * See apidoc.md and context.md Section 6 for the full contract.
 */
router.post('/', validateRebalanceRequest, rebalance);

export default router;
