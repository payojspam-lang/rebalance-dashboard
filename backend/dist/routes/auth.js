"use strict";
/**
 * auth.ts (route)
 * Authentication routes: login, refresh, logout.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const authService_1 = require("../services/authService");
const router = (0, express_1.Router)();
// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------
const LoginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
const RefreshSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1, 'refreshToken is required'),
});
const LogoutSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1, 'refreshToken is required'),
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
        res.status(401).json({
            error: 'UNAUTHORIZED',
            message: 'Invalid email or password.',
        });
        return;
    }
    const { accessToken, refreshToken } = (0, authService_1.generateTokens)(user);
    res.status(200).json({
        data: {
            accessToken,
            refreshToken,
            user: (0, authService_1.publicUser)(user),
        },
    });
});
// ---------------------------------------------------------------------------
// POST /api/auth/refresh
// ---------------------------------------------------------------------------
router.post('/refresh', (req, res) => {
    const result = RefreshSchema.safeParse(req.body);
    if (!result.success) {
        const err = result.error;
        res.status(422).json({
            error: 'VALIDATION_ERROR',
            message: 'Request validation failed.',
            details: err.errors.map((e) => ({ path: e.path.join('.'), message: e.message })),
        });
        return;
    }
    const rotated = (0, authService_1.rotateRefreshToken)(result.data.refreshToken);
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
    (0, authService_1.revokeRefreshToken)(result.data.refreshToken);
    res.status(200).json({ data: { message: 'Logged out successfully.' } });
});
exports.default = router;
