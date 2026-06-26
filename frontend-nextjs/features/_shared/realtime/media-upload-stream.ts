/**
 * Server-Sent Events (SSE) client for media upload progress tracking.
 * - Endpoint: GET /api/media/sse/users/{userId}/events
 * - Auth: Bearer token in Authorization header
 * - Events: video:progress, video:completed, upload-video:completed, video:error
 */

import { API_URL } from "@/lib/env";
import { authStorageHelper } from "@/store/auth";

// ============================================================================
// TYPES
// ============================================================================

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

export interface VideoProgressPayload {
  videoId?: number;
  progress?: number;
  jobId?: string;
  type?: string;
  stage?: string;
  status?: string;
  timestamp: string;
}

export interface VideoCompletedPayload {
  success: true;
  data: VideoData;
  timestamp: string;
}

export interface VideoErrorPayload {
  success: false;
  error?: {
    id?: string;
    message?: string;
    reason?: string;
  };
  jobId?: string;
  type?: string;
  status?: string;
  timestamp: string;
}

export const MEDIA_UPLOAD_STREAM_EVENTS = [
  "video:progress",
  "video:completed",
  "upload-video:completed",
  "video:error",
  "quiz:generated",
] as const;

export type MediaUploadStreamEventType =
  (typeof MEDIA_UPLOAD_STREAM_EVENTS)[number];

export type QuizGeneratedPayload = {
  jobId: string;
  quizId: number;
  lessonActivityId: number;
  videoId: number;
  questionCount: number;
  status: "completed" | "failed";
  type?: "quiz";
};

export type MediaUploadStreamEvent =
  | { type: "video:progress"; payload: VideoProgressPayload }
  | { type: "video:completed"; payload: VideoCompletedPayload }
  | { type: "upload-video:completed"; payload: VideoCompletedPayload }
  | { type: "video:error"; payload: VideoErrorPayload }
  | { type: "quiz:generated"; payload: QuizGeneratedPayload };

export interface UploadStreamHandlers {
  onProgress?: (payload: VideoProgressPayload) => void;
  onCompleted?: (payload: VideoCompletedPayload) => void;
  onError?: (payload: VideoErrorPayload) => void;
  onQuizGenerated?: (payload: QuizGeneratedPayload) => void;
  onEvent?: (event: MediaUploadStreamEvent) => void;
  onConnectionError?: (error: Error) => void;
}

export interface UploadStreamSubscription {
  close: () => void;
}

// ============================================================================
// HELPERS
// ============================================================================

function buildSseHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "text/event-stream",
  };

  if (/ngrok/i.test(API_URL)) {
    headers["ngrok-skip-browser-warning"] = "true";
  }

  const token = authStorageHelper.getAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

function parseEventBlock(block: string): { event?: string; data?: string } {
  let event: string | undefined;
  const dataLines: string[] = [];

  for (const line of block.split("\n")) {
    const trimmedLine = line.trimEnd();
    if (!trimmedLine || trimmedLine.startsWith(":")) continue;

    const colonIndex = trimmedLine.indexOf(":");
    if (colonIndex === -1) continue;

    const field = trimmedLine.slice(0, colonIndex).trim();
    const value = trimmedLine.slice(colonIndex + 1).replace(/^\s/, "");

    if (field === "event") {
      event = value;
    } else if (field === "data") {
      dataLines.push(value);
    }
  }

  return {
    event,
    data: dataLines.length > 0 ? dataLines.join("\n") : undefined,
  };
}

