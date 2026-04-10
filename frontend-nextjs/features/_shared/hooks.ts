/**
 * Generic Hooks Factory
 * Base factory for creating React Query hooks
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createKeyFactory } from "@/lib/queryKeys";

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

