/**
 * Auth Hooks
 * TanStack Query hooks for authentication
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi, tokenManager } from "./auth.api";
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from "../types";
import { createKeyFactory } from "@/lib/queryKeys";

const keys = createKeyFactory("auth");

/**
 * Login mutation
 */
export function useLogin(options?: {
  onSuccess?: (data: LoginResponse) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (data) => {
      // Save tokens and user
      tokenManager.setTokens(data.accessToken, data.refreshToken);
      tokenManager.setUser(data.user);

      // Invalidate auth queries
      queryClient.invalidateQueries({ queryKey: keys.root });

      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
}

/**
 * Register mutation
 */
export function useRegister(options?: {
  onSuccess?: (data: RegisterResponse) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: (data) => {
      // Save tokens and user
      tokenManager.setTokens(data.accessToken, data.refreshToken);
      tokenManager.setUser(data.user);

      // Invalidate auth queries
      queryClient.invalidateQueries({ queryKey: keys.root });

      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
}

/**
 * Logout mutation
 */
export function useLogout(options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      // Clear tokens and user
      tokenManager.clearAll();

      // Clear all queries
      queryClient.clear();

      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
}

/**
 * Refresh token mutation
 */
export function useRefreshToken(options?: {
  onSuccess?: (accessToken: string) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: () => {
      const refreshToken = tokenManager.getRefreshToken();
      if (!refreshToken) throw new Error("No refresh token");
      return authApi.refreshToken({ refreshToken });
    },
    onSuccess: (data) => {
      // Only update access token (refresh token stays the same)
      const currentRefreshToken = tokenManager.getRefreshToken();
      if (currentRefreshToken) {
        tokenManager.setTokens(data.accessToken, currentRefreshToken);
      }
      options?.onSuccess?.(data.accessToken);
    },
    onError: options?.onError,
  });
}
