"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const authService_1 = require("../services/authService");
const router = (0, express_1.Router)();
const REFRESH_COOKIE = 'refreshToken';
const COOKIE_OPTS = {
    httpOnly: true,
    secure: process.env['NODE_ENV'] === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};
// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------
const LoginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------
router.post('/login', (req, res) => {
    const result = LoginSchema.safeParse(req.body);
    if (!result.success) {
        const err = result.error;
        res.status(422).json({
            error: 'VALIDATION_ERROR',
            message: 'Request validation failed.',
            details: err.errors.map((e) => ({ path: e.path.join('.'), message: e.message })),
        });
        return;
    }
    const { email, password } = result.data;
    const user = (0, authService_1.findUserByCredentials)(email, password);
    if (!user) {
        // Bug 2 fix: INVALID_CREDENTIALS per apidoc section 6
        res.status(401).json({
            error: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password.',
        });
        return;
    }
    const { accessToken, refreshToken } = (0, authService_1.generateTokens)(user);
    // Bug 1 fix: refreshToken in HttpOnly cookie, accessToken + user in flat body (no `data` wrapper)
    res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTS);
    res.status(200).json({
        accessToken,
        user: (0, authService_1.publicUser)(user),
    });
});
// ---------------------------------------------------------------------------
// POST /api/auth/refresh
// ---------------------------------------------------------------------------
router.post('/refresh', (req, res) => {
    // Accept token from HttpOnly cookie OR body (for clients that send it in body)
    const token = req.cookies?.[REFRESH_COOKIE] ??
        req.body?.refreshToken;
    if (!token) {
        res.status(401).json({
            error: 'UNAUTHORIZED',
            message: 'Refresh token is missing.',
        });
        return;
    }
    const rotated = (0, authService_1.rotateRefreshToken)(token);
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
    const token = req.cookies?.[REFRESH_COOKIE] ??
        req.body?.refreshToken;
    if (token)
        (0, authService_1.revokeRefreshToken)(token);
    // Bug 3 fix: 204 No Content per apidoc spec
    res.clearCookie(REFRESH_COOKIE);
    res.status(204).send();
});
exports.default = router;
