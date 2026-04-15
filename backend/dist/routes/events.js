"use strict";
/**
 * events.ts (route)
 * GET /api/events — Server-Sent Events endpoint
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sseService_1 = require("../services/sseService");
const router = (0, express_1.Router)();
/**
 * GET /api/events
 * Establishes a persistent SSE connection. The client receives events
 * whenever recommendation state transitions or batch operations occur.
 */
router.get('/', (req, res) => {
    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // disable nginx buffering if applicable
    res.flushHeaders();
    // Send an initial connection event
    res.write(`event: CONNECTED\ndata: ${JSON.stringify({ clientCount: (0, sseService_1.clientCount)() + 1 })}\n\n`);
    // Register client
    (0, sseService_1.addClient)(res);
    // Send a heartbeat every 30 seconds to keep the connection alive
    const heartbeat = setInterval(() => {
        try {
            res.write(`: heartbeat\n\n`);
        }
        catch {
            clearInterval(heartbeat);
        }
    }, 30_000);
    // Cleanup on client disconnect
    req.on('close', () => {
        clearInterval(heartbeat);
        (0, sseService_1.removeClient)(res);
    });
});
exports.default = router;
