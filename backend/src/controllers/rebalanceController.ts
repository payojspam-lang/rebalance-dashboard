/**
 * rebalanceController.ts
 * Thin controller — parses the validated request, calls the engine, returns response.
 *
 * Controllers must not contain business logic. Business logic lives exclusively
 * in services/engine/rebalanceEngine.ts.
 */

import { Request, Response, NextFunction } from 'express';
import { generateActionPlan } from '../services/engine/rebalanceEngine';
import { RISK_MANDATES } from '../services/engine/mandateProfiles';
import { RebalanceRequest, RebalanceResponse } from '../models/types';

export async function rebalance(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = req.body as RebalanceRequest;
    const { user_account_id, mandate, holdings, fund_universe } = body;

    // Verify mandate is known (Zod already validates the enum, but belt-and-suspenders)
    if (!RISK_MANDATES[mandate]) {
      res.status(422).json({
        error: 'VALIDATION_ERROR',
        message: `Unknown mandate '${mandate}'. Valid values: Conservative, Low, Moderate, High, Aggressive.`,
      });
      return;
    }

    // Run the engine
    const { recommendations, currentAllocation, summary } = generateActionPlan(
      holdings,
      mandate,
      fund_universe,
    );

    // Build target allocation breakdown for the response
    const mandateProfile = RISK_MANDATES[mandate];
    const totalValue = summary.total_portfolio_value;
    const targetAllocation = {
      large_cap:     mandateProfile.large_cap * totalValue,
      mid_cap:       mandateProfile.mid_cap * totalValue,
      small_cap:     mandateProfile.small_cap * totalValue,
      gold:          mandateProfile.gold * totalValue,
      debt:          mandateProfile.debt * totalValue,
      thematic:      mandateProfile.thematic * totalValue,
      international: 0,
      hybrid:        0,
      total:         totalValue,
      percentages: {
        large_cap:     mandateProfile.large_cap * 100,
        mid_cap:       mandateProfile.mid_cap * 100,
        small_cap:     mandateProfile.small_cap * 100,
        gold:          mandateProfile.gold * 100,
        debt:          mandateProfile.debt * 100,
        thematic:      mandateProfile.thematic * 100,
        international: 0,
        hybrid:        0,
      },
    };

    const response: RebalanceResponse = {
      data: {
        user_account_id,
        mandate,
        total_portfolio_value: totalValue,
        current_allocation: currentAllocation,
        target_allocation: targetAllocation,
        recommendations,
        summary,
      },
    };

    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
}
