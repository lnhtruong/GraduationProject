"use client";

import { useEffect, useState } from "react";
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

export function useUpload(): UploadHookReturn {
  const [state, setState] = useState<UploadState>(INITIAL_STATE);
  const { user } = useAuth();
  const router = useRouter();
  const { mutateAsync: createProject } = useCreateProject();

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
    state.status === "processing" ||
    state.status === "failed";

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
        if (payload.jobId && payload.stage) {
          // Resolve event job id from possible locations (normalized top-level or nested)
          const eventJobId =
            (payload as any).jobId ??
            (payload as any).job_id ??
            (payload as any).data?.jobId ??
            (payload as any).data?.job_id;

          // Only update if this is for the current job
          if (
            eventJobId &&
            prev.jobId &&
            String(prev.jobId) !== String(eventJobId)
          ) {
            return prev; // Ignore events from other jobs
          }

          // Normalize stage string (trim extra whitespace that backend might include)
          const rawStage =
            typeof payload.stage === "string"
              ? payload.stage.trim()
              : String(payload.stage);

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
      // Support normalized payloads: top-level or nested `data` may hold fields
      const url = (payload as any)?.data?.url ?? (payload as any)?.url;
      const videoId =
        (payload as any)?.data?.videoId ?? (payload as any)?.videoId;
      const jobId =
        (payload as any)?.data?.job_id ??
        (payload as any)?.data?.jobId ??
        (payload as any)?.job_id ??
        (payload as any)?.jobId;

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
        const errorJobId =
          (payload as any).jobId ??
          (payload as any).job_id ??
          (payload as any).data?.jobId ??
          (payload as any).data?.job_id;
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
    if (state.status !== "completed" || state.clips.length === 0) {
      return;
    }

    const firstClip = state.clips[0];
    if (!firstClip?.url || !user?.id) {
      return;
    }

    let isMounted = true;

    const createProjectAndRedirect = async () => {
      try {
        // Auto-create project for completed clip — prefer videoId from SSE
        const resolvedVideoId = firstClip.videoId ?? null;

        const now = new Date();
        const projectName = `Highlight ${now.toLocaleDateString("vi-VN")}`;

        const createdProject = await createProject({
          session_name: projectName,
          video_id: resolvedVideoId,
        });

        if (!isMounted) return;

        const projectId = (() => {
          const record = createdProject as {
            edit_id?: number;
            id?: number;
            data?: { edit_id?: number; id?: number };
          };
          return (
            record?.edit_id ??
            record?.id ??
            record?.data?.edit_id ??
            record?.data?.id
          );
        })();
        if (projectId) {
          console.debug(
            "[useUpload] Project created, redirecting to editor:",
            projectId,
          );
          setState((prev) => ({ ...prev, createdProjectId: projectId }));
          const paramsObj: Record<string, string> = {
            edit_id: String(projectId),
            src: firstClip.url,
          };
          if (resolvedVideoId) paramsObj.video_id = String(resolvedVideoId);
          const params = new URLSearchParams(paramsObj);
          router.push(`/editor?${params.toString()}`);
        } else {
          console.warn("[useUpload] No project ID returned from create");
        }
      } catch (error) {
        console.error("[useUpload] Failed to auto-create project:", error);
        // Fail silently - user can still manually create project if needed
      }
    };

    createProjectAndRedirect();

    return () => {
      isMounted = false;
    };
  }, [state.status, state.clips, user?.id, router, createProject]);

  const ensureProjectForClip = async (
    clip: UploadState["clips"][number],
  ): Promise<{ projectId: number; videoId?: number } | null> => {
    if (!clip?.url || !user?.id) return null;

    const existingProjectId = state.createdProjectId;
    if (existingProjectId && clip.videoId) {
      return { projectId: existingProjectId, videoId: clip.videoId };
    }

    // Use videoId from clip (provided by SSE) when available. Backend should provide it.
    const resolvedVideoId = clip.videoId ?? null;

    if (existingProjectId && resolvedVideoId) {
      return { projectId: existingProjectId, videoId: resolvedVideoId };
    }

    const now = new Date();
    const projectName = `Highlight ${now.toLocaleDateString("vi-VN")}`;
    // Create project even if we couldn't resolve a videoId yet. Backend accepts null.
    const createdProject = await createProject({
      session_name: projectName,
      video_id: resolvedVideoId,
    });

    const projectId = (() => {
      const record = createdProject as {
        edit_id?: number;
        id?: number;
        data?: { edit_id?: number; id?: number };
      };
      return (
        record?.edit_id ??
        record?.id ??
        record?.data?.edit_id ??
        record?.data?.id
      );
    })();

    if (!projectId) return null;

    setState((prev) => ({ ...prev, createdProjectId: projectId }));
    return resolvedVideoId
      ? { projectId, videoId: resolvedVideoId }
      : { projectId };
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
      setTimeout(() => {
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
    setState(INITIAL_STATE);
  };

  // ============================================================================
  // RESET (for starting new upload without clearing file)
  // ============================================================================
  const reset = () => {
    console.debug("[useUpload] Resetting state");
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
