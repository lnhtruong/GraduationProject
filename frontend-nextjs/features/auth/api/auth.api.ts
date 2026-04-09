import { createApi } from "@/features/_shared/api-factories";
import { authClient } from "./auth-client";
import { initializeAuth } from "./auth-bootstrap";
import { clearAuthSession, syncAuthSession } from "@/lib/auth-session";
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  RefreshTokenResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
} from "../types";

// ============================================================================
// AUTH API
// ============================================================================

export const authApi = createApi({
  login: async (data: LoginRequest) => {
    const { data: response } = await authClient.post<LoginResponse>(
      "/login",
      data,
    );

    syncAuthSession({
      accessToken: response.accessToken,
      user: response.user,
    });

    return response;
  },

  register: async (data: RegisterRequest) => {
    const { data: response } = await authClient.post<RegisterResponse>(
      "/register",
      data,
    );

    if (response.accessToken) {
      syncAuthSession({
        accessToken: response.accessToken,
        user: response.user,
      });
    }

    return response;
  },

  refreshToken: async () => {
    const { data: response } = await authClient.post<RefreshTokenResponse>(
      "/refresh",
      undefined,
    );

    syncAuthSession({ accessToken: response.accessToken });

    return response;
  },

  logout: async () => {
    try {
      const { data: response } = await authClient.post<{ message: string }>(
        "/logout",
        undefined,
      );
      return response;
    } finally {
      clearAuthSession();
    }
  },

  forgotPassword: async (data: ForgotPasswordRequest) => {
    const { data: response } = await authClient.post<ForgotPasswordResponse>(
      "/forgot-password",
      data,
    );
    return response;
  },

  resetPassword: async (data: ResetPasswordRequest) => {
    const { data: response } = await authClient.post<ResetPasswordResponse>(
      "/check-otp",
      data,
    );
    return response;
  },

  validateToken: async (token: string) => {
    const { data: response } = await authClient.post<{
      valid: boolean;
      payload?: { userId: number; email: string; role: number };
      reason?: string;
    }>("/validate", { token });

    return response;
  },

  initializeAuth,
});
