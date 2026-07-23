import {
  createMediaUploadStream,
  type ImageCompletedPayload,
  type QuizGeneratedPayload,
  type UploadStreamSubscription,
  type VideoCompletedPayload,
  type VideoErrorPayload,
  type VideoProgressPayload,
} from "./media-upload-stream";

export const INFERENCE_JOB_POLL_INTERVAL_MS = 120_000;
export const INFERENCE_JOB_SSE_RECONNECT_MS = 5_000;
export const INFERENCE_JOB_STORAGE_TTL_MS = 6 * 60 * 60 * 1000;

export type InferenceJobStorageType = "local" | "session";

export type PersistedInferenceJob = {
  jobId: string;
  userId?: number;
  contextId?: string | number | null;
  status?: string;
  savedAt?: number;
};

export interface PersistedInferenceJobOptions {
  key: string;
  storage?: InferenceJobStorageType;
  ttlMs?: number;
  userId?: number | null;
  contextId?: string | number | null;
  activeStatuses?: readonly string[];
}

export interface InferenceJobWatcherOptions<TStatus = unknown> {
  userId: number;
  pollStatus?: () => Promise<TStatus>;
  pollIntervalMs?: number;
  reconnectMs?: number;
  pollImmediately?: boolean;
  onPollStatus?: (status: TStatus) => void | Promise<void>;
  onPollError?: (error: unknown) => void;
  onOpen?: () => void;
  onProgress?: (payload: VideoProgressPayload) => void;
  onCompleted?: (payload: VideoCompletedPayload) => void;
  onImageCompleted?: (payload: ImageCompletedPayload) => void;
  onError?: (payload: VideoErrorPayload) => void;
  onQuizGenerated?: (payload: QuizGeneratedPayload) => void;
  onConnectionError?: (error: Error) => void;
}

export interface InferenceJobWatcher {
  close: () => void;
  pollNow: () => void;
}

function getInferenceJobStorage(type: InferenceJobStorageType = "local") {
  if (typeof window === "undefined") return null;
  return type === "session" ? window.sessionStorage : window.localStorage;
}

function normalizeContextId(value: string | number | null | undefined) {
  return value == null ? null : String(value);
}

export function readPersistedInferenceJob<TJob extends PersistedInferenceJob>({
  key,
  storage = "local",
  ttlMs = INFERENCE_JOB_STORAGE_TTL_MS,
  userId,
  contextId,
  activeStatuses,
}: PersistedInferenceJobOptions): TJob | null {
  const store = getInferenceJobStorage(storage);
  if (!store) return null;

  try {
    const raw = store.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<TJob>;
    const savedAt =
      typeof parsed.savedAt === "number" && Number.isFinite(parsed.savedAt)
        ? parsed.savedAt
        : 0;
    const expectedContextId = normalizeContextId(contextId);
    const actualContextId = normalizeContextId(parsed.contextId);

    const hasInvalidShape = !parsed.jobId || !savedAt;
    const isStale = Date.now() - savedAt > ttlMs;
    const isDifferentUser =
      userId != null && parsed.userId != null && parsed.userId !== userId;
    const isDifferentContext =
      expectedContextId != null && actualContextId !== expectedContextId;
    const hasInactiveStatus =
      activeStatuses != null &&
      activeStatuses.length > 0 &&
      !activeStatuses.includes(String(parsed.status ?? ""));

    if (
      hasInvalidShape ||
      isStale ||
      isDifferentUser ||
      isDifferentContext ||
      hasInactiveStatus
    ) {
      store.removeItem(key);
      return null;
    }

    return parsed as TJob;
  } catch {
    store.removeItem(key);
    return null;
  }
}

export function hasPersistedInferenceJob({
  key,
  storage = "local",
}: Pick<PersistedInferenceJobOptions, "key" | "storage">) {
  const store = getInferenceJobStorage(storage);
  return Boolean(store?.getItem(key));
}