function normalizeMediaPayload(payload: unknown): unknown {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return payload;
  }

  let record = payload as Record<string, unknown>;

  // Unwrap nested data.data (backend sends data: { success, data: {...}, timestamp })
  if (
    record.success === true &&
    typeof record.data === "object" &&
    record.data !== null &&
    !Array.isArray(record.data)
  ) {
    record = {
      ...record.data,
      timestamp: record.timestamp,
    };
  }

  return {
    ...record,
    jobId:
      typeof record.jobId === "string"
        ? record.jobId
        : typeof record.job_id === "string"
          ? record.job_id
          : undefined,
    job_id:
      typeof record.job_id === "string"
        ? record.job_id
        : typeof record.jobId === "string"
          ? record.jobId
          : undefined,
    srtUrl:
      typeof record.srtUrl === "string"
        ? record.srtUrl
        : typeof record.srt_url === "string"
          ? record.srt_url
          : undefined,
    srt_url:
      typeof record.srt_url === "string"
        ? record.srt_url
        : typeof record.srtUrl === "string"
          ? record.srtUrl
          : undefined,
    url:
      typeof record.url === "string"
        ? record.url
        : typeof record.video_url === "string"
          ? record.video_url
          : undefined,
    video_url:
      typeof record.video_url === "string"
        ? record.video_url
        : typeof record.url === "string"
          ? record.url
          : undefined,
    error:
      typeof record.error === "object" && record.error !== null
        ? record.error
        : typeof record.error_message === "string"
          ? { message: record.error_message }
          : record.error,
    lessonActivityId: record.lessonActivityId ?? record.lesson_activity_id,
    lesson_activity_id: record.lessonActivityId ?? record.lesson_activity_id,
    videoId: record.videoId ?? record.video_id,
    video_id: record.videoId ?? record.video_id,
    quizId: record.quizId ?? record.quiz_id,
    quiz_id: record.quizId ?? record.quiz_id,
  };
}

// ============================================================================
// SSE STREAM
// ============================================================================

export function createMediaUploadStream(
  handlers: UploadStreamHandlers,
  options: { userId?: number } = {},
): UploadStreamSubscription {
  const controller = new AbortController();

  void (async () => {
    try {
      // Validate userId
      const storedUser = authStorageHelper.getUser() as {
        id?: number;
        user_id?: number;
      } | null;
      const userId = options.userId ?? storedUser?.id ?? storedUser?.user_id;
      if (!userId) throw new Error("Missing userId");

      // Validate token
      const token = authStorageHelper.getAccessToken();
      if (!token) throw new Error("Missing access token");

      // Open stream
      const url = `${API_URL}/media/sse/users/${userId}/events`;
      const response = await fetch(url, {
        method: "GET",
        headers: buildSseHeaders(),
        signal: controller.signal,
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(
          `SSE connection failed: ${response.status} ${response.statusText}`,
        );
      }

      if (!response.body) {
        throw new Error("SSE response has no body");
      }

      // Stream events
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (!controller.signal.aborted) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        buffer = buffer.replace(/\r\n/g, "\n");

        // Process complete SSE blocks (delimited by \n\n)
        let index = buffer.indexOf("\n\n");
        while (index !== -1) {
          const block = buffer.slice(0, index).trim();
          buffer = buffer.slice(index + 2);
          index = buffer.indexOf("\n\n");

          if (!block) continue;

          const parsed = parseEventBlock(block);
          if (!parsed.event || !parsed.data) continue;

          try {
            const payload = normalizeMediaPayload(JSON.parse(parsed.data));
            dispatchEvent(parsed.event, payload, handlers);
          } catch (err) {
            handlers.onConnectionError?.(
              new Error(
                `Parse error: ${err instanceof Error ? err.message : String(err)}`,
              ),
            );
          }
        }
      }
    } catch (err) {
      if (controller.signal.aborted) return;
      handlers.onConnectionError?.(
        new Error(
          `SSE error: ${err instanceof Error ? err.message : String(err)}`,
        ),
      );
    }
  })();

  return { close: () => controller.abort() };
}

function dispatchEvent(
  eventType: string,
  payload: unknown,
  handlers: UploadStreamHandlers,
): void {
  if (eventType === "video:progress") {
    const event = {
      type: "video:progress" as const,
      payload: payload as VideoProgressPayload,
    };
    handlers.onEvent?.(event);
    handlers.onProgress?.(event.payload);
  } else if (
    eventType === "video:completed" ||
    eventType === "upload-video:completed"
  ) {
    const event = {
      type: eventType as "video:completed" | "upload-video:completed",
      payload: payload as VideoCompletedPayload,
    };
    handlers.onEvent?.(event);
    handlers.onCompleted?.(event.payload);
  } else if (eventType === "video:error") {
    const event = {
      type: "video:error" as const,
      payload: payload as VideoErrorPayload,
    };
    handlers.onEvent?.(event);
    handlers.onError?.(event.payload);
  } else if (eventType === "quiz:generated") {
    const event = {
      type: "quiz:generated" as const,
      payload: payload as QuizGeneratedPayload,
    };
    handlers.onEvent?.(event);
    handlers.onQuizGenerated?.(event.payload);
  }
}
