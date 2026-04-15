"use strict";
/**
 * authService.ts
 * Mock authentication service with in-memory user store and JWT utilities.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findUserByCredentials = findUserByCredentials;
exports.findUserById = findUserById;
exports.generateTokens = generateTokens;
exports.verifyAccessToken = verifyAccessToken;
exports.rotateRefreshToken = rotateRefreshToken;
exports.revokeRefreshToken = revokeRefreshToken;
exports.publicUser = publicUser;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const JWT_SECRET = process.env['JWT_SECRET'] ?? 'aegis-dev-secret-key';
// ---------------------------------------------------------------------------
// In-memory stores
// ---------------------------------------------------------------------------
const MOCK_USERS = [
    { id: 'u-001', email: 'analyst@aegis.com', password: 'analyst123', name: 'Priya Sharma', role: 'L1' },
    { id: 'u-002', email: 'manager@aegis.com', password: 'manager123', name: 'Arjun Kapoor', role: 'L2' },
    { id: 'u-003', email: 'ops@aegis.com', password: 'ops123', name: 'Rahul Verma', role: 'OPS' },
    { id: 'u-004', email: 'admin@aegis.com', password: 'admin123', name: 'Admin User', role: 'ADMIN' },
];
/** Refresh token store — maps token string → user id */
const refreshTokens = new Set();
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function toPublic(user) {
    return { id: user.id, email: user.email, name: user.name, role: user.role };
}
// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
function findUserByCredentials(email, password) {
    return MOCK_USERS.find((u) => u.email === email && u.password === password);
}
function findUserById(id) {
    return MOCK_USERS.find((u) => u.id === id);
}
function generateTokens(user) {
    const payload = {
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
    };
    const accessToken = jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jsonwebtoken_1.default.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '7d' });
    refreshTokens.add(refreshToken);
    return { accessToken, refreshToken };
}
function verifyAccessToken(token) {
    return jsonwebtoken_1.default.verify(token, JWT_SECRET);
}
function rotateRefreshToken(oldRefreshToken) {
    if (!refreshTokens.has(oldRefreshToken)) {
        return null;
    }
    let payload;
    try {
        payload = jsonwebtoken_1.default.verify(oldRefreshToken, JWT_SECRET);
    }
    catch {
        refreshTokens.delete(oldRefreshToken);
        return null;
    }
    const user = findUserById(payload.sub);
    if (!user)
        return null;
    refreshTokens.delete(oldRefreshToken);
    const tokens = generateTokens(user);
    return { ...tokens, user: toPublic(user) };
}
function revokeRefreshToken(token) {
    return refreshTokens.delete(token);
}
function publicUser(user) {
    return toPublic(user);
}
