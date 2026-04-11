/**
 * Shared Socket.IO client for the media namespace.
 * Keep transport and gateway resolution here so feature hooks only consume the client.
 */

import { io, type Socket } from "socket.io-client";
import { WS_GATEWAY_URL } from "@/lib/env";

/**
 * Creates a Socket.IO connection to namespace /media on the API Gateway.
 */
export function createMediaSocket(userId: number): Socket {
  const wsOrigin = WS_GATEWAY_URL;

  return io(`${wsOrigin}/media`, {
    path: "/socket.io",
    query: { userId: String(userId) },
    transports: ["websocket", "polling"],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });
}
