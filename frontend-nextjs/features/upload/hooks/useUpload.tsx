"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as tus from "tus-js-client";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useProcessHighlightLink } from "../api/upload.hooks";
import {
  getVideoDurationFromUrl,
  resolveDurationSec,
} from "../utils/video-duration";
import { getVideoDurationFromFile } from "@/features/video/utils/get-video-duration-from-file";
import { uploadApi } from "../api/upload.api";
import type {
  VideoCompletedPayload,
  VideoErrorPayload,
  VideoProgressPayload,
} from "@/features/_shared/realtime/media-upload-stream";
import {
  clearPersistedInferenceJob,
  hasPersistedInferenceJob,
  INFERENCE_JOB_STORAGE_TTL_MS,
  INFERENCE_JOB_POLL_INTERVAL_MS,
  INFERENCE_JOB_SSE_RECONNECT_MS,
  type PersistedInferenceJob,
  readPersistedInferenceJob,
  watchInferenceJob,
  writePersistedInferenceJob,
} from "@/features/_shared/realtime/inference-job-watcher";
import { useCreateProject } from "@/features/project/api/project.hooks";
import { authStorageHelper } from "@/store/auth";
import type {
  Clip,
  HighlightParams,
  UploadHookReturn,
  UploadState,
  UploadStatus,
} from "@/features/upload/types";
import { getUserFacingErrorMessage } from "@/lib/user-facing-error";
import { BUNNY_MAX_UPLOAD_BYTES, BUNNY_MAX_UPLOAD_LABEL } from "@/lib/env";
import { videoApi } from "@/features/video/api/video.api";

const INITIAL_STATE: UploadState = {
  file: null,
  source: null,
  progress: null,
  status: "idle",
  jobId: null,
  bunnyVideoId: null,
  sourceVideoId: null,
  sourceVideoUrl: null,
  createdProjectId: null,
  clips: [],
  isDownloading: false,
  error: null,
  stage: undefined,
  progressPercent: undefined,
  jobType: undefined,
};

const ACTIVE_HIGHLIGHT_JOB_KEY = "learnhub:active-highlight-job";
const HIGHLIGHT_STATUS_FALLBACK_MS = INFERENCE_JOB_POLL_INTERVAL_MS;
const ACTIVE_HIGHLIGHT_JOB_STORAGE = {
  key: ACTIVE_HIGHLIGHT_JOB_KEY,
  storage: "local" as const,
  ttlMs: INFERENCE_JOB_STORAGE_TTL_MS,
  activeStatuses: ["pending", "processing", "completed"],
};

type UploadEventEnvelope = {
  jobId?: string | number;
  job_id?: string | number;
  type?: string;
  status?: string;
  url?: string;
  video_url?: string;
  urls?: unknown;
  outputs?: unknown;
  clips?: unknown;
  videos?: unknown;
  createdVideos?: unknown;
  videoIds?: unknown;
  zip_url?: string;
  videoId?: number;
  video_id?: number;
  name?: string;
  title?: string;
  description?: string;
  thumbnail?: string;
  duration?: number;
  srtUrl?: string;
  srt_url?: string;
  srt_raw_url?: string;
  progress?: number;
  stage?: string;
  data?: Record<string, unknown>;
  result?: Record<string, unknown>;
};

type SavedHighlightJob = PersistedInferenceJob & Partial<UploadState>;

export interface UseUploadOptions {
  autoCreateProject?: boolean;
}

function resolveUserId(authUserId: number | undefined): number | undefined {
  if (authUserId != null) return authUserId;
  const stored = authStorageHelper.getUser() as {
    id?: number;
    user_id?: number;
  } | null;
  return stored?.id ?? stored?.user_id;
}

function formatKeywords(items: string[]) {
  return items
    .map((item) => item.trim())
    .filter(Boolean)
    .join(",");
}

