/**
 * auth.ts (route)
 * Authentication routes: login, refresh, logout.
 *
 * Bug fixes:
 *   Bug 1: Login response no longer wrapped in `data` envelope — matches apidoc spec
 *   Bug 1: Refresh token sent as HttpOnly cookie, not in body
 *   Bug 2: Error code is INVALID_CREDENTIALS (not UNAUTHORIZED)
 *   Bug 3: Logout returns 204 No Content per apidoc spec
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

const REFRESH_COOKIE = 'refreshToken';

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env['NODE_ENV'] === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
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
    // Bug 2 fix: INVALID_CREDENTIALS per apidoc section 6
    res.status(401).json({
      error: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password.',
    });
    return;
  }

  const { accessToken, refreshToken } = generateTokens(user);

  // Bug 1 fix: refreshToken in HttpOnly cookie, accessToken + user in flat body (no `data` wrapper)
  res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTS);
  res.status(200).json({
    accessToken,
    user: publicUser(user),
  });
});

// ---------------------------------------------------------------------------
// POST /api/auth/refresh
// ---------------------------------------------------------------------------

router.post('/refresh', (req, res) => {
  // Accept token from HttpOnly cookie OR body (for clients that send it in body)
  const token: string | undefined =
    (req.cookies as Record<string, string>)?.[REFRESH_COOKIE] ??
    (req.body as Record<string, string>)?.refreshToken;

  if (!token) {
    res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Refresh token is missing.',
    });
    return;
  }

  const rotated = rotateRefreshToken(token);
  if (!rotated) {
    res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Refresh token is invalid or expired.',
    });
    return;
  }

  // Rotate cookie too
  res.cookie(REFRESH_COOKIE, rotated.refreshToken, COOKIE_OPTS);
  res.status(200).json({
    accessToken: rotated.accessToken,
  });
});

// ---------------------------------------------------------------------------
// POST /api/auth/logout
// ---------------------------------------------------------------------------

router.post('/logout', (req, res) => {
  const token: string | undefined =
    (req.cookies as Record<string, string>)?.[REFRESH_COOKIE] ??
    (req.body as Record<string, string>)?.refreshToken;

  if (token) revokeRefreshToken(token);

  // Bug 3 fix: 204 No Content per apidoc spec
  res.clearCookie(REFRESH_COOKIE);
  res.status(204).send();
});

export default router;
