/**
 * Auth Hooks
 * TanStack Query hooks for authentication using shared patterns
 */

import { createMutationHooks } from "@/features/_shared/hooks";
import { authApi, tokenManager } from "./auth.api";
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
} from "../types";
import { createKeyFactory } from "@/lib/queryKeys";

const keys = createKeyFactory("auth");

// ============================================================================
// LOGIN
// ============================================================================

const useLoginBase = createMutationHooks<LoginResponse, LoginRequest>(
  "auth",
  "login",
  authApi.login,
  {
    retry: false,
    onSuccess: (data, _variables, queryClient) => {
      // Save tokens and user
      tokenManager.setTokens(data.accessToken, data.refreshToken);
      tokenManager.setUser(data.user);
      // Invalidate auth queries
      queryClient.invalidateQueries({ queryKey: keys.root });
    },
  },
);

export function useLogin(options?: {
  onSuccess?: (data: LoginResponse) => void;
  onError?: (error: Error) => void;
}) {
  return useLoginBase(options);
}

// ============================================================================
// REGISTER
// ============================================================================

const useRegisterBase = createMutationHooks<RegisterResponse, RegisterRequest>(
  "auth",
  "register",
  authApi.register,
  {
    retry: false,
    onSuccess: (data, _variables, queryClient) => {
      // Only save tokens if backend returns them (current backend doesn't)
      if (data.accessToken && data.refreshToken) {
        tokenManager.setTokens(data.accessToken, data.refreshToken);
        tokenManager.setUser(data.user);
        queryClient.invalidateQueries({ queryKey: keys.root });
      }
    },
  },
);

export function useRegister(options?: {
  onSuccess?: (data: RegisterResponse) => void;
  onError?: (error: Error) => void;
}) {
  return useRegisterBase(options);
}

// ============================================================================
// LOGOUT
// ============================================================================

const useLogoutBase = createMutationHooks<{ message: string }, void>(
  "auth",
  "logout",
  authApi.logout,
  {
    retry: false,
    onSuccess: (_data, _variables, queryClient) => {
      // Clear tokens and user
      tokenManager.clearAll();
      // Clear all queries
      queryClient.clear();
    },
  },
);

export function useLogout(options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) {
  return useLogoutBase(options);
}

// ============================================================================
// FORGOT PASSWORD
// ============================================================================

const useForgotPasswordBase = createMutationHooks<
  ForgotPasswordResponse,
  ForgotPasswordRequest
>("auth", "forgot-password", authApi.forgotPassword, {
  retry: false,
});

export function useForgotPassword(options?: {
  onSuccess?: (data: ForgotPasswordResponse) => void;
  onError?: (error: Error) => void;
}) {
  return useForgotPasswordBase(options);
}

// ============================================================================
// RESET PASSWORD
// ============================================================================

const useResetPasswordBase = createMutationHooks<
  ResetPasswordResponse,
  ResetPasswordRequest
>("auth", "reset-password", authApi.resetPassword, {
  retry: false,
  onSuccess: (_data, _variables, queryClient) => {
    // Clear tokens in case user was logged in
    tokenManager.clearAll();
    // Clear all queries
    queryClient.clear();
  },
});

export function useResetPassword(options?: {
  onSuccess?: (data: ResetPasswordResponse) => void;
  onError?: (error: Error) => void;
}) {
  return useResetPasswordBase(options);
}