function readEventJobId(payload: UploadEventEnvelope): string | null {
  const raw =
    payload.data?.job_id ??
    payload.data?.jobId ??
    payload.job_id ??
    payload.jobId;
  return raw == null ? null : String(raw);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function clipFromUnknown(value: unknown, index: number): Clip | null {
  if (typeof value === "string") {
    return {
      url: value,
      name:
        value.split("/").pop()?.split("?")[0] || `highlight-${index + 1}.mp4`,
    };
  }

  const record = asRecord(value);
  if (!record) return null;

  const url =
    typeof record.url === "string"
      ? record.url
      : typeof record.video_url === "string"
        ? record.video_url
        : typeof record.output_url === "string"
          ? record.output_url
          : typeof record.download_url === "string"
            ? record.download_url
            : typeof record.downloadUrl === "string"
              ? record.downloadUrl
              : undefined;

  if (!url) return null;

  const rawVideoId =
    record.videoId ?? record.video_id ?? record.id ?? record.source_id;
  const parsedVideoId =
    typeof rawVideoId === "number"
      ? rawVideoId
      : typeof rawVideoId === "string" && Number.isFinite(Number(rawVideoId))
        ? Number(rawVideoId)
        : undefined;
  const videoId =
    parsedVideoId && parsedVideoId > 0 ? parsedVideoId : undefined;

  const topicId =
    typeof record.topicId === "number" || typeof record.topicId === "string"
      ? record.topicId
      : typeof record.topic_id === "number" ||
          typeof record.topic_id === "string"
        ? record.topic_id
        : null;

  const duration =
    typeof record.duration === "number"
      ? record.duration
      : typeof record.duration === "string" &&
          Number.isFinite(Number(record.duration))
        ? Number(record.duration)
        : null;

  return {
    url,
    videoId,
    topicId,
    description:
      typeof record.description === "string" ? record.description : null,
    srtUrl:
      typeof record.srtUrl === "string"
        ? record.srtUrl
        : typeof record.srt_url === "string"
          ? record.srt_url
          : typeof record.srt_raw_url === "string"
            ? record.srt_raw_url
            : null,
    name:
      (typeof record.name === "string" && record.name) ||
      (typeof record.title === "string" && record.title) ||
      (topicId ? `Highlight ${topicId}` : "") ||
      url.split("/").pop()?.split("?")[0] ||
      `highlight-${index + 1}.mp4`,
    thumbnail:
      typeof record.thumbnail === "string"
        ? record.thumbnail
        : typeof record.thumbnailUrl === "string"
          ? record.thumbnailUrl
          : null,
    duration,
  };
}

function isHighlightJobEvent(payload: UploadEventEnvelope): boolean {
  const rawType =
    typeof payload.data?.type === "string"
      ? payload.data.type
      : typeof payload.type === "string"
        ? payload.type
        : "";

  return rawType.toLowerCase().startsWith("highlight");
}

function readJobType(payload: UploadEventEnvelope): string | undefined {
  const rawType =
    typeof payload.data?.type === "string"
      ? payload.data.type
      : typeof payload.type === "string"
        ? payload.type
        : undefined;

  return rawType?.trim() || undefined;
}

function resolveRunningStatus(payload: UploadEventEnvelope): UploadStatus {
  const rawStatus =
    typeof payload.status === "string"
      ? payload.status
      : typeof payload.data?.status === "string"
        ? payload.data.status
        : "";
  const normalized = rawStatus.toLowerCase();

  if (["pending", "queued", "queue", "waiting"].includes(normalized)) {
    return "pending";
  }

  return "processing";
}

function readCompletedClips(
  payload: VideoCompletedPayload | UploadEventEnvelope,
): {
  clips: Clip[];
  jobId: string | null;
} {
  const envelope = payload as UploadEventEnvelope;
  const data = asRecord(envelope.data) ?? {};
  const result = asRecord(envelope.result) ?? asRecord(data.result) ?? {};
  const source = { ...envelope, ...data, ...result };

  const buckets = [
    source.createdVideos,
    source.outputs,
    source.clips,
    source.videos,
    source.urls,
  ].filter(Array.isArray) as unknown[][];

  const clips = buckets
    .flat()
    .map((item, index) => clipFromUnknown(item, index))
    .filter((clip): clip is Clip => Boolean(clip));

  if (typeof source.url === "string" || typeof source.video_url === "string") {
    const single = clipFromUnknown(
      {
        url: source.url ?? source.video_url,
        videoId: source.videoId ?? source.video_id,
        name: source.name,
        title: source.title,
        description: source.description,
        thumbnail: source.thumbnail,
        duration: source.duration,
        srtUrl: source.srtUrl ?? source.srt_url ?? source.srt_raw_url,
      },
      0,
    );
    if (single) clips.unshift(single);
  }

  if (typeof source.zip_url === "string") {
    clips.push({
      url: source.zip_url,
      name: source.zip_url.split("/").pop()?.split("?")[0] || "highlights.zip",
    });
  }

  const videoIds = Array.isArray(source.videoIds)
    ? source.videoIds.filter(
        (value): value is number => typeof value === "number",
      )
    : [];
  if (videoIds.length > 0) {
    clips.forEach((clip, index) => {
      if (!clip.videoId && videoIds[index]) {
        clip.videoId = videoIds[index];
      }
    });
  }

  const uniqueClips = Array.from(
    new Map(clips.map((clip) => [clip.url, clip])).values(),
  );

  return {
    clips: uniqueClips,
    jobId: readEventJobId(envelope),
  };
}

function readErrorMessage(
  payload: VideoErrorPayload | UploadEventEnvelope,
): string | null {
  const envelope = payload as UploadEventEnvelope;
  const data = asRecord(envelope.data) ?? {};
  const source = { ...envelope, ...data } as Record<string, unknown>;
  const error = source.error;

  if (typeof error === "string" && error.trim()) return error;

  const errorRecord = asRecord(error);
  const message =
    errorRecord?.message ?? source.error_message ?? source.errorMessage;
  return typeof message === "string" && message.trim() ? message : null;
}

function isDownloadBundle(clip: Clip): boolean {
  return /\.zip(?:\?|$)/i.test(clip.url) || /\.zip$/i.test(clip.name);
}

function normalizeAssetUrl(value: string): string {
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`;
  } catch {
    return value.split("?")[0];
  }
}

function isBunnyOriginalUrl(value: string) {
  return /\/original(?:[?#].*)?$/i.test(value.trim());
}

function mergeCompletedClips(current: Clip[], incoming: Clip[]): Clip[] {
  if (current.length === 1 && incoming.length === 1) {
    return [{ ...current[0], ...incoming[0] }];
  }

  const merged = new Map(current.map((clip) => [clip.url, clip]));
  for (const clip of incoming) {
    merged.set(clip.url, { ...merged.get(clip.url), ...clip });
  }
  return Array.from(merged.values());
}

function restoreActiveHighlightJob(currentUserId?: number): UploadState {
  const saved = readPersistedInferenceJob<SavedHighlightJob>({
    ...ACTIVE_HIGHLIGHT_JOB_STORAGE,
    userId: currentUserId,
  });
  if (!saved) return INITIAL_STATE;

  return {
    ...INITIAL_STATE,
    ...saved,
    file: null,
    progress: null,
    clips: Array.isArray(saved.clips) ? saved.clips : [],
    status:
      saved.status === "completed" && saved.clips?.length
        ? "completed"
        : "processing",
    stage: saved.stage || "Đang khôi phục tiến trình tạo highlight",
  };
}

function resolveProjectId(response: unknown): number | null {
  const record = asRecord(response);
  const data = asRecord(record?.data);
  return (
    (typeof record?.edit_id === "number" ? record.edit_id : null) ??
    (typeof record?.id === "number" ? record.id : null) ??
    (typeof data?.edit_id === "number" ? data.edit_id : null) ??
    (typeof data?.id === "number" ? data.id : null)
  );
}

async function uploadFileToBunny(
  file: File,
  onProgress: (percent: number) => void,
): Promise<{
  videoId: number;
  bunnyVideoId: string;
  videoUrl: string;
  thumbnail?: string | null;
  duration?: number | null;
}> {
  const initResponse = await videoApi.initBunnyUpload({
    title: file.name,
    meta: { purpose: "highlight_source" },
  });

  await new Promise<void>((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint: initResponse.tus.endpoint,
      retryDelays: [0, 1000, 3000, 5000, 10000],
      chunkSize: 8 * 1024 * 1024,
      removeFingerprintOnSuccess: true,
      headers: {
        AuthorizationSignature: initResponse.tus.headers.AuthorizationSignature,
        AuthorizationExpire: initResponse.tus.headers.AuthorizationExpire,
        LibraryId: initResponse.tus.headers.LibraryId,
        VideoId: initResponse.tus.headers.VideoId,
      },
      metadata: {
        filetype: file.type || "video/mp4",
        title: file.name,
      },
      onProgress: (bytesUploaded, bytesTotal) => {
        const percent = Math.round(
          (bytesUploaded / Math.max(bytesTotal, 1)) * 100,
        );
        onProgress(Math.min(percent, 99));
      },
      onSuccess: () => resolve(),
      onError: (error) => reject(error),
    });

    upload.start();
  });

  const videoUrl = initResponse.url ?? initResponse.originalUrl ?? null;
  if (!videoUrl) {
    throw new Error("Hệ thống chưa trả về URL video gốc để xử lý.");
  }

  if (!isBunnyOriginalUrl(videoUrl)) {
    throw new Error(
      "Hệ thống chưa trả về URL /original của Bunny để tạo highlight.",
    );
  }

  // TUS completion means the original file is available. Highlight processing
  // can start now while Bunny continues transcoding the playback variants.
  return {
    videoId: initResponse.videoId,
    bunnyVideoId: initResponse.bunnyVideoId,
    videoUrl,
    thumbnail: null,
    duration: null,
  };
}

export function useUpload(options?: UseUploadOptions): UploadHookReturn {
  const autoCreateProject = options?.autoCreateProject ?? true;
  const [state, setState] = useState<UploadState>(INITIAL_STATE);
  const { user } = useAuth();
  const resolvedUserId = resolveUserId(user?.id);
  const router = useRouter();
  const { mutateAsync: createProject } = useCreateProject();
  const createProjectPromiseRef = useRef<Promise<{
    projectId: number;
    videoId?: number;
  } | null> | null>(null);
  const redirectedProjectRef = useRef<number | null>(null);

  // Pre-upload (ADR 0002, GraduationProject): the Bunny upload now starts as
  // soon as the file is confirmed, not deferred until the highlight params
  // form is submitted. `uploadGenerationRef` guards against a stale upload's
  // result/error landing after cancel()/reset() started a new one.
  const uploadGenerationRef = useRef(0);
  const preUploadRef = useRef<{
    file: File;
    promise: Promise<{
      videoId: number;
      bunnyVideoId: string;
      videoUrl: string;
      thumbnail?: string | null;
      duration?: number | null;
    }>;
  } | null>(null);

  const setJobStarted = useCallback((jobId: string) => {
    setState((prev) => ({
      ...prev,
      jobId,
      status: "pending",
      progress: null,
      stage: "Đã gửi yêu cầu tạo highlight",
      progressPercent: 5,
    }));
  }, []);

  const setJobError = useCallback((error: Error) => {
    setState((prev) => ({
      ...prev,
      status: "failed",
      error: getUserFacingErrorMessage(
        error,
        "Không thể xử lý video. Vui lòng thử lại.",
      ),
      progress: null,
    }));
  }, []);

  const processHighlightLink = useProcessHighlightLink({
    onJobStarted: setJobStarted,
    onError: setJobError,
  });

  const updateState = (updates: Partial<UploadState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    redirectedProjectRef.current = null;
    createProjectPromiseRef.current = null;

    if (resolvedUserId == null) {
      setState(INITIAL_STATE);
      return;
    }

    setState(restoreActiveHighlightJob(resolvedUserId));
  }, [resolvedUserId]);

  const awaitingPersistedVideoIds =
    state.status === "completed" &&
    state.clips.some((clip) => !isDownloadBundle(clip) && !clip.videoId);
  const sseSessionActive =
    state.status === "uploading" ||
    state.status === "pending" ||
    state.status === "processing" ||
    awaitingPersistedVideoIds;

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !state.jobId ||
      resolvedUserId == null
    ) {
      return;
    }

    const hasStoredJob = hasPersistedInferenceJob(ACTIVE_HIGHLIGHT_JOB_STORAGE);
    if (!hasStoredJob) return;

    const saved = readPersistedInferenceJob<SavedHighlightJob>({
      ...ACTIVE_HIGHLIGHT_JOB_STORAGE,
      userId: resolvedUserId,
    });
    if (!saved) {
      setState(INITIAL_STATE);
    }
  }, [resolvedUserId, state.jobId]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (
      state.jobId &&
      (state.status === "pending" ||
        state.status === "processing" ||
        awaitingPersistedVideoIds)
    ) {
      writePersistedInferenceJob(
        { ...ACTIVE_HIGHLIGHT_JOB_STORAGE, userId: resolvedUserId },
        {
          jobId: state.jobId,
          status: state.status,
          source: state.source,
          sourceVideoId: state.sourceVideoId,
          sourceVideoUrl: state.sourceVideoUrl,
          bunnyVideoId: state.bunnyVideoId,
          stage: state.stage,
          progressPercent: state.progressPercent,
          clips: state.clips,
          jobType: state.jobType,
        },
      );
      return;
    }

    clearPersistedInferenceJob(ACTIVE_HIGHLIGHT_JOB_STORAGE);
  }, [
    state.bunnyVideoId,
    state.jobId,
    state.progressPercent,
    state.source,
    state.sourceVideoId,
    state.sourceVideoUrl,
    state.stage,
    state.status,
    state.clips,
    state.jobType,
    resolvedUserId,
    awaitingPersistedVideoIds,
  ]);

  const createOrGetProjectForClip = useCallback(
    async (
      clip: UploadState["clips"][number],
    ): Promise<{ projectId: number; videoId?: number } | null> => {
      if (!clip?.url || !clip.videoId || !resolveUserId(user?.id)) return null;

      if (state.createdProjectId) {
        return clip.videoId
          ? { projectId: state.createdProjectId, videoId: clip.videoId }
          : { projectId: state.createdProjectId };
      }

      if (createProjectPromiseRef.current) {
        return createProjectPromiseRef.current;
      }

      const promise = (async () => {
        const createdProject = await createProject({
          session_name: `Highlight ${new Date().toLocaleDateString("vi-VN")}`,
          video_id: clip.videoId,
        });

        const projectId = resolveProjectId(createdProject);
        if (!projectId) return null;

        setState((prev) => ({
          ...prev,
          createdProjectId: prev.createdProjectId ?? projectId,
        }));

        return clip.videoId
          ? { projectId, videoId: clip.videoId }
          : { projectId };
      })();

      createProjectPromiseRef.current = promise;
      try {
        return await promise;
      } finally {
        createProjectPromiseRef.current = null;
      }
    },
    [createProject, state.createdProjectId, user?.id],
  );

  useEffect(() => {
    const userId = resolveUserId(user?.id);
    if (!userId || !sseSessionActive) return;

    const onProgress = (payload: VideoProgressPayload) => {
      setState((prev) => {
        if (prev.status === "completed" || prev.status === "failed")
          return prev;

        const envelope = payload as UploadEventEnvelope;
        const eventJobId = readEventJobId(envelope);
        if (eventJobId && prev.jobId && String(prev.jobId) !== eventJobId) {
          return prev;
        }

        const rawStage =
          typeof envelope.stage === "string"
            ? envelope.stage.trim()
            : undefined;
        if (!rawStage && typeof payload.progress !== "number") return prev;
        if (prev.jobId && !eventJobId && !isHighlightJobEvent(envelope)) {
          return prev;
        }

        return {
          ...prev,
          status: resolveRunningStatus(envelope),
          jobType: readJobType(envelope) ?? prev.jobType,
          stage: rawStage ?? `Đang xử lý (${payload.progress}%)`,
          progressPercent:
            typeof payload.progress === "number"
              ? payload.progress
              : prev.progressPercent,
        };
      });
    };

    const onCompleted = (payload: VideoCompletedPayload) => {
      const { clips, jobId } = readCompletedClips(payload);
      if (clips.length === 0) return;

      setState((prev) => {
        if (prev.jobId && !jobId) {
          return prev;
        }

        if (jobId && prev.jobId && String(prev.jobId) !== String(jobId)) {
          return prev;
        }

        return {
          ...prev,
          status: "completed",
          clips: mergeCompletedClips(prev.clips, clips),
          isDownloading: false,
          progress: null,
          progressPercent: 100,
          jobType:
            readJobType(payload as unknown as UploadEventEnvelope) ??
            prev.jobType,
          stage: "Hoàn thành",
        };
      });
    };

    const onError = (payload: VideoErrorPayload) => {
      setState((prev) => {
        const errorJobId = readEventJobId(
          payload as unknown as UploadEventEnvelope,
        );
        if (prev.jobId && !errorJobId) {
          return prev;
        }

        if (errorJobId && prev.jobId && String(prev.jobId) !== errorJobId) {
          return prev;
        }

        return {
          ...prev,
          status: "failed",
          error: readErrorMessage(payload) ?? "Không thể tạo highlight.",
          progress: null,
          stage: "Không thành công",
        };
      });
    };

    const handlePolledStatus = (payload: Record<string, unknown>) => {
      const status = String(
        payload.status ?? asRecord(payload.result)?.status ?? "",
      ).toLowerCase();

      if (["completed", "complete", "success", "succeeded"].includes(status)) {
        const { clips } = readCompletedClips(payload as UploadEventEnvelope);
        if (clips.length > 0) {
          setState((prev) => ({
            ...prev,
            status: "completed",
            clips,
            progress: null,
            progressPercent: 100,
            jobType:
              readJobType(payload as UploadEventEnvelope) ?? prev.jobType,
            stage: "Hoàn thành",
          }));
        }
        return;
      }

      if (
        [
          "pending",
          "queued",
          "queue",
          "waiting",
          "processing",
          "running",
        ].includes(status)
      ) {
        const envelope = payload as UploadEventEnvelope;
        const rawStage =
          typeof envelope.stage === "string"
            ? envelope.stage.trim()
            : typeof envelope.data?.stage === "string"
              ? envelope.data.stage.trim()
              : undefined;
        const progress =
          typeof envelope.progress === "number"
            ? envelope.progress
            : typeof envelope.data?.progress === "number"
              ? envelope.data.progress
              : undefined;

        setState((prev) => {
          if (prev.status === "completed" || prev.status === "failed") {
            return prev;
          }

          return {
            ...prev,
            status: resolveRunningStatus(envelope),
            jobType: readJobType(envelope) ?? prev.jobType,
            stage: rawStage ?? prev.stage,
            progressPercent:
              typeof progress === "number" ? progress : prev.progressPercent,
          };
        });
        return;
      }

      if (["failed", "error", "cancelled", "canceled"].includes(status)) {
        setState((prev) => ({
          ...prev,
          status: "failed",
          progress: null,
          stage: "Không thành công",
          error:
            readErrorMessage(payload as UploadEventEnvelope) ??
            "Không thể tạo highlight.",
        }));
      }
    };

    const watcher = watchInferenceJob({
      userId,
      pollIntervalMs: HIGHLIGHT_STATUS_FALLBACK_MS,
      reconnectMs: INFERENCE_JOB_SSE_RECONNECT_MS,
      pollStatus:
        state.jobId &&
        (state.status === "pending" || state.status === "processing")
          ? () => uploadApi.getJobStatus(String(state.jobId))
          : undefined,
      onPollStatus: handlePolledStatus,
      onProgress,
      onCompleted,
      onError,
    });

    return () => watcher.close();
  }, [user?.id, sseSessionActive, state.jobId, state.status]);

  useEffect(() => {
    if (!awaitingPersistedVideoIds) return;

    let cancelled = false;

    const reconcilePersistedVideos = async () => {
      try {
        const videos = await videoApi.getAllByUser("highlight");
        if (cancelled) return;

        const videoIdByUrl = new Map(
          videos
            .filter((video) => Boolean(video.url) && video.id > 0)
            .map((video) => [normalizeAssetUrl(video.url), video.id]),
        );
        const videoIdByJobId = new Map(
          videos
            .filter(
              (video) => Boolean(video.job_id ?? video.jobId) && video.id > 0,
            )
            .map((video) => [String(video.job_id ?? video.jobId), video.id]),
        );

        setState((prev) => ({
          ...prev,
          clips: prev.clips.map((clip) => ({
            ...clip,
            videoId:
              clip.videoId ??
              (prev.jobId
                ? videoIdByJobId.get(String(prev.jobId))
                : undefined) ??
              videoIdByUrl.get(normalizeAssetUrl(clip.url)),
          })),
        }));
      } catch {
        // The SSE event may still arrive; retry reconciliation in the next cycle.
      }
    };

    void reconcilePersistedVideos();
    const timer = window.setInterval(reconcilePersistedVideos, 3_000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [awaitingPersistedVideoIds]);

  useEffect(() => {
    if (!autoCreateProject) return;
    if (state.status !== "completed" || state.clips.length !== 1) return;

    const firstClip = state.clips[0];
    if (!firstClip?.url || !firstClip.videoId || !resolveUserId(user?.id)) {
      return;
    }

    let isMounted = true;

    const createProjectAndRedirect = async () => {
      try {
        const result = await createOrGetProjectForClip(firstClip);
        if (!isMounted || !result) return;
        if (redirectedProjectRef.current === result.projectId) return;

        redirectedProjectRef.current = result.projectId;
        const params = new URLSearchParams({
          edit_id: String(result.projectId),
          src: firstClip.url,
          from: "highlight",
        });
        if (result.videoId) params.set("video_id", String(result.videoId));

        let shouldRedirect = true;
        const redirectTimer = setTimeout(() => {
          if (shouldRedirect && isMounted) {
            router.push(`/editor?${params.toString()}`);
          }
        }, 5000);

        toast.success("Đã tạo highlight, đang mở Studio...", {
          duration: 5000,
          action: {
            label: "Ở lại xem kết quả",
            onClick: () => {
              shouldRedirect = false;
              clearTimeout(redirectTimer);
              toast.dismiss();
            },
          },
        });
      } catch (error) {
        console.error("[useUpload] Failed to auto-create project:", error);
      }
    };

    void createProjectAndRedirect();

    return () => {
      isMounted = false;
    };
  }, [
    autoCreateProject,
    createOrGetProjectForClip,
    router,
    state.clips,
    state.status,
    user?.id,
  ]);

  const startHighlightFromUrl = async (
    videoUrl: string,
    params: HighlightParams,
    meta?: {
      videoId?: number | null;
      sourceOriginalFilename?: string;
      durationSec?: number | null;
    },
  ) => {
    const trimmedVideoUrl = videoUrl.trim();
    if (!trimmedVideoUrl) {
      throw new Error("Thiếu URL video gốc để tạo highlight.");
    }

    await processHighlightLink.mutateAsync({
      videoUrl: trimmedVideoUrl,
      videoId: meta?.videoId,
      userId: resolveUserId(user?.id),
      sourceOriginalFilename: meta?.sourceOriginalFilename,
      topic: params.topic,
      includeKeywords: formatKeywords(params.includeKeywords),
      excludeKeywords: formatKeywords(params.excludeKeywords),
      isMultiOutput: params.isMultiOutput,
      isOpenAI: params.isOpenAI,
      durationSec: meta?.durationSec,
      keepRanges: params.keepRanges,
      removeRanges: params.removeRanges,
    });
  };

  /**
   * Upload-only phase (ADR 0002). Called as soon as the user confirms their
   * file — well before the highlight params form is submitted — so a
   * `videoId` is available while that form is still open (needed by the
   * segment selection picker to check for/start a transcript).
   */
  const startFileUpload = async (fileToUpload: File): Promise<void> => {
    if (fileToUpload.size > BUNNY_MAX_UPLOAD_BYTES) {
      toast.error(`File quá lớn. Kích thước tối đa: ${BUNNY_MAX_UPLOAD_LABEL}`);
      return;
    }

    const generation = ++uploadGenerationRef.current;

    updateState({
      file: fileToUpload,
      source: "file",
      progress: 0,
      status: "uploading",
      clips: [],
      jobId: null,
      bunnyVideoId: null,
      sourceVideoId: null,
      sourceVideoUrl: null,
      createdProjectId: null,
      error: null,
      stage: "Đang tải video lên hệ thống",
      progressPercent: undefined,
    });

    const uploadPromise = uploadFileToBunny(fileToUpload, (percent) => {
      if (uploadGenerationRef.current !== generation) return;
      updateState({ progress: percent });
    });
    preUploadRef.current = { file: fileToUpload, promise: uploadPromise };

    try {
      const bunny = await uploadPromise;
      if (uploadGenerationRef.current !== generation) return;

      updateState({
        progress: null,
        status: "idle",
        bunnyVideoId: bunny.bunnyVideoId,
        sourceVideoId: bunny.videoId,
        sourceVideoUrl: bunny.videoUrl,
        stage: undefined,
      });
    } catch (error) {
      if (uploadGenerationRef.current !== generation) return;
      preUploadRef.current = null;
      setState((prev) => ({
        ...prev,
        status: "failed",
        progress: null,
        error: getUserFacingErrorMessage(
          error,
          "Không thể tải video lên hệ thống.",
        ),
      }));
    }
  };

  const startUpload = async (
    fileToUpload: File,
    params: HighlightParams,
    sourceDurationSec?: number,
  ) => {
    if (fileToUpload.size > BUNNY_MAX_UPLOAD_BYTES) {
      toast.error(`File quá lớn. Kích thước tối đa: ${BUNNY_MAX_UPLOAD_LABEL}`);
      return;
    }

    updateState({
      file: fileToUpload,
      source: "file",
      status: "pending",
      clips: [],
      jobId: null,
      createdProjectId: null,
      error: null,
      stage: "Đang gửi yêu cầu tạo highlight",
      progressPercent: 5,
      jobType: params.isMultiOutput ? "highlight-multi" : "highlight",
    });

    try {
      // Reuse the pre-upload started on file confirmation (ADR 0002) — reuses
      // its result if already done, or awaits it if still in flight. Falls
      // back to uploading inline if no matching pre-upload was ever started
      // (defensive — normally index.tsx always starts one on confirm).
      const bunny =
        preUploadRef.current?.file === fileToUpload
          ? await preUploadRef.current.promise
          : await uploadFileToBunny(fileToUpload, (percent) =>
              updateState({ progress: percent }),
            );

      updateState({
        progress: null,
        bunnyVideoId: bunny.bunnyVideoId,
        sourceVideoId: bunny.videoId,
        sourceVideoUrl: bunny.videoUrl,
      });

      await startHighlightFromUrl(bunny.videoUrl, params, {
        videoId: bunny.videoId,
        sourceOriginalFilename: fileToUpload.name,
        durationSec: await resolveDurationSec(sourceDurationSec, () =>
          getVideoDurationFromFile(fileToUpload),
        ),
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        status: "failed",
        progress: null,
        error: getUserFacingErrorMessage(
          error,
          "Không thể tải video lên hệ thống hoặc tạo highlight.",
        ),
      }));
    }
  };

  const startFromExistingVideo = async (
    videoUrl: string,
    params: HighlightParams,
    durationSec?: number,
    videoId?: number | null,
  ) => {
    updateState({
      file: null,
      source: "existing-video",
      progress: null,
      status: "pending",
      clips: [],
      jobId: null,
      bunnyVideoId: null,
      sourceVideoId: videoId ?? null,
      sourceVideoUrl: videoUrl,
      createdProjectId: null,
      error: null,
      stage: "Đang gửi yêu cầu tạo highlight",
      progressPercent: 5,
      jobType: params.isMultiOutput ? "highlight-multi" : "highlight",
    });

    try {
      await startHighlightFromUrl(videoUrl, params, {
        videoId,
        durationSec: await resolveDurationSec(durationSec, () =>
          getVideoDurationFromUrl(videoUrl),
        ),
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        status: "failed",
        error: getUserFacingErrorMessage(
          error,
          "Không thể tạo highlight từ link video này.",
        ),
      }));
    }
  };

  const setFile = (file: File | null) => {
    updateState({ file, source: file ? "file" : null });
  };

  const cancel = () => {
    uploadGenerationRef.current += 1;
    preUploadRef.current = null;
    setState(INITIAL_STATE);
  };

  const reset = () => {
    updateState({
      progress: null,
      status: "idle",
      jobId: null,
      clips: [],
      isDownloading: false,
      createdProjectId: null,
      error: null,
      stage: undefined,
      progressPercent: undefined,
      jobType: undefined,
    });
  };

  return {
    ...state,
    setFile,
    startFileUpload,
    startUpload,
    startFromExistingVideo,
    ensureProjectForClip: createOrGetProjectForClip,
    cancel,
    reset,
  };
}
