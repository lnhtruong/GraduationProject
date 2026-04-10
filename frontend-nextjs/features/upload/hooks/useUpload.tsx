"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useProcessHighlight } from "../api/upload.hooks";
import {
  createMediaUploadSocket,
  type VideoCompletedEvent,
  type VideoErrorEvent,
  type VideoProgressEvent,
} from "../api/upload.websocket";
import { useCreateProject } from "@/features/project/api/project.hooks";
import { useVideosByUser } from "@/features/video/api/video.hooks";
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
  const highlightVideosQuery = useVideosByUser("highlight", true);

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

  const wsSessionActive =
    state.status === "uploading" ||
    state.status === "pending" ||
    state.status === "processing" ||
    state.status === "failed"; // Thêm "failed" vào đây để socket không bị ngắt khi gặp lỗi 503;

  // Real-time events via API Gateway → media service (namespace /media)
  useEffect(() => {
    const userId = resolveUserId(user?.id);
    //DEBUG ws
    if (!userId || !wsSessionActive) {
      console.log("🔌 WS Skip: Chưa có userId hoặc session chưa active", {
        userId,
        wsSessionActive,
      });
      return;
    }
    console.log("🔌 WS Attempting connection for User:", userId);
    const socket = createMediaUploadSocket(userId);

    const onVideoProgress = (data: VideoProgressEvent) => {
      setState((prev) => {
        if (prev.status === "completed" || prev.status === "failed") {
          return prev;
        }
        return {
          ...prev,
          status: "processing",
          progressPercent: data.progress,
          stage: `Đang xử lý (video #${data.videoId})`,
        };
      });
    };

    const onVideoCompleted = (payload: VideoCompletedEvent) => {
      const url = payload?.data?.url;
      const videoId = payload?.data?.id;
      if (!url) return;

      setState((prev) => {
        if (prev.status === "completed") return prev;
        const name =
          url.split("/").pop()?.split("?")[0] || "highlight-output.mp4";
        return {
          ...prev,
          status: "completed",
          clips: [{ name, url, videoId }],
          isDownloading: false,
          progress: null,
        };
      });
    };

    const onVideoError = (payload: VideoErrorEvent) => {
      setState((prev) => {
        if (prev.status === "completed") return prev;
        return {
          ...prev,
          status: "failed",
          error: payload.error?.message ?? "Lỗi xử lý video",
          progress: null,
        };
      });
    };

    socket.on("video:progress", onVideoProgress);
    socket.on("video:completed", onVideoCompleted);
    socket.on("upload-video :completed", onVideoCompleted);
    socket.on("video:error", onVideoError);

    return () => {
      socket.off("video:progress", onVideoProgress);
      socket.off("video:completed", onVideoCompleted);
      socket.off("upload-video :completed", onVideoCompleted);
      socket.off("video:error", onVideoError);
      socket.disconnect();
    };
  }, [user?.id, wsSessionActive]);

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
        console.log("[useUpload] Auto-creating project for highlight:", {
          videoUrl: firstClip.url,
          videoId: firstClip.videoId,
        });

        const normalizeUrl = (value?: string) => {
          if (!value) return "";
          try {
            const parsed = new URL(value);
            return `${parsed.origin}${parsed.pathname}`;
          } catch {
            return value;
          }
        };

        const resolveVideoIdByUrl = async (url: string) => {
          const targetUrl = normalizeUrl(url);

          for (let attempt = 0; attempt < 10; attempt++) {
            const videos = highlightVideosQuery.data ?? [];
            const matched = videos.find(
              (video) => normalizeUrl(video.url) === targetUrl,
            );
            const videoId = matched?.id;
            if (videoId) {
              return videoId;
            }
            await highlightVideosQuery.refetch();
            await new Promise((resolve) => setTimeout(resolve, 500));
          }

          return undefined;
        };

        const resolvedVideoId =
          firstClip.videoId ?? (await resolveVideoIdByUrl(firstClip.url));

        if (!resolvedVideoId) {
          console.warn(
            "[useUpload] Cannot resolve videoId by URL, skipping project creation to avoid empty project.",
          );
          return;
        }

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
          console.log(
            "[useUpload] Project created, redirecting to editor:",
            projectId,
          );
          setState((prev) => ({ ...prev, createdProjectId: projectId }));
          const params = new URLSearchParams({
            edit_id: String(projectId),
            src: firstClip.url,
            video_id: String(resolvedVideoId),
          });
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
  ): Promise<{ projectId: number; videoId: number } | null> => {
    if (!clip?.url || !user?.id) return null;

    const existingProjectId = state.createdProjectId;
    if (existingProjectId && clip.videoId) {
      return { projectId: existingProjectId, videoId: clip.videoId };
    }

    const normalizeUrl = (value?: string) => {
      if (!value) return "";
      try {
        const parsed = new URL(value);
        return `${parsed.origin}${parsed.pathname}`;
      } catch {
        return value;
      }
    };

    const findVideoIdByUrl = async (url: string) => {
      const targetUrl = normalizeUrl(url);

      for (let attempt = 0; attempt < 10; attempt++) {
        const videos = highlightVideosQuery.data ?? [];
        const matched = videos.find(
          (video) => normalizeUrl(video.url) === targetUrl,
        );
        const videoId = matched?.id;
        if (videoId) return videoId;
        await highlightVideosQuery.refetch();
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      return undefined;
    };

    const resolvedVideoId = clip.videoId ?? (await findVideoIdByUrl(clip.url));
    if (!resolvedVideoId) return null;

    if (existingProjectId) {
      return { projectId: existingProjectId, videoId: resolvedVideoId };
    }

    const now = new Date();
    const projectName = `Highlight ${now.toLocaleDateString("vi-VN")}`;
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
    return { projectId, videoId: resolvedVideoId };
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
    console.log("[useUpload] Starting upload workflow with params:", params);

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
    console.log("[useUpload] Canceling upload");
    setState(INITIAL_STATE);
  };

  // ============================================================================
  // RESET (for starting new upload without clearing file)
  // ============================================================================
  const reset = () => {
    console.log("[useUpload] Resetting state");
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
