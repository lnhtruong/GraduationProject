/**
 * Media upload event contracts.
 * Originally Socket.IO, now migrated to Server-Sent Events (SSE).
 * Aligned with backend SseService structure (media_service).
 */

import type { Socket } from "socket.io-client";
import { createMediaSocket } from "@/features/_shared/realtime/media-socket";

// ============================================================================
// SSE PAYLOAD TYPES (aligned with backend SseService)
// ============================================================================

/**
 * Video data returned from upload/processing webhooks.
 * Aligned with SseService.notifyVideoCompleted/notifyUploadCompleted params.
 */
export interface VideoData {
  videoId?: number;
  url?: string;
  type: string;
  duration?: number;
  name?: string;
  job_id?: string;
  jobId?: string;
  srtUrl?: string;
}

/**
 * Sent on video:progress event.
 * Emitted by: SseService.notifyVideoProgress() or notifyJobProgress()
 *
 * Can be either:
 * 1. Direct progress: {videoId, progress} - from file upload
 * 2. Job stage update: {jobId, type, stage, status} - from AI processing
 */
export interface VideoProgressPayload {
  // Direct progress format (legacy)
  videoId?: number;
  progress?: number;

  // Job stage update format (new)
  jobId?: string;
  type?: string;
  stage?: string;
  status?: string;

  timestamp: string;
}

/**
 * Sent on video:completed or upload-video:completed events.
 * Emitted by: SseService.notifyVideoCompleted() | notifyUploadCompleted()
 */
export interface VideoCompletedPayload {
  success: true;
  data: VideoData;
  timestamp: string;
}

/**
 * Sent on video:error event.
 * Emitted by: SseService.notifyVideoError() or notifyJobFailed()
 */
export interface VideoErrorPayload {
  success: false;
  error?: {
    id?: string;
    message?: string;
    reason?: string;
  };

  // Job error format (new)
  jobId?: string;
  type?: string;
  status?: string;

  timestamp: string;
}

// ============================================================================
// SOCKET.IO TYPES (legacy, kept for backwards compatibility)
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
