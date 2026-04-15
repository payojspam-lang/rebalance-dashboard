/**
 * auth.ts (route)
 * Authentication routes: login, refresh, logout.
 */

import { Router } from 'express';
import { z, ZodError } from 'zod';
import {
  findUserByCredentials,
  generateTokens,
  rotateRefreshToken,
  revokeRefreshToken,
  publicUser,
} from '../services/authService';

const router = Router();

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const RefreshSchema = z.object({
  refreshToken: z.string().min(1, 'refreshToken is required'),
});

const LogoutSchema = z.object({
  refreshToken: z.string().min(1, 'refreshToken is required'),
});

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------

router.post('/login', (req, res) => {
  const result = LoginSchema.safeParse(req.body);
  if (!result.success) {
    const err = result.error as ZodError;
    res.status(422).json({
      error: 'VALIDATION_ERROR',
      message: 'Request validation failed.',
      details: err.errors.map((e) => ({ path: e.path.join('.'), message: e.message })),
    });
    return;
  }

  const { email, password } = result.data;
  const user = findUserByCredentials(email, password);

  if (!user) {
    res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Invalid email or password.',
    });
    return;
  }

  const { accessToken, refreshToken } = generateTokens(user);

  res.status(200).json({
    data: {
      accessToken,
      refreshToken,
      user: publicUser(user),
    },
  });
});

// ---------------------------------------------------------------------------
// POST /api/auth/refresh
// ---------------------------------------------------------------------------

router.post('/refresh', (req, res) => {
  const result = RefreshSchema.safeParse(req.body);
  if (!result.success) {
    const err = result.error as ZodError;
    res.status(422).json({
      error: 'VALIDATION_ERROR',
      message: 'Request validation failed.',
      details: err.errors.map((e) => ({ path: e.path.join('.'), message: e.message })),
    });
    return;
  }

  const rotated = rotateRefreshToken(result.data.refreshToken);
  if (!rotated) {
    res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Refresh token is invalid or expired.',
    });
    return;
  }

  res.status(200).json({
    data: {
      accessToken: rotated.accessToken,
      refreshToken: rotated.refreshToken,
      user: rotated.user,
    },
  });
});

// ---------------------------------------------------------------------------
// POST /api/auth/logout
// ---------------------------------------------------------------------------

router.post('/logout', (req, res) => {
  const result = LogoutSchema.safeParse(req.body);
  if (!result.success) {
    // Even with bad input, return 200 — logout should always succeed
    res.status(200).json({ data: { message: 'Logged out.' } });
    return;
  }

  revokeRefreshToken(result.data.refreshToken);
  res.status(200).json({ data: { message: 'Logged out successfully.' } });
});

export default router;
