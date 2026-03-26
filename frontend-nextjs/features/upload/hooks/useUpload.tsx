"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useProcessHighlight } from "../api/upload.hooks";
import {
  createMediaUploadSocket,
  type VideoCompletedEvent,
  type VideoErrorEvent,
  type VideoProgressEvent,
} from "../api/upload.websocket";
import { tokenManager } from "@/lib/http";
import type {
  UploadState,
  UploadHookReturn,
} from "@/features/upload/types";
import type { HighlightParams } from "@/features/upload/components/HighlightParamsForm";

// ============================================================================
// INITIAL STATE
// ============================================================================

const INITIAL_STATE: UploadState = {
  file: null,
  progress: null,
  status: "idle",
  jobId: null,
  clips: [],
  isDownloading: false,
  error: null,
  stage: undefined,
  progressPercent: undefined,
};

// ============================================================================
// HOOK
// ============================================================================

function resolveUserId(
  authUserId: number | undefined,
): number | undefined {
  if (authUserId != null) return authUserId;
  const stored = tokenManager.getUser() as { id?: number } | null;
  return stored?.id;
}

export function useUpload(): UploadHookReturn {
  const [state, setState] = useState<UploadState>(INITIAL_STATE);
  const { user } = useAuth();

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
    onProgress: (stage, progress) => {
      console.log("[useUpload] Progress update:", { stage, progress });
      setState((prev) => ({
        ...prev,
        status: "processing",
        stage: stage,
        progressPercent: progress,
      }));
    },
    onSuccess: (result) => {
      console.log("[useUpload] Job completed:", result);
      setState((prev) => ({
        ...prev,
        status: "completed",
        jobId: result.jobId,
        clips: result.clips,
        isDownloading: false,
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
      console.log("🔌 WS Skip: Chưa có userId hoặc session chưa active", { userId, wsSessionActive });
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
      if (!url) return;

      setState((prev) => {
        if (prev.status === "completed") return prev;
        const name =
          url.split("/").pop()?.split("?")[0] || "highlight-output.mp4";
        return {
          ...prev,
          status: "completed",
          clips: [{ name, url }],
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
    socket.on("video:error", onVideoError);

    return () => {
      socket.off("video:progress", onVideoProgress);
      socket.off("video:completed", onVideoCompleted);
      socket.off("video:error", onVideoError);
      socket.disconnect();
    };
  }, [user?.id, wsSessionActive]);

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
        onUploadProgress: (percent) => updateState({ progress: Math.min(percent, 99) }),
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
    cancel,
    reset,
  };
}
