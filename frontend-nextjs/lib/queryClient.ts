/**
 * Query Client Configuration
 */

import { QueryClient } from "@tanstack/react-query";

function getErrorStatus(error: unknown) {
  if (!error || typeof error !== "object") return undefined;
  const response = "response" in error ? error.response : undefined;
  if (response && typeof response === "object" && "status" in response) {
    const status = response.status;
    if (typeof status === "number") return status;
  }
  if ("status" in error && typeof error.status === "number") {
    return error.status;
  }
  return undefined;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        const status = getErrorStatus(error);
        if (status && status >= 400 && status < 500) return false;
        return failureCount < 2;
      },
      staleTime: 10_000, // 10 seconds
      gcTime: 5 * 60_000, // 5 minutes
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
