/**
 * auth.ts
 * JWT authentication and role-based authorization middleware.
 */

import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/authService';
import type { UserRole } from '../services/authService';

// ---------------------------------------------------------------------------
// Extend Express Request with authenticated user
// ---------------------------------------------------------------------------

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        role: UserRole;
      };
    }
  }
}

// ---------------------------------------------------------------------------
// authenticate — validates Bearer JWT and attaches req.user
// ---------------------------------------------------------------------------

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Authorization header with Bearer token is required.',
    });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    };
    next();
  } catch {
    res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Invalid or expired access token.',
    });
  }
}

// ---------------------------------------------------------------------------
// authorize — role-based access control factory
// ---------------------------------------------------------------------------

export function authorize(roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Authentication required.',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: 'FORBIDDEN',
        message: `This action requires one of the following roles: ${roles.join(', ')}.`,
      });
      return;
    }

    next();
  };
}
