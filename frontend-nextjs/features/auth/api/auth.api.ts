import { apiHttpClient, createApi } from "@/features/_shared/api-factories";
import { authClient } from "./auth-client";
import { initializeAuth } from "./auth-bootstrap";
import { clearAuthSession, syncAuthSession } from "@/lib/auth-session";
import type {
  LoginRequest,
  LoginResponse,
  GoogleLoginRequest,
  GoogleLoginResponse,
  RegisterRequest,
  RegisterResponse,
  RefreshTokenResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  User,
} from "../types";

function readNullableString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function normalizeAuthUser(raw: unknown): User {
  const source = (raw ?? {}) as Record<string, unknown>;

  return {
    id: Number(source.id ?? source.userId ?? 0),
    email: typeof source.email === "string" ? source.email : "",
    role: Number(source.role ?? 0),
    firstName:
      readNullableString(source.firstName) ??
      readNullableString(source.first_name),
    lastName:
      readNullableString(source.lastName) ??
      readNullableString(source.last_name),
    avatarUrl:
      readNullableString(source.avatarUrl) ??
      readNullableString(source.avatar_url),
  };
}

// ============================================================================
// AUTH API
// ============================================================================

export const authApi = createApi({
  login: async (data: LoginRequest) => {
    const { data: response } = await authClient.post<LoginResponse>(
      "/login",
      data,
    );

    const normalizedUser = normalizeAuthUser(response.user);

    syncAuthSession({
      accessToken: response.accessToken,
      user: normalizedUser,
    });

    return {
      ...response,
      user: normalizedUser,
    };
  },

  googleLogin: async (data: GoogleLoginRequest) => {
    const { data: response } = await authClient.post<GoogleLoginResponse>(
      "/google",
      data,
    );

    const normalizedUser = normalizeAuthUser(response.user);

    syncAuthSession({
      accessToken: response.accessToken,
      user: normalizedUser,
    });

    return {
      ...response,
      user: normalizedUser,
    };
  },

  register: async (data: RegisterRequest) => {
    const { data: response } = await authClient.post<RegisterResponse>(
      "/register",
      data,
    );

    const normalizedUser = normalizeAuthUser(response.user);

    if (response.accessToken) {
      syncAuthSession({
        accessToken: response.accessToken,
        user: normalizedUser,
      });
    }

    return {
      ...response,
      user: normalizedUser,
    };
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
      const { data } = await apiHttpClient.post<{ message: string }>(
        "/auth/logout",
        undefined,
        {
          withCredentials: true,
        },
      );

      return data;
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
