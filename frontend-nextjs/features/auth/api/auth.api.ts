/**
 * Auth API
 * Authentication endpoints with retry logic
 */

import { authApiClient } from "@/lib/http";
import { retry, timeout } from "@/features/_shared/utils/async";
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  User,
} from "../types";

// ============================================================================
// API CONFIG
// ============================================================================

const AUTH_TIMEOUT = 10000; // 10s
const AUTH_RETRY_OPTIONS = {
  maxRetries: 2,
  baseDelay: 1000,
  exponentialBackoff: true,
  shouldRetry: (error: unknown, attempt: number) => {
    // Don't retry on 4xx errors (client errors)
    if (error && typeof error === "object" && "status" in error) {
      const status = (error as { status?: number }).status;
      if (status && status >= 400 && status < 500) {
        return false;
      }
    }
    return attempt <= 2;
  },
};

// ============================================================================
// AUTH API
// ============================================================================

export const authApi = {
  /**
   * Login with retry and timeout
   */
  async login(data: LoginRequest): Promise<LoginResponse> {
    return retry(
      () =>
        timeout(
          authApiClient.post<LoginResponse>("/auth/login", data),
          AUTH_TIMEOUT,
        ),
      AUTH_RETRY_OPTIONS,
    );
  },

  /**
   * Register with retry and timeout
   */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    return retry(
      () =>
        timeout(
          authApiClient.post<RegisterResponse>("/auth/register", data),
          AUTH_TIMEOUT,
        ),
      AUTH_RETRY_OPTIONS,
    );
  },

  /**
   * Refresh token with retry
   */
  async refreshToken(data: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    return retry(
      () =>
        timeout(
          authApiClient.post<RefreshTokenResponse>("/auth/refresh", data),
          AUTH_TIMEOUT,
        ),
      { ...AUTH_RETRY_OPTIONS, maxRetries: 1 }, // Less retries for refresh
    );
  },

  /**
   * Logout (no retry needed)
   */
  async logout(): Promise<{ message: string }> {
    return timeout(
      authApiClient.post<{ message: string }>("/auth/logout"),
      AUTH_TIMEOUT,
    );
  },

  /**
   * Validate token
   */
  async validateToken(token: string): Promise<{
    valid: boolean;
    payload?: {
      userId: number;
      email: string;
      role: number;
    };
    reason?: string;
  }> {
    return timeout(
      authApiClient.post("/auth/validate", { token }),
      AUTH_TIMEOUT,
    );
  },
};

/**
 * Token Manager
 * LocalStorage helpers
 */
export const tokenManager = {
  setTokens(accessToken: string, refreshToken: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
  },

  getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("accessToken");
  },

  getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("refreshToken");
  },

  clearTokens(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  },

  setUser(user: User): void {
    if (typeof window === "undefined") return;
    localStorage.setItem("user", JSON.stringify(user));
  },

  getUser(): User | null {
    if (typeof window === "undefined") return null;
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  clearUser(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem("user");
  },

  clearAll(): void {
    this.clearTokens();
    this.clearUser();
  },
};
