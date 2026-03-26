/**
 * Socket.IO client for media namespace — always go through API Gateway (e.g. http://localhost:8000).
 * Gateway proxies /socket.io to the media service; namespace /media matches WebsocketGateway.
 */

import { io, type Socket } from "socket.io-client";
import { API_URL } from "@/lib/env";

// ============================================================================
// TYPES (aligned with backend WebsocketService)
// ============================================================================

export interface VideoCompletedEvent {
  success: boolean;
  data: {
    id: number;
    url: string;
    type: string;
    duration?: number;
  };
  timestamp: string;
}

export interface VideoErrorEvent {
  success: false;
  error: {
    id?: string;
    message: string;
    reason?: string;
  };
  timestamp: string;
}

export interface VideoProgressEvent {
  videoId: number;
  progress: number;
  timestamp: string;
}

// ============================================================================
// URL HELPERS
// ============================================================================

/**
 * Gateway origin for Socket.IO (same host as REST API, without /api path).
 * Override with NEXT_PUBLIC_WS_GATEWAY_URL if needed.
 */
export function resolveMediaGatewayOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_WS_GATEWAY_URL;
  if (explicit?.trim()) {
    return explicit.replace(/\/$/, "");
  }
  try {
    return new URL(API_URL).origin;
  } catch {
    return "http://localhost:8000";
  }
}

/**
 * Creates a Socket.IO connection to namespace /media on the API Gateway.
 */
export function createMediaUploadSocket(userId: number): Socket {
  const origin = resolveMediaGatewayOrigin();

  return io(`${origin}/media`, {
    path: "/socket.io",
    query: { userId: String(userId) },
    transports: ["websocket", "polling"],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });
}
