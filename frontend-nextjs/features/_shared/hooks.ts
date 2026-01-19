/**
 * Generic Hooks Factory
 * Base factory for creating React Query hooks
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createKeyFactory } from "@/lib/queryKeys";
import type { createApi } from "./api";

// ============================================================================
// HOOKS FACTORY
// ============================================================================

export function createHooks<TParams, TStatus, TResult>(
  feature: string,
  api: ReturnType<typeof createApi<TParams, TStatus, TResult>>,
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
