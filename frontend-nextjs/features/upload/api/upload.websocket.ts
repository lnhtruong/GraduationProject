/**
 * Socket.IO event contracts for the media namespace.
 * The shared client lives in features/_shared/realtime/media-socket.ts.
 */

import type { Socket } from "socket.io-client";
import { createMediaSocket } from "@/features/_shared/realtime/media-socket";

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

export function createMediaUploadSocket(userId: number): Socket {
  return createMediaSocket(userId);
}
