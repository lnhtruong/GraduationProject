"use client";

import { useState } from "react";
import { useProcessHighlight } from "../api/upload.hooks";
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

export function useUpload(): UploadHookReturn {
  const [state, setState] = useState<UploadState>(INITIAL_STATE);

  // Use React Query mutation
  const processHighlight = useProcessHighlight({
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

      // Show upload progress
      updateState({ progress: 50 });

      // Start processing (React Query handles everything)
      await processHighlight.mutateAsync({
        file: fileToUpload,
        topic: params.topic,
        includeKeywords: includeKeywordsFormatted,
        excludeKeywords: excludeKeywordsFormatted,
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
