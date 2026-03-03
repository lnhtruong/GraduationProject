/**
 * Auth API
 * Authentication endpoints using shared patterns
 */

import { apiClient, tokenManager } from "@/lib/http";
import { createSimpleApi } from "@/features/_shared/api";
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
} from "../types";

// ============================================================================
// AUTH API
// ============================================================================

export const authApi = createSimpleApi({
  login: async (data: LoginRequest) => {
    const { data: response } = await apiClient.post<LoginResponse>(
      "/auth/login",
      data,
    );
    return response;
  },

  register: async (data: RegisterRequest) => {
    const { data: response } = await apiClient.post<RegisterResponse>(
      "/auth/register",
      data,
    );
    return response;
  },

  refreshToken: async (data: RefreshTokenRequest) => {
    const { data: response } = await apiClient.post<RefreshTokenResponse>(
      "/auth/refresh",
      data,
    );
    return response;
  },

  logout: async () => {
    const { data: response } = await apiClient.post<{ message: string }>(
      "/auth/logout",
    );
    return response;
  },

  forgotPassword: async (data: ForgotPasswordRequest) => {
    const { data: response } = await apiClient.post<ForgotPasswordResponse>(
      "/auth/forgot-password",
      data,
    );
    return response;
  },

  resetPassword: async (data: ResetPasswordRequest) => {
    const { data: response } = await apiClient.post<ResetPasswordResponse>(
      "/auth/check-otp",
      data,
    );
    return response;
  },
});

// Re-export tokenManager for convenience
export { tokenManager };
