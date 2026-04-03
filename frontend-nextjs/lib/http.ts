import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import { API_URL } from "@/lib/env";
import { isPublicAuthRoute } from "@/lib/auth-routes";
import { authStorageHelper } from "@/store/auth";

function createBaseClient(baseURL: string) {
  const isNgrokTarget = /ngrok/i.test(baseURL);

  return axios.create({
    baseURL,
    timeout: 30000,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(isNgrokTarget ? { "ngrok-skip-browser-warning": "true" } : {}),
    },
  });
}

function attachAuthHeaderInterceptor(client: ReturnType<typeof axios.create>) {
  client.interceptors.request.use((config) => {
    const token = authStorageHelper.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
}

export const apiClient = createBaseClient(API_URL);
export const inferenceClient = createBaseClient(API_URL);

inferenceClient.defaults.withCredentials = false;

attachAuthHeaderInterceptor(apiClient);
attachAuthHeaderInterceptor(inferenceClient);
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    const isAuthEndpoint =
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/register") ||
      originalRequest.url?.includes("/auth/refresh");

    const currentPathname =
      typeof window !== "undefined" ? window.location.pathname : undefined;
    const isPublicAuthPage = isPublicAuthRoute(currentPathname);

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint &&
      !isPublicAuthPage
    ) {
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
        const response = await axios.post(
          `${API_URL}/auth/refresh`,
          undefined,
          {
            withCredentials: true,
            headers: {
              Accept: "application/json",
              "ngrok-skip-browser-warning": "true",
            },
          },
        );
        const newAccessToken = response.data.accessToken;

        authStorageHelper.setAccessToken(newAccessToken);
        onTokenRefreshed(newAccessToken);
        isRefreshing = false;

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        authStorageHelper.clearAll();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
