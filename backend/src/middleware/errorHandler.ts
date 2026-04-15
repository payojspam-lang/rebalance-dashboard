/**
 * errorHandler.ts
 * Custom error classes and Express error-handling middleware.
 *
 * All domain errors extend AppError. The Express error handler maps them to
 * consistent JSON responses. Internal details (stack traces, DB errors) are
 * never exposed to the client.
 */

import { Request, Response, NextFunction } from 'express';

// ---------------------------------------------------------------------------
// Base application error
// ---------------------------------------------------------------------------

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// ---------------------------------------------------------------------------
// Domain-specific errors
// ---------------------------------------------------------------------------

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(422, 'VALIDATION_ERROR', message, details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, 'NOT_FOUND', `${resource} not found.`);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required.') {
    super(401, 'UNAUTHORIZED', message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action.') {
    super(403, 'FORBIDDEN', message);
  }
}

export class BusinessRuleError extends AppError {
  constructor(message: string, details?: unknown) {
    super(409, 'BUSINESS_RULE_VIOLATION', message, details);
  }
}

// ---------------------------------------------------------------------------
// Express error handler middleware
// Must be registered last — after all routes.
// ---------------------------------------------------------------------------

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.code,
      message: err.message,
      ...(err.details !== undefined ? { details: err.details } : {}),
    });
    return;
  }

  // Unknown error — log internally, return generic 500
  console.error('[UNHANDLED ERROR]', err);
  res.status(500).json({
    error: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred. Please try again.',
  });
}
