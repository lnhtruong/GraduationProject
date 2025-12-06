import { useRef, useState } from "react";
import { highlightService } from "@/services/highlightService";
import { jobService } from "@/services/jobService";
import type { Clip, UploadState, UploadHookReturn } from "@/features/upload/types";

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
};

// ============================================================================
// HOOK
// ============================================================================

export function useUpload(): UploadHookReturn {
  const [state, setState] = useState<UploadState>(INITIAL_STATE);
  const stopPollingRef = useRef<(() => void) | null>(null);

  // ============================================================================
  // HELPER: Update state
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
  const startUpload = async (fileToUpload: File) => {
    console.log("[useUpload] Starting upload workflow");

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
      // Step 1: Upload file
      console.log("[useUpload] Step 1: Uploading file...");
      updateState({ progress: 50 });

      const jobId = await highlightService.uploadHighlightReel({
        file: fileToUpload,
      });

      console.log("[useUpload] Upload completed, jobId:", jobId);
      updateState({
        jobId,
        progress: 100,
        status: "pending",
      });

      // Wait a bit then hide progress bar
      setTimeout(() => {
        updateState({ progress: null });
      }, 500);

      // Step 2: Start polling
      console.log("[useUpload] Step 2: Starting polling...");
      await pollJobStatus(jobId);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Upload failed";
      console.error("[useUpload] Upload error:", errorMessage);
      updateState({
        status: "failed",
        error: errorMessage,
        progress: null,
      });
    }
  };

  // ============================================================================
  // POLL JOB STATUS
  // ============================================================================
  const pollJobStatus = async (jobId: string) => {
    let stopped = false;
    const pollInterval = 2000; // 2 seconds

    // Create stop function
    stopPollingRef.current = () => {
      stopped = true;
      console.log("[useUpload] Polling stopped by user");
    };

    console.log("[useUpload] Starting status polling");

    const interval = setInterval(async () => {
      if (stopped) {
        clearInterval(interval);
        return;
      }

      try {
        const result = await jobService.pollJobStatus(jobId, {
          onProgress: (stage, progress) => {
            console.log("[useUpload] Progress update:", { stage, progress });
            updateState({ status: "processing" });
          },
          maxRetries: 1, // Only 1 retry per poll, we'll handle retries in the loop
          pollInterval: 0, // We're handling interval manually
        });

        // Update status
        updateState({ status: result.status });

        // Handle completion
        if (result.status === "completed") {
          stopped = true;
          clearInterval(interval);
          console.log("[useUpload] Job completed, downloading result...");

          // Download result
          await downloadResult(jobId, result);
        }

        // Handle failure
        if (result.status === "failed") {
          stopped = true;
          clearInterval(interval);
          const errorMsg = result.error || "Processing failed";
          console.error("[useUpload] Job failed:", errorMsg);
          updateState({
            status: "failed",
            error: errorMsg,
          });
        }

      } catch (err) {
        console.error("[useUpload] Polling error (will retry):", err);
        // Don't stop polling on transient errors
      }
    }, pollInterval);
  };

  // ============================================================================
  // DOWNLOAD RESULT
  // ============================================================================
  const downloadResult = async (
    jobId: string,
    jobResult: Awaited<ReturnType<typeof jobService.pollJobStatus>>
  ) => {
    updateState({ isDownloading: true });

    try {
      console.log("[useUpload] Downloading result...");

      // Try to get download URL from result
      const downloadUrl = jobService.extractDownloadUrl(jobResult.result);

      let response: Response;
      if (downloadUrl) {
        console.log("[useUpload] Using download URL from result:", downloadUrl);
        response = await jobService.downloadJobResultByUrl(downloadUrl);
      } else {
        console.log("[useUpload] Using job ID for download:", jobId);
        response = await jobService.downloadJobResult(jobId);
      }

      // Parse response
      const clips = await parseDownloadResponse(response, jobId);

      console.log("[useUpload] Download completed, clips:", clips);
      updateState({
        clips,
        isDownloading: false,
        status: "completed",
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Download failed";
      console.error("[useUpload] Download error:", errorMessage);
      updateState({
        isDownloading: false,
        error: errorMessage,
      });
    }
  };

  // ============================================================================
  // PARSE DOWNLOAD RESPONSE
  // ============================================================================
  const parseDownloadResponse = async (
    response: Response,
    fallbackName: string
  ): Promise<Clip[]> => {
    const contentType = response.headers.get("content-type") || "";

    // Handle JSON response (clips metadata)
    if (contentType.includes("application/json")) {
      const data = await response.json();

      // Check for clips array
      if (data.clips && Array.isArray(data.clips)) {
        return jobService.parseClipsFromResult({ clips: data.clips });
      }

      // Check if response itself is an array
      if (Array.isArray(data)) {
        return jobService.parseClipsFromResult({ clips: data });
      }

      // If JSON has a download URL, fetch that
      if (data.download_url) {
        const binaryResponse = await jobService.downloadJobResultByUrl(data.download_url);
        return parseDownloadResponse(binaryResponse, fallbackName);
      }
    }

    // Handle binary response (video/zip file)
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    // Determine file name and extension
    let fileName = fallbackName;
    if (contentType.includes("zip") || blob.type.includes("zip")) {
      fileName = `${fallbackName}.zip`;
    } else if (blob.type.startsWith("video/")) {
      fileName = state.file?.name || `${fallbackName}.mp4`;
    }

    console.log("[useUpload] Created blob URL:", { fileName, blobUrl, size: blob.size });

    return [{ name: fileName, url: blobUrl }];
  };

  // ============================================================================
  // CANCEL
  // ============================================================================
  const cancel = () => {
    console.log("[useUpload] Canceling upload");

    // Stop polling
    if (stopPollingRef.current) {
      stopPollingRef.current();
      stopPollingRef.current = null;
    }

    // Reset state
    setState(INITIAL_STATE);
  };

  // ============================================================================
  // RESET (for starting new upload without clearing file)
  // ============================================================================
  const reset = () => {
    console.log("[useUpload] Resetting state");

    // Stop polling
    if (stopPollingRef.current) {
      stopPollingRef.current();
      stopPollingRef.current = null;
    }

    // Reset but keep file
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

export default useUpload;