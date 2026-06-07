"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useProcessHighlight } from "../api/upload.hooks";
import {
  createMediaUploadStream,
  type UploadStreamSubscription,
} from "@/features/_shared/realtime/media-upload-stream";
import type {
  VideoCompletedPayload,
  VideoErrorPayload,
  VideoProgressPayload,
} from "../api/upload.websocket";
import { useCreateProject } from "@/features/project/api/project.hooks";
import { authStorageHelper } from "@/store/auth";
import type {
  UploadState,
  UploadHookReturn,
  HighlightParams,
} from "@/features/upload/types";

// ============================================================================
// INITIAL STATE
// ============================================================================

const INITIAL_STATE: UploadState = {
  file: null,
  progress: null,
  status: "idle",
  jobId: null,
  createdProjectId: null,
  clips: [],
  isDownloading: false,
  error: null,
  stage: undefined,
  progressPercent: undefined,
};

// ============================================================================
// HOOK
// ============================================================================

function resolveUserId(authUserId: number | undefined): number | undefined {
  if (authUserId != null) return authUserId;
  const stored = authStorageHelper.getUser() as { id?: number } | null;
  return stored?.id;
}

type UploadEventEnvelope = {
  jobId?: string | number;
  job_id?: string | number;
  url?: string;
  videoId?: number;
  progress?: number;
  stage?: string;
  data?: {
    jobId?: string | number;
    job_id?: string | number;
    url?: string;
    videoId?: number;
  };
};

function readEventJobId(payload: UploadEventEnvelope): string | null {
  const raw =
    payload.data?.job_id ??
    payload.data?.jobId ??
    payload.job_id ??
    payload.jobId;
  return raw == null ? null : String(raw);
}

function readCompletedEvent(
  payload: VideoCompletedPayload | UploadEventEnvelope,
): {
  url?: string;
  videoId?: number;
  jobId: string | null;
} {
  const envelope = payload as UploadEventEnvelope;
  return {
    url: envelope.data?.url ?? envelope.url,
    videoId: envelope.data?.videoId ?? envelope.videoId,
    jobId: readEventJobId(envelope),
  };
}

function resolveProjectId(response: unknown): number | null {
  if (!response || typeof response !== "object") return null;

  const record = response as {
    edit_id?: number;
    id?: number;
    data?: { edit_id?: number; id?: number };
  };

  return (
    record.edit_id ??
    record.id ??
    record.data?.edit_id ??
    record.data?.id ??
    null
  );
}

export interface UseUploadOptions {
  autoCreateProject?: boolean;
}

