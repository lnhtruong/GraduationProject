/**
 * Video Editor Hooks
 */

import { mascotApi, highlightApi } from "./editor.api";
import type {
  MascotParams,
  MascotResult,
  HighlightParams,
  HighlightResult,
} from "./editor.api";
import { createHooks } from "@/features/_shared/hooks";
import { poll } from "@/features/_shared/utils/async";
import type { JobStatusResponse } from "@/features/_shared/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createKeyFactory } from "@/lib/queryKeys";

const mascotKeys = createKeyFactory("mascot");
const highlightKeys = createKeyFactory("highlight");

// ============================================================================
// BASE HOOKS
// ============================================================================

const baseMascotHooks = createHooks<
  MascotParams,
  JobStatusResponse,
  MascotResult
>("mascot", mascotApi);

const baseHighlightHooks = createHooks<
  HighlightParams,
  JobStatusResponse,
  HighlightResult
>("highlight", highlightApi);

// ============================================================================
// WORKFLOW HOOKS
// ============================================================================

/**
 * Mascot workflow: Start → Poll → Process result
 */
export function useProcessMascot(options?: {
  onProgress?: (stage: string, progress?: number) => void;
  onSuccess?: (result: MascotResult) => void;
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
    mutationFn: async (params: MascotParams) => {
      const jobId = await mascotApi.startJob(params);

      const finalStatus = await poll<JobStatusResponse>({
        fetchFn: () => mascotApi.getStatus(jobId),
        shouldStop: (data) =>
          data.status === "completed" || data.status === "failed",
        interval: pollInterval,
        onProgress: (data) => {
          if (onProgress && data.stage) {
            onProgress(data.stage, data.progress);
          }
          queryClient.setQueryData(
            mascotKeys.custom("jobs", "status", jobId),
            data,
          );
        },
      });

      if (finalStatus.status === "failed") {
        throw new Error(finalStatus.error || "Job failed");
      }

      const result = mascotApi.processResult
        ? await mascotApi.processResult(finalStatus)
        : ({ jobId, ...finalStatus.result } as MascotResult);

      return result;
    },
    onSuccess,
    onError,
  });
}

/**
 * Highlight workflow: Start → Poll → Process result
 */
export function useProcessHighlight(options?: {
  onProgress?: (stage: string, progress?: number) => void;
  onSuccess?: (result: HighlightResult) => void;
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
    mutationFn: async (params: HighlightParams) => {
      const jobId = await highlightApi.startJob(params);

      const finalStatus = await poll<JobStatusResponse>({
        fetchFn: () => highlightApi.getStatus(jobId),
        shouldStop: (data) =>
          data.status === "completed" || data.status === "failed",
        interval: pollInterval,
        onProgress: (data) => {
          if (onProgress && data.stage) {
            onProgress(data.stage, data.progress);
          }
          queryClient.setQueryData(
            highlightKeys.custom("jobs", "status", jobId),
            data,
          );
        },
      });

      if (finalStatus.status === "failed") {
        throw new Error(finalStatus.error || "Job failed");
      }

      const result = highlightApi.processResult
        ? await highlightApi.processResult(finalStatus)
        : ({ jobId, ...finalStatus.result } as HighlightResult);

      return result;
    },
    onSuccess,
    onError,
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export const { useJobStatus: useMascotJobStatus, useStartJob: useAddMascot } =
  baseMascotHooks;

export const {
  useJobStatus: useHighlightJobStatus,
  useStartJob: useCreateHighlight,
} = baseHighlightHooks;

// Re-export validation utilities
export {
  calculateMaxMargins,
  validateMascotParams,
  getDefaultMascotParams,
} from "./editor.api";
