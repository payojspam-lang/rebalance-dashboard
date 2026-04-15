"use strict";
/**
 * server.ts
 * Express application entry point for the Aegis Rebalance Engine backend.
 *
 * Registers middleware, mounts routes, and starts the HTTP server.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const rebalance_1 = __importDefault(require("./routes/rebalance"));
const auth_1 = __importDefault(require("./routes/auth"));
const portfolios_1 = __importDefault(require("./routes/portfolios"));
const recommendations_1 = __importDefault(require("./routes/recommendations"));
const batches_1 = __importDefault(require("./routes/batches"));
const auditLogs_1 = __importDefault(require("./routes/auditLogs"));
const events_1 = __importDefault(require("./routes/events"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const auth_2 = require("./middleware/auth");
const errorHandler_1 = require("./middleware/errorHandler");
const app = (0, express_1.default)();
const PORT = process.env['PORT'] ?? 3001;
// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use((0, cors_1.default)({
    origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express_1.default.json({ limit: '2mb' })); // portfolio payloads can be large
// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
/** Health check — used by Docker and load balancers */
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'aegis-rebalance-engine', timestamp: new Date().toISOString() });
});
/** Core rebalance endpoint */
app.use('/api/rebalance', rebalance_1.default);
/** Public Dashboard routes (For immediate integration without auth token barrier, as per specs) */
app.use('/api/dashboard', dashboard_routes_1.default);
/** Auth — public endpoints (no authentication required) */
app.use('/api/auth', auth_1.default);
/** Protected API routes — all require a valid Bearer JWT */
app.use('/api/portfolios', auth_2.authenticate, portfolios_1.default);
app.use('/api/recommendations', auth_2.authenticate, recommendations_1.default);
app.use('/api/batches', auth_2.authenticate, batches_1.default);
app.use('/api/audit-logs', auth_2.authenticate, auditLogs_1.default);
app.use('/api/events', auth_2.authenticate, events_1.default);
// ---------------------------------------------------------------------------
// 404 catch-all
// ---------------------------------------------------------------------------
app.use((_req, res) => {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Route not found.' });
});
// ---------------------------------------------------------------------------
// Error handler (must be last)
// ---------------------------------------------------------------------------
app.use(errorHandler_1.errorHandler);
// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
app.listen(PORT, () => {
    console.log(`\n🚀 Aegis Rebalance Engine API`);
    console.log(`   Running at: http://localhost:${PORT}`);
    console.log(`   Health:     http://localhost:${PORT}/health`);
    console.log(`   Auth:       POST http://localhost:${PORT}/api/auth/login`);
    console.log(`   Rebalance:  POST http://localhost:${PORT}/api/rebalance\n`);
});
exports.default = app;
