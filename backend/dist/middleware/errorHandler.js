"use strict";
/**
 * errorHandler.ts
 * Custom error classes and Express error-handling middleware.
 *
 * All domain errors extend AppError. The Express error handler maps them to
 * consistent JSON responses. Internal details (stack traces, DB errors) are
 * never exposed to the client.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessRuleError = exports.ForbiddenError = exports.UnauthorizedError = exports.NotFoundError = exports.ValidationError = exports.AppError = void 0;
exports.errorHandler = errorHandler;
// ---------------------------------------------------------------------------
// Base application error
// ---------------------------------------------------------------------------
class AppError extends Error {
    statusCode;
    code;
    details;
    constructor(statusCode, code, message, details) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.AppError = AppError;
// ---------------------------------------------------------------------------
// Domain-specific errors
// ---------------------------------------------------------------------------
class ValidationError extends AppError {
    constructor(message, details) {
        super(422, 'VALIDATION_ERROR', message, details);
    }
}
exports.ValidationError = ValidationError;
class NotFoundError extends AppError {
    constructor(resource) {
        super(404, 'NOT_FOUND', `${resource} not found.`);
    }
}
exports.NotFoundError = NotFoundError;
class UnauthorizedError extends AppError {
    constructor(message = 'Authentication required.') {
        super(401, 'UNAUTHORIZED', message);
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends AppError {
    constructor(message = 'You do not have permission to perform this action.') {
        super(403, 'FORBIDDEN', message);
    }
}
exports.ForbiddenError = ForbiddenError;
class BusinessRuleError extends AppError {
    constructor(message, details) {
        super(409, 'BUSINESS_RULE_VIOLATION', message, details);
    }
}
exports.BusinessRuleError = BusinessRuleError;
// ---------------------------------------------------------------------------
// Express error handler middleware
// Must be registered last — after all routes.
// ---------------------------------------------------------------------------
function errorHandler(err, _req, res, _next) {
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
