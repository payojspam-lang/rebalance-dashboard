/**
 * sseService.ts
 * Server-Sent Events (SSE) client management.
 *
 * Maintains a set of connected SSE response streams. When state transitions
 * occur, callers use `emitEvent` to broadcast to all connected clients.
 */

import { Response } from 'express';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SseEventType =
  | 'RECOMMENDATION_STATUS_CHANGED'
  | 'BATCH_CREATED'
  | 'BATCH_COMPLETED';

export interface SseEvent {
  type: SseEventType;
  payload: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Client registry
// ---------------------------------------------------------------------------

const clients = new Set<Response>();

/**
 * Register a new SSE client connection.
 * The caller must write SSE headers before calling this.
 */
export function addClient(res: Response): void {
  clients.add(res);
}

/**
 * Remove a client when the connection closes.
 */
export function removeClient(res: Response): void {
  clients.delete(res);
}

/**
 * Broadcast an SSE event to all connected clients.
 */
export function emitEvent(event: SseEvent): void {
  const data = JSON.stringify(event.payload);
  const message = `event: ${event.type}\ndata: ${data}\n\n`;

  clients.forEach((res) => {
    try {
      res.write(message);
    } catch {
      // Client disconnected mid-write — remove it
      clients.delete(res);
    }
  });
}

export function clientCount(): number {
  return clients.size;
}
