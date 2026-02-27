/**
 * HTTP Client
 * Fetch wrapper with error handling
 */

import { API_URL } from "@/lib/env";

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Helper to get auth headers
function getAuthHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  return {
    Accept: "application/json",
    "ngrok-skip-browser-warning": "true",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const apiClient = {
  async get<T>(endpoint: string, signal?: AbortSignal): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      signal,
    });

    if (!response.ok) {
      throw new ApiError(
        `GET ${endpoint} failed`,
        response.status,
        await response.text(),
      );
    }

    return response.json();
  },

  async post<T>(endpoint: string, body: FormData | object): Promise<T> {
    const isFormData = body instanceof FormData;

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        Accept: "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: isFormData ? body : JSON.stringify(body),
    });

    if (!response.ok) {
      throw new ApiError(
        `POST ${endpoint} failed`,
        response.status,
        await response.text(),
      );
    }

    return response.json();
  },

  async download(endpoint: string): Promise<Response> {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "GET",
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
    });

    if (!response.ok) {
      throw new ApiError(`Download ${endpoint} failed`, response.status);
    }

    return response;
  },
};

// Auth API Client (with Bearer token)
export const authApiClient = {
  async get<T>(endpoint: string, signal?: AbortSignal): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "GET",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = errorText;
      }
      throw new ApiError(
        errorData?.message || `GET ${endpoint} failed`,
        response.status,
        errorData,
      );
    }

    return response.json();
  },

  async post<T>(endpoint: string, body?: FormData | object): Promise<T> {
    const isFormData = body instanceof FormData;

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
      },
      body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = errorText;
      }
      throw new ApiError(
        errorData?.message || `POST ${endpoint} failed`,
        response.status,
        errorData,
      );
    }

    return response.json();
  },

  async put<T>(endpoint: string, body: FormData | object): Promise<T> {
    const isFormData = body instanceof FormData;

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "PUT",
      headers: {
        ...getAuthHeaders(),
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
      },
      body: isFormData ? body : JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = errorText;
      }
      throw new ApiError(
        errorData?.message || `PUT ${endpoint} failed`,
        response.status,
        errorData,
      );
    }

    return response.json();
  },

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = errorText;
      }
      throw new ApiError(
        errorData?.message || `DELETE ${endpoint} failed`,
        response.status,
        errorData,
      );
    }

    return response.json();
  },
};
