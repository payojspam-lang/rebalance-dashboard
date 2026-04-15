/**
 * authService.ts
 * Mock authentication service with in-memory user store and JWT utilities.
 */

import jwt from 'jsonwebtoken';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const JWT_SECRET = process.env['JWT_SECRET'] ?? 'aegis-dev-secret-key';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type UserRole = 'L1' | 'L2' | 'OPS' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface JwtPayload {
  sub: string;   // user id
  email: string;
  name: string;
  role: UserRole;
}

// ---------------------------------------------------------------------------
// In-memory stores
// ---------------------------------------------------------------------------

const MOCK_USERS: User[] = [
  { id: 'u-001', email: 'analyst@aegis.com',  password: 'analyst123', name: 'Priya Sharma',  role: 'L1'    },
  { id: 'u-002', email: 'manager@aegis.com',  password: 'manager123', name: 'Arjun Kapoor',  role: 'L2'    },
  { id: 'u-003', email: 'ops@aegis.com',       password: 'ops123',      name: 'Rahul Verma',   role: 'OPS'   },
  { id: 'u-004', email: 'admin@aegis.com',     password: 'admin123',    name: 'Admin User',    role: 'ADMIN' },
];

/** Refresh token store — maps token string → user id */
const refreshTokens = new Set<string>();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toPublic(user: User): PublicUser {
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function findUserByCredentials(
  email: string,
  password: string,
): User | undefined {
  return MOCK_USERS.find((u) => u.email === email && u.password === password);
}

export function findUserById(id: string): User | undefined {
  return MOCK_USERS.find((u) => u.id === id);
}

export function generateTokens(user: User): {
  accessToken: string;
  refreshToken: string;
} {
  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '7d' });

  refreshTokens.add(refreshToken);
  return { accessToken, refreshToken };
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export function rotateRefreshToken(
  oldRefreshToken: string,
): { accessToken: string; refreshToken: string; user: PublicUser } | null {
  if (!refreshTokens.has(oldRefreshToken)) {
    return null;
  }

  let payload: { sub: string };
  try {
    payload = jwt.verify(oldRefreshToken, JWT_SECRET) as { sub: string };
  } catch {
    refreshTokens.delete(oldRefreshToken);
    return null;
  }

  const user = findUserById(payload.sub);
  if (!user) return null;

  refreshTokens.delete(oldRefreshToken);
  const tokens = generateTokens(user);

  return { ...tokens, user: toPublic(user) };
}

export function revokeRefreshToken(token: string): boolean {
  return refreshTokens.delete(token);
}

export function publicUser(user: User): PublicUser {
  return toPublic(user);
}
