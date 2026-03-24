/**
 * HTTP Client with Axios
 * Simplified like csdl-monhoc but with auth support
 */

import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import { API_URL } from "@/lib/env";

// ============================================================================
// AXIOS INSTANCE
// ============================================================================

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

export type NormalizedApiError = {
  status?: number;
  message: string;
  details?: unknown;
};

export function normalizeAxiosError(err: unknown): NormalizedApiError {
  if (axios.isCancel(err)) {
    throw err;
  }

  const ax = err as AxiosError<Record<string, unknown>>;
  if (ax?.response) {
    const message =
      (ax.response.data?.message as string) ??
      (ax.response.data?.error as string) ??
      ax.message ??
      "Request failed";
    return {
      status: ax.response.status,
      message,
      details: ax.response.data,
    };
  }
  return { message: (ax && ax.message) || "Network error" };
}

// ============================================================================
// HELPERS
// ============================================================================

export function withSignal(
  signal?: AbortSignal,
): Pick<AxiosRequestConfig, "signal"> {
  return { signal };
}

// ============================================================================
// TOKEN MANAGER
// ============================================================================

export const tokenManager = {
  getAccessToken: () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("accessToken");
  },
  getRefreshToken: () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("refreshToken");
  },
  setTokens: (accessToken: string, refreshToken: string) => {
    if (typeof window === "undefined") return;
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
  },
  clearTokens: () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  },
  setUser: (user: unknown) => {
    if (typeof window === "undefined") return;
    localStorage.setItem("user", JSON.stringify(user));
  },
  getUser: () => {
    if (typeof window === "undefined") return null;
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },
  clearUser: () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("user");
  },
  clearAll: () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  },
};

// ============================================================================
// INTERCEPTORS
// ============================================================================

// Request interceptor: Auto-attach token
apiClient.interceptors.request.use((config) => {
  const token = tokenManager.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: Handle 401 and refresh token
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    // KIỂM TRA: Có phải đang gọi API auth không? (login, register, forgot-password...)
    const isAuthEndpoint =
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/register") ||
      originalRequest.url?.includes("/auth/forgot-password");

    // NẾU lỗi 401 VÀ KHÔNG PHẢI đang ở endpoint Auth thì mới xử lý token hết hạn
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      const refreshToken = tokenManager.getRefreshToken();

      if (!refreshToken) {
        tokenManager.clearAll();
        if (typeof window !== "undefined") {
          window.location.href = `/signin?returnUrl=${encodeURIComponent(window.location.pathname)}`;
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(apiClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });
        const newAccessToken = response.data.accessToken;

        tokenManager.setTokens(newAccessToken, refreshToken);
        onTokenRefreshed(newAccessToken);
        isRefreshing = false;

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        tokenManager.clearAll();

        if (typeof window !== "undefined") {
          window.location.href = `/signin?returnUrl=${encodeURIComponent(window.location.pathname)}`;
        }
        return Promise.reject(refreshError);
      }
    }

    // Nếu là lỗi của /auth/login, nó sẽ chạy xuống đây và trả lỗi về cho Form hiển thị
    return Promise.reject(error);
  },
);
