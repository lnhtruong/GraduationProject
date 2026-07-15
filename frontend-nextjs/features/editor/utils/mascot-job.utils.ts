import {
  createMediaUploadStream,
  type VideoCompletedPayload,
  type VideoErrorPayload,
} from "@/features/_shared/realtime/media-upload-stream";
import { mascotApi } from "@/features/editor/api/mascot.api";

type UnknownRecord = Record<string, unknown>;

export type MascotJobCompletion = {
  jobId?: string;
  type?: string;
  status?: string;
  stage?: string;
  url?: string;
  videoId?: number;
  errorMessage?: string;
};

export type WaitForMascotJobOptions = {
  jobId: string;
  userId: number;
  requireVideoId?: boolean;
  timeoutMs?: number;
  pollIntervalMs?: number;
  onProgress?: (stage: string) => void;
};

const DEFAULT_TIMEOUT_MS = 15 * 60 * 1000;
const DEFAULT_POLL_INTERVAL_MS = 60_000;
const DEFAULT_SSE_RECONNECT_MS = 5_000;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function unwrapPayload(value: unknown): UnknownRecord {
  if (!isRecord(value)) return {};

  if (isRecord(value.data)) {
    return {
      ...value,
      ...value.data,
    };
  }

  if (isRecord(value.result)) {
    return {
      ...value,
      ...value.result,
    };
  }

  return value;
}

function readString(record: UnknownRecord, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }
  return undefined;
}

function readNumber(record: UnknownRecord, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
}

export function normalizeMascotJobPayload(value: unknown): MascotJobCompletion {
  const record = unwrapPayload(value);
  const errorRecord = isRecord(record.error) ? record.error : undefined;

  return {
    jobId: readString(record, ["jobId", "job_id", "id"]),
    type: readString(record, ["type", "video_type"]),
    status: readString(record, ["status", "state"]),
    stage: readString(record, ["stage", "step", "message", "progress_message"]),
    url: readString(record, [
      "url",
      "video_url",
      "download_url",
      "downloadUrl",
      "output_url",
      "outputUrl",
    ]),
    videoId: readNumber(record, ["videoId", "video_id", "id_video"]),
    errorMessage:
      readString(record, ["error_message", "message", "reason"]) ??
      (errorRecord ? readString(errorRecord, ["message", "reason"]) : undefined),
  };
}

function isMascotCompletionForJob(
  payload: MascotJobCompletion,
  jobId: string,
): boolean {
  if (payload.jobId && payload.jobId !== jobId) return false;
  if (payload.type && payload.type !== "mascot") return false;
  return true;
}

function isCompletedStatus(status?: string): boolean {
  if (!status) return false;
  return ["completed", "complete", "done", "success", "succeeded"].includes(
    status.toLowerCase(),
  );
}

function isFailedStatus(status?: string): boolean {
  if (!status) return false;
  return ["failed", "error", "cancelled", "canceled"].includes(
    status.toLowerCase(),
  );
}

export function waitForMascotJobCompletion({
  jobId,
  userId,
  requireVideoId = false,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
  onProgress,
}: WaitForMascotJobOptions): Promise<MascotJobCompletion> {
  return new Promise((resolve, reject) => {
    let finished = false;
    let stream: ReturnType<typeof createMediaUploadStream> | null = null;
    let pollTimer: number | null = null;
    let reconnectTimer: number | null = null;
    let timeoutTimer: number | null = null;
    let isPolling = false;
    let sseConnected = false;
    let sseConnecting = false;

    const cleanup = () => {
      stream?.close();
      stream = null;
      if (pollTimer) window.clearTimeout(pollTimer);
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      if (timeoutTimer) window.clearTimeout(timeoutTimer);
      pollTimer = null;
      reconnectTimer = null;
      timeoutTimer = null;
    };

    const complete = (payload: MascotJobCompletion) => {
      if (finished) return;
      finished = true;
      cleanup();
      resolve(payload);
    };

    const fail = (error: Error) => {
      if (finished) return;
      finished = true;
      cleanup();
      reject(error);
    };

    const handlePayload = (rawPayload: unknown) => {
      const payload = normalizeMascotJobPayload(rawPayload);
      if (!isMascotCompletionForJob(payload, jobId)) return;

      if (payload.stage) onProgress?.(payload.stage);

      if (isFailedStatus(payload.status) || payload.errorMessage) {
        fail(new Error(payload.errorMessage ?? "Tạo video mascot thất bại."));
        return;
      }

      const isCompleted =
        isCompletedStatus(payload.status) || Boolean(payload.url);
      if (!isCompleted) return;

      if (!payload.url) return;
      if (requireVideoId && !payload.videoId) return;

      complete(payload);
    };

    const poll = async () => {
      if (finished || isPolling) return;
      isPolling = true;
      try {
        const status = await mascotApi.getJobStatus(jobId);
        handlePayload(status);
      } catch {
        // SSE is the primary channel; status polling is only a disconnected fallback.
      } finally {
        isPolling = false;
        scheduleDisconnectedFallback();
      }
    };

    const scheduleDisconnectedFallback = () => {
      if (finished || sseConnected || pollTimer) return;
      pollTimer = window.setTimeout(() => {
        pollTimer = null;
        void poll();
      }, pollIntervalMs);
    };

    const clearDisconnectedFallback = () => {
      if (!pollTimer) return;
      window.clearTimeout(pollTimer);
      pollTimer = null;
    };

    const scheduleSseReconnect = () => {
      if (finished || sseConnected || sseConnecting || reconnectTimer) return;
      reconnectTimer = window.setTimeout(() => {
        reconnectTimer = null;
        openStream();
      }, DEFAULT_SSE_RECONNECT_MS);
    };

    const openStream = () => {
      if (finished || sseConnected || sseConnecting) return;
      sseConnecting = true;
      stream?.close();
      stream = createMediaUploadStream(
      {
        onOpen: () => {
          sseConnected = true;
          sseConnecting = false;
          clearDisconnectedFallback();
        },
        onEvent: () => {},
        onProgress: (payload) => {
          const normalized = normalizeMascotJobPayload(payload);
          if (!isMascotCompletionForJob(normalized, jobId)) return;
          if (normalized.stage) onProgress?.(normalized.stage);
        },
        onCompleted: (payload: VideoCompletedPayload) => {
          handlePayload(payload);
        },
        onError: (payload: VideoErrorPayload) => {
          const normalized = normalizeMascotJobPayload(payload);
          if (!isMascotCompletionForJob(normalized, jobId)) return;
          fail(new Error(normalized.errorMessage ?? "Tạo video mascot thất bại."));
        },
        onConnectionError: () => {
          sseConnected = false;
          sseConnecting = false;
          scheduleSseReconnect();
          scheduleDisconnectedFallback();
        },
      },
      { userId },
    );
    };

    openStream();
    scheduleDisconnectedFallback();
    timeoutTimer = window.setTimeout(() => {
      fail(new Error("Tạo video mascot quá lâu. Vui lòng kiểm tra lại trong thư viện."));
    }, timeoutMs);
  });
}
