/**
 * Upload Feature Hooks
 */

import { uploadApi } from "./upload.api";
import type { HighlightReelParams, UploadResult } from "./upload.api";
import { createHooks } from "@/features/_shared/hooks";
import { poll } from "@/features/_shared/utils/async";
import type { JobStatusResponse } from "@/features/_shared/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createKeyFactory } from "@/lib/queryKeys";

const keys = createKeyFactory("upload");

// ============================================================================
// HOOKS
// ============================================================================

const baseHooks = createHooks<
  HighlightReelParams,
  JobStatusResponse,
  UploadResult
>("upload", uploadApi);

/**
 * Complete workflow: Start → Poll → Process result
 */
export function useProcessHighlight(options?: {
  onProgress?: (stage: string, progress?: number) => void;
  onSuccess?: (result: UploadResult) => void;
  onError?: (error: Error) => void;
  pollInterval?: number;
}) {
  const {
    onProgress,
    onSuccess,
    onError,
    pollInterval = 30000,
  } = options || {};
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: HighlightReelParams) => {
      // Step 1: Start job
      const jobId = await uploadApi.startJob(params);

      // Step 2: Poll until complete
      const finalStatus = await poll<JobStatusResponse>({
        fetchFn: () => uploadApi.getStatus(jobId),
        shouldStop: (data) =>
          data.status === "completed" || data.status === "failed",
        interval: pollInterval,
        onProgress: (data) => {
          if (onProgress && data.stage) {
            onProgress(data.stage, data.progress);
          }
          queryClient.setQueryData(keys.custom("jobs", "status", jobId), data);
        },
      });

      // Step 3: Check result
      if (finalStatus.status === "failed") {
        throw new Error(finalStatus.error || "Job failed");
      }

      // Step 4: Process result
      const result = uploadApi.processResult
        ? await uploadApi.processResult(finalStatus)
        : ({ jobId, ...finalStatus.result } as UploadResult);

      return result;
    },
    onSuccess,
    onError,
  });
}

// Re-export base hooks
export const { useJobStatus, useStartJob: useUploadHighlight } = baseHooks;
