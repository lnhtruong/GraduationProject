/**
 * Generic Hooks Factory
 * Base factory for creating React Query hooks
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createKeyFactory } from "@/lib/queryKeys";
import type { createJobApi } from "./api";

// ============================================================================
// SIMPLE MUTATION HOOKS (for instant APIs like auth)
// ============================================================================

export function createMutationHooks<TData, TVariables = void>(
  feature: string,
  mutationKey: string,
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: {
    retry?: number | boolean;
    onSuccess?: (
      data: TData,
      variables: TVariables,
      queryClient: ReturnType<typeof useQueryClient>,
    ) => void;
  },
) {
  const keys = createKeyFactory(feature);

  return function useMutation_(opts?: {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: Error) => void;
  }) {
    const queryClient = useQueryClient();

    return useMutation({
      mutationKey: keys.custom(mutationKey),
      mutationFn,
      retry: options?.retry ?? 2,
      onSuccess: (data, variables) => {
        // Shared logic
        if (options?.onSuccess) {
          options.onSuccess(data, variables, queryClient);
        }
        // Custom callback
        opts?.onSuccess?.(data, variables);
      },
      onError: opts?.onError,
    });
  };
}

// ============================================================================
// JOB HOOKS FACTORY (for async job workflows)
// ============================================================================

export function createJobHooks<TParams, TStatus, TResult>(
  feature: string,
  api: ReturnType<typeof createJobApi<TParams, TStatus, TResult>>,
) {
  const keys = createKeyFactory(feature);

  /**
   * Query job status
   */
  function useJobStatus(jobId: string, enabled = true) {
    return useQuery({
      queryKey: keys.custom("jobs", "status", jobId),
      queryFn: () => api.getStatus(jobId),
      enabled: enabled && !!jobId,
    });
  }

  /**
   * Mutation to start job
   */
  function useStartJob(options?: {
    onSuccess?: (jobId: string, params: TParams) => void;
    onError?: (error: Error) => void;
  }) {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: api.startJob,
      onSuccess: (jobId, params) => {
        queryClient.invalidateQueries({
          queryKey: keys.custom("jobs", "status", jobId),
        });
        options?.onSuccess?.(jobId, params);
      },
      onError: options?.onError,
    });
  }

  return {
    keys,
    useJobStatus,
    useStartJob,
  };
}

// ============================================================================
// JOB WORKFLOW FACTORY (complete start → poll → process workflow)
// ============================================================================

export function createJobWorkflowHook<TParams, TStatus, TResult>(
  feature: string,
  api: ReturnType<typeof createJobApi<TParams, TStatus, TResult>>,
  options?: {
    /**
     * Default poll interval in milliseconds
     * @default 30000
     */
    defaultPollInterval?: number;
    /**
     * Function to determine if status is complete
     * @default (status) => status.status === 'completed' || status.status === 'failed'
     */
    isComplete?: (status: TStatus) => boolean;
    /**
     * Function to determine if status is failed
     * @default (status) => status.status === 'failed'
     */
    isFailed?: (status: TStatus) => boolean;
    /**
     * Extract error message from failed status
     * @default (status) => status.error || 'Job failed'
     */
    getErrorMessage?: (status: TStatus) => string;
    /**
     * Extract progress info from status
     * @default (status) => ({ stage: status.stage, progress: status.progress })
     */
    getProgress?: (status: TStatus) => { stage?: string; progress?: number };
  },
) {
  const keys = createKeyFactory(feature);
  const {
    defaultPollInterval = 30000,
    isComplete = (status: TStatus) =>
      (status as { status?: string }).status === "completed" ||
      (status as { status?: string }).status === "failed",
    isFailed = (status: TStatus) =>
      (status as { status?: string }).status === "failed",
    getErrorMessage = (status: TStatus) =>
      (status as { error?: string }).error || "Job failed",
    getProgress = (status: TStatus) => ({
      stage: (status as { stage?: string }).stage,
      progress: (status as { progress?: number }).progress,
    }),
  } = options || {};

  return function useWorkflow(hookOptions?: {
    onProgress?: (stage?: string, progress?: number) => void;
    onSuccess?: (result: TResult) => void;
    onError?: (error: Error) => void;
    pollInterval?: number;
  }) {
    const {
      onProgress,
      onSuccess,
      onError,
      pollInterval = defaultPollInterval,
    } = hookOptions || {};
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async (params: TParams) => {
        // Import poll here to avoid circular dependency
        const { poll } = await import("./utils/async");

        // Step 1: Start job
        const jobId = await api.startJob(params);

        // Step 2: Poll until complete
        const finalStatus = await poll<TStatus>({
          fetchFn: () => api.getStatus(jobId),
          shouldStop: isComplete,
          interval: pollInterval,
          onProgress: (data) => {
            const { stage, progress } = getProgress(data);
            if (onProgress && stage) {
              onProgress(stage, progress);
            }
            queryClient.setQueryData(
              keys.custom("jobs", "status", jobId),
              data,
            );
          },
        });

        // Step 3: Check if failed
        if (isFailed(finalStatus)) {
          throw new Error(getErrorMessage(finalStatus));
        }

        // Step 4: Process result
        const result = api.processResult
          ? await api.processResult(finalStatus)
          : ({
              jobId,
              ...(((finalStatus as { result?: unknown }).result as Record<
                string,
                unknown
              >) || {}),
            } as TResult);

        return result;
      },
      onSuccess,
      onError,
    });
  };
}

// Backward compatibility
export const createHooks = createJobHooks;
