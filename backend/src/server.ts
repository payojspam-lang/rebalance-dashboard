/**
 * server.ts
 * Express application entry point for the Aegis Rebalance Engine backend.
 *
 * Registers middleware, mounts routes, and starts the HTTP server.
 */

import express from 'express';
import cors from 'cors';
import rebalanceRoutes from './routes/rebalance';
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
}));

app.use(express.json({ limit: '2mb' })); // portfolio payloads can be large

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/** Health check — used by Docker and load balancers */
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'aegis-rebalance-engine', timestamp: new Date().toISOString() });
});

/** Core rebalance endpoint */
app.use('/api/rebalance', rebalanceRoutes);

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
  console.log(`   Rebalance:  POST http://localhost:${PORT}/api/rebalance\n`);
});

export default app;
