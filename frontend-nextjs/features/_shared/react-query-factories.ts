/**
 * Generic Hooks Factory
 * Base factory for creating React Query hooks
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createKeyFactory } from "@/lib/queryKeys";

type MutationCallbacks<TData, TVariables> = {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error) => void;
};

type MutationFactoryOptions<TData, TVariables> = {
  retry?: number | boolean;
  onSuccess?: (
    data: TData,
    variables: TVariables,
    queryClient: ReturnType<typeof useQueryClient>,
  ) => void;
};

// ============================================================================
// SIMPLE MUTATION HOOKS 
// ============================================================================

export function createMutationHooks<TData, TVariables = void>(
  feature: string,
  mutationKey: string,
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: MutationFactoryOptions<TData, TVariables>,
) {
  const keys = createKeyFactory(feature);

  return function useMutationHook(opts?: MutationCallbacks<TData, TVariables>) {
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
// SIMPLE QUERY HOOKS (for read-only APIs like home/newsfeed)
// ============================================================================

export function createQueryHooks<TData>(
  feature: string,
  keyParts: readonly unknown[],
  queryFn: () => Promise<TData>,
  options?: {
    staleTime?: number;
  },
) {
  const keys = createKeyFactory(feature);

  const useQueryHook = (enabled = true) => {
    return useQuery({
      queryKey: keys.custom(...keyParts),
      queryFn,
      enabled,
      staleTime: options?.staleTime,
    });
  };

  return {
    keys,
    useQuery: useQueryHook,
  };
}
