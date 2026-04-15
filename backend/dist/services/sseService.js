"use strict";
/**
 * sseService.ts
 * Server-Sent Events (SSE) client management.
 *
 * Maintains a set of connected SSE response streams. When state transitions
 * occur, callers use `emitEvent` to broadcast to all connected clients.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.addClient = addClient;
exports.removeClient = removeClient;
exports.emitEvent = emitEvent;
exports.clientCount = clientCount;
// ---------------------------------------------------------------------------
// Client registry
// ---------------------------------------------------------------------------
const clients = new Set();
/**
 * Register a new SSE client connection.
 * The caller must write SSE headers before calling this.
 */
function addClient(res) {
    clients.add(res);
}
/**
 * Remove a client when the connection closes.
 */
function removeClient(res) {
    clients.delete(res);
}
/**
 * Broadcast an SSE event to all connected clients.
 */
function emitEvent(event) {
    const data = JSON.stringify(event.payload);
    const message = `event: ${event.type}\ndata: ${data}\n\n`;
    clients.forEach((res) => {
        try {
            res.write(message);
        }
        catch {
            // Client disconnected mid-write — remove it
            clients.delete(res);
        }
    });
}
function clientCount() {
    return clients.size;
}
