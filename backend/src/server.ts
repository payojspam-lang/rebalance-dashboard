/**
 * server.ts
 * Express application entry point for the Aegis Rebalance Engine backend.
 *
 * Registers middleware, mounts routes, and starts the HTTP server.
 */

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rebalanceRoutes from './routes/rebalance';
import authRoutes from './routes/auth';
import portfoliosRoutes from './routes/portfolios';
import recommendationsRoutes from './routes/recommendations';
import batchesRoutes from './routes/batches';
import auditLogsRoutes from './routes/auditLogs';
import eventsRoutes from './routes/events';
import dashboardRoutes from './routes/dashboard.routes';
import { authenticate } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env['PORT'] ?? 3001;

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

app.use(cors({
  origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // required for HttpOnly cookies
}));

app.use(cookieParser());
app.use(express.json({ limit: '2mb' }));

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/** Health check — used by Docker and load balancers */
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'aegis-rebalance-engine', timestamp: new Date().toISOString() });
});

/** Core rebalance endpoint */
app.use('/api/rebalance', rebalanceRoutes);

/** Public Dashboard routes (For immediate integration without auth token barrier, as per specs) */
app.use('/api/dashboard', dashboardRoutes);

/** Auth — public endpoints (no authentication required) */
app.use('/api/auth', authRoutes);

/** Protected API routes — all require a valid Bearer JWT */
app.use('/api/portfolios', authenticate, portfoliosRoutes);
app.use('/api/recommendations', authenticate, recommendationsRoutes);
app.use('/api/batches', authenticate, batchesRoutes);
app.use('/api/audit-logs', authenticate, auditLogsRoutes);
app.use('/api/events', authenticate, eventsRoutes);

// ---------------------------------------------------------------------------
// 404 catch-all
// ---------------------------------------------------------------------------

app.use((_req, res) => {
  res.status(404).json({ error: 'NOT_FOUND', message: 'Route not found.' });
});

// ---------------------------------------------------------------------------
// Error handler (must be last)
// ---------------------------------------------------------------------------

app.use(errorHandler);

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

export default app;