export function useUpload(options?: UseUploadOptions): UploadHookReturn {
  const autoCreateProject = options?.autoCreateProject ?? true;
  const [state, setState] = useState<UploadState>(INITIAL_STATE);
  const { user } = useAuth();
  const router = useRouter();
  const { mutateAsync: createProject } = useCreateProject();
  const createProjectPromiseRef = useRef<Promise<{
    projectId: number;
    videoId?: number;
  } | null> | null>(null);
  const redirectedProjectRef = useRef<number | null>(null);
  const hideProgressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // We rely on backend to include `videoId` in SSE completed events.
  // Use React Query mutation
  const processHighlight = useProcessHighlight({
    onJobStarted: (jobId) => {
      setState((prev) => ({
        ...prev,
        jobId,
        status: "pending",
        progress: null,
      }));
    },
    onError: (error) => {
      console.error("[useUpload] Job failed:", error);
      setState((prev) => ({
        ...prev,
        status: "failed",
        error: error.message,
        progress: null,
      }));
    },
  });

  const sseSessionActive =
    state.status === "uploading" ||
    state.status === "pending" ||
    state.status === "processing";

  const createOrGetProjectForClip = useCallback(
    async (
      clip: UploadState["clips"][number],
    ): Promise<{ projectId: number; videoId?: number } | null> => {
      if (!clip?.url || !resolveUserId(user?.id)) return null;

      const existingProjectId = state.createdProjectId;
      if (existingProjectId) {
        return clip.videoId
          ? { projectId: existingProjectId, videoId: clip.videoId }
          : { projectId: existingProjectId };
      }

      if (createProjectPromiseRef.current) {
        return createProjectPromiseRef.current;
      }

      const promise = (async () => {
        const resolvedVideoId = clip.videoId ?? null;
        const now = new Date();
        const projectName = `Highlight ${now.toLocaleDateString("vi-VN")}`;

        const createdProject = await createProject({
          session_name: projectName,
          video_id: resolvedVideoId,
        });

        const projectId = resolveProjectId(createdProject);
        if (!projectId) return null;

        setState((prev) => ({
          ...prev,
          createdProjectId: prev.createdProjectId ?? projectId,
        }));

        return resolvedVideoId
          ? { projectId, videoId: resolvedVideoId }
          : { projectId };
      })();

      createProjectPromiseRef.current = promise;
      try {
        return await promise;
      } finally {
        createProjectPromiseRef.current = null;
      }
    },
    [user?.id, state.createdProjectId, createProject],
  );

  // Real-time events via SSE (Server-Sent Events)
  useEffect(() => {
    const userId = resolveUserId(user?.id);
    if (!userId || !sseSessionActive) {
      return;
    }
    // Attempt SSE connection for active session

    let stream: UploadStreamSubscription | null = null;

    const onProgress = (payload: VideoProgressPayload) => {
      setState((prev) => {
        if (prev.status === "completed" || prev.status === "failed") {
          return prev;
        }

        // New format: Job stage update (has jobId, stage)
        const envelope = payload as UploadEventEnvelope;
        const eventJobId = readEventJobId(envelope);
        const eventStage =
          typeof envelope.stage === "string" ? envelope.stage : undefined;
        if (eventJobId && eventStage) {
          // Only update if this is for the current job
          if (
            eventJobId &&
            prev.jobId &&
            String(prev.jobId) !== String(eventJobId)
          ) {
            return prev; // Ignore events from other jobs
          }

          // Normalize stage string (trim extra whitespace that backend might include)
          const rawStage = eventStage.trim();

          // Try to extract X/Y from stage like "1/4: Transcribing"
          let stageProgress: number | undefined;
          const match = rawStage.match(/^(\d+)\/(\d+)\s*:\s*(.*)$/);
          if (match) {
            const step = Number(match[1]);
            const total = Number(match[2]) || 1;
            stageProgress = Math.round((step / total) * 100);
          } else if (/finaliz|upload|uploading/i.test(rawStage)) {
            // Heuristic: treat finalizing/upload steps as near-complete
            stageProgress = 95;
          }

          // update stage/progressPercent silently

          return {
            ...prev,
            status: "processing",
            stage: rawStage, // Display cleaned stage
            progressPercent: stageProgress,
          };
        }

        // Legacy format: Direct progress (has videoId, progress)
        if (payload.videoId && typeof payload.progress === "number") {
          return {
            ...prev,
            status: "processing",
            progressPercent: payload.progress,
            stage: `Uploading (${payload.progress}%)`,
          };
        }

        return prev;
      });
    };

    const onCompleted = (payload: VideoCompletedPayload) => {
      const { url, videoId, jobId } = readCompletedEvent(payload);

      if (!url) {
        console.warn("[useUpload] Completion event missing URL");
        return;
      }

      setState((prev) => {
        if (prev.status === "completed") return prev;

        // Only process if this matches the current job (or no jobId filtering needed)
        if (jobId && prev.jobId && String(prev.jobId) !== String(jobId)) {
          return prev;
        }

        const name =
          url.split("/").pop()?.split("?")[0] || "highlight-output.mp4";
        return {
          ...prev,
          status: "completed",
          clips: [{ name, url, videoId }],
          isDownloading: false,
          progress: null,
          stage: "Completed",
        };
      });
    };

    const onError = (payload: VideoErrorPayload) => {
      setState((prev) => {
        if (prev.status === "completed") return prev;

        // Check if this error is for the current job
        const errorJobId = readEventJobId(payload as UploadEventEnvelope);
        if (
          errorJobId &&
          prev.jobId &&
          String(prev.jobId) !== String(errorJobId)
        ) {
          return prev;
        }

        const errorMessage = payload.error?.message ?? "Lỗi xử lý video";

        console.error("[useUpload] Video processing failed:", errorMessage);

        return {
          ...prev,
          status: "failed",
          error: errorMessage,
          progress: null,
          stage: "Failed",
        };
      });
    };

    const onConnectionError = (error: Error) => {
      console.error("[useUpload] SSE connection error:", error);
      // Don't update state for connection errors - SSE will retry automatically
    };

    stream = createMediaUploadStream(
      { onProgress, onCompleted, onError, onConnectionError },
      { userId },
    );

    return () => stream?.close();
  }, [user?.id, sseSessionActive]);

  // ============================================================================
  // ============================================================================
  // AUTO-CREATE PROJECT AND REDIRECT WHEN VIDEO COMPLETES
  // ============================================================================
  useEffect(() => {
    if (!autoCreateProject) {
      return;
    }

    if (state.status !== "completed" || state.clips.length === 0) {
      return;
    }

    const firstClip = state.clips[0];
    if (!firstClip?.url || !resolveUserId(user?.id)) {
      return;
    }

    let isMounted = true;

    const createProjectAndRedirect = async () => {
      try {
        const result = await createOrGetProjectForClip(firstClip);

        if (!isMounted) return;
        if (!result) {
          console.warn("[useUpload] No project ID returned from create");
          return;
        }

        if (redirectedProjectRef.current === result.projectId) {
          return;
        }
        redirectedProjectRef.current = result.projectId;

        console.debug(
          "[useUpload] Project created, redirecting to editor:",
          result.projectId,
        );
        const paramsObj: Record<string, string> = {
          edit_id: String(result.projectId),
          src: firstClip.url,
        };
        if (result.videoId) paramsObj.video_id = String(result.videoId);
        const params = new URLSearchParams(paramsObj);

        router.push(`/editor?${params.toString()}`);
      } catch (error) {
        console.error("[useUpload] Failed to auto-create project:", error);
        // Fail silently - user can still manually create project if needed
      }
    };

    createProjectAndRedirect();

    return () => {
      isMounted = false;
    };
  }, [state.status, state.clips, user?.id, router, createOrGetProjectForClip]);

  const ensureProjectForClip = async (
    clip: UploadState["clips"][number],
  ): Promise<{ projectId: number; videoId?: number } | null> => {
    return createOrGetProjectForClip(clip);
  };

  // ============================================================================
  // UPDATE STATE HELPER
  // ============================================================================
  const updateState = (updates: Partial<UploadState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  // ============================================================================
  // SET FILE
  // ============================================================================
  const setFile = (file: File | null) => {
    updateState({ file });
  };

  // ============================================================================
  // START UPLOAD
  // ============================================================================
  const startUpload = async (fileToUpload: File, params: HighlightParams) => {
    console.debug("[useUpload] Starting upload workflow with params:", params);

    // Reset state
    updateState({
      file: fileToUpload,
      progress: 0,
      status: "uploading",
      clips: [],
      jobId: null,
      createdProjectId: null,
      error: null,
    });

    try {
      // Format keywords as comma-separated strings
      const includeKeywordsFormatted = params.includeKeywords.join(",");
      const excludeKeywordsFormatted = params.excludeKeywords.join(",");

      // Start processing — real upload % streamed via onUploadProgress
      await processHighlight.mutateAsync({
        file: fileToUpload,
        topic: params.topic,
        includeKeywords: includeKeywordsFormatted,
        excludeKeywords: excludeKeywordsFormatted,
        // Cap at 99%: the last 1% only "completes" when the server responds with job_id.
        // This prevents the bar being stuck at 100% while the server processes the upload.
        onUploadProgress: (percent) =>
          updateState({ progress: Math.min(percent, 99) }),
      });

      // Hide progress bar after completion
      if (hideProgressTimeoutRef.current) {
        clearTimeout(hideProgressTimeoutRef.current);
      }
      hideProgressTimeoutRef.current = setTimeout(() => {
        updateState({ progress: null });
      }, 500);
    } catch (err) {
      // Error already handled by onError callback
      console.error("[useUpload] Upload error:", err);
    }
  };

  // ============================================================================
  // CANCEL
  // ============================================================================
  const cancel = () => {
    console.debug("[useUpload] Canceling upload");
    if (hideProgressTimeoutRef.current) {
      clearTimeout(hideProgressTimeoutRef.current);
      hideProgressTimeoutRef.current = null;
    }
    setState(INITIAL_STATE);
  };

  // ============================================================================
  // RESET (for starting new upload without clearing file)
  // ============================================================================
  const reset = () => {
    console.debug("[useUpload] Resetting state");
    if (hideProgressTimeoutRef.current) {
      clearTimeout(hideProgressTimeoutRef.current);
      hideProgressTimeoutRef.current = null;
    }
    updateState({
      progress: null,
      status: "idle",
      jobId: null,
      clips: [],
      isDownloading: false,
      createdProjectId: null,
      error: null,
    });
  };

  useEffect(() => {
    return () => {
      if (hideProgressTimeoutRef.current) {
        clearTimeout(hideProgressTimeoutRef.current);
      }
    };
  }, []);

  // ============================================================================
  // RETURN
  // ============================================================================
  return {
    ...state,
    setFile,
    startUpload,
    ensureProjectForClip,
    cancel,
    reset,
  };
}