export function writePersistedInferenceJob<TJob extends object>(
  options: PersistedInferenceJobOptions,
  job: TJob,
) {
  const store = getInferenceJobStorage(options.storage);
  if (!store) return;

  store.setItem(
    options.key,
    JSON.stringify({
      ...job,
      userId: options.userId ?? (job as Partial<PersistedInferenceJob>).userId,
      contextId:
        options.contextId ?? (job as Partial<PersistedInferenceJob>).contextId,
      savedAt: Date.now(),
    }),
  );
}

export function clearPersistedInferenceJob(
  { key, storage = "local" }: Pick<PersistedInferenceJobOptions, "key" | "storage">,
  jobId?: string,
) {
  const store = getInferenceJobStorage(storage);
  if (!store) return;

  if (jobId) {
    try {
      const raw = store.getItem(key);
      if (raw) {
        const current = JSON.parse(raw) as Partial<PersistedInferenceJob>;
        if (current.jobId && current.jobId !== jobId) return;
      }
    } catch {
      // Bad storage is cleared below.
    }
  }

  store.removeItem(key);
}

export function watchInferenceJob<TStatus = unknown>({
  userId,
  pollStatus,
  pollIntervalMs = INFERENCE_JOB_POLL_INTERVAL_MS,
  reconnectMs = INFERENCE_JOB_SSE_RECONNECT_MS,
  pollImmediately = true,
  onPollStatus,
  onPollError,
  onOpen,
  onProgress,
  onCompleted,
  onImageCompleted,
  onError,
  onQuizGenerated,
  onConnectionError,
}: InferenceJobWatcherOptions<TStatus>): InferenceJobWatcher {
  let closed = false;
  let isPolling = false;
  let stream: UploadStreamSubscription | null = null;
  let pollTimer: number | null = null;
  let reconnectTimer: number | null = null;

  const clearPollTimer = () => {
    if (!pollTimer) return;
    window.clearTimeout(pollTimer);
    pollTimer = null;
  };

  const clearReconnectTimer = () => {
    if (!reconnectTimer) return;
    window.clearTimeout(reconnectTimer);
    reconnectTimer = null;
  };

  const scheduleIdlePoll = () => {
    if (closed || !pollStatus || pollTimer) return;
    pollTimer = window.setTimeout(() => {
      pollTimer = null;
      void pollNow();
    }, pollIntervalMs);
  };

  const resetIdlePoll = () => {
    if (!pollStatus) return;
    clearPollTimer();
    scheduleIdlePoll();
  };

  const pollNow = async () => {
    if (closed || !pollStatus || isPolling) return;
    isPolling = true;
    try {
      const status = await pollStatus();
      if (closed) return;
      await onPollStatus?.(status);
    } catch (error) {
      onPollError?.(error);
    } finally {
      isPolling = false;
      scheduleIdlePoll();
    }
  };

  const openStream = () => {
    if (closed) return;
    clearReconnectTimer();
    stream?.close();
    stream = createMediaUploadStream(
      {
        onOpen,
        onProgress,
        onCompleted,
        onImageCompleted,
        onError,
        onQuizGenerated,
        onEvent: resetIdlePoll,
        onConnectionError: (error) => {
          if (closed) return;
          onConnectionError?.(error);
          void pollNow();
          if (!reconnectTimer) {
            reconnectTimer = window.setTimeout(() => {
              reconnectTimer = null;
              openStream();
            }, reconnectMs);
          }
        },
      },
      { userId },
    );
  };

  openStream();
  if (pollStatus) {
    if (pollImmediately) {
      void pollNow();
    } else {
      scheduleIdlePoll();
    }
  }

  return {
    close: () => {
      closed = true;
      clearPollTimer();
      clearReconnectTimer();
      stream?.close();
      stream = null;
    },
    pollNow: () => {
      void pollNow();
    },
  };
}
