import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
} from "axios";
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
let refreshSubscribers: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const subscribeTokenRefresh = (
  resolve: (token: string) => void,
  reject: (error: unknown) => void,
) => {
  refreshSubscribers.push({ resolve, reject });
};

const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach((subscriber) => subscriber.resolve(token));
  refreshSubscribers = [];
};

const onTokenRefreshFailed = (error: unknown) => {
  refreshSubscribers.forEach((subscriber) => subscriber.reject(error));
  refreshSubscribers = [];
};

async function refreshAccessToken() {
  const response = await axios.post(`${API_URL}/auth/refresh`, undefined, {
    withCredentials: true,
    headers: {
      Accept: "application/json",
      "ngrok-skip-browser-warning": "true",
    },
  });

  const newAccessToken = (response.data as { accessToken?: string }).accessToken;
  if (!newAccessToken) {
    throw new Error("Missing access token from refresh response");
  }

  authStorageHelper.setAccessToken(newAccessToken);
  onTokenRefreshed(newAccessToken);
  return newAccessToken;
}

function attachRefreshInterceptor(client: AxiosInstance) {
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as (AxiosRequestConfig & {
        _retry?: boolean;
      }) | null;

      if (!originalRequest) {
        return Promise.reject(error);
      }

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
          return new Promise((resolve, reject) => {
            subscribeTokenRefresh((token: string) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              client(originalRequest).then(resolve).catch(reject);
            }, reject);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const newAccessToken = await refreshAccessToken();
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }
          return client(originalRequest);
        } catch (refreshError) {
          authStorageHelper.clearAll();
          onTokenRefreshFailed(refreshError);
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    },
  );
}

attachRefreshInterceptor(apiClient);
attachRefreshInterceptor(inferenceClient);
