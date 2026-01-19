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
