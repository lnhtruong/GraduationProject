import { API_BASE_URL } from "@/config";
import { apiClient } from "./apiClient";

const URL_ENDPOINT = "/highlight-reel";

/**
 * Upload a video file (FormData) to the highlight-reel endpoint.
 * Uses a plain fetch call because this request requires multipart/form-data.
 */
export async function uploadHighlightReel(
  form: FormData
): Promise<Record<string, unknown>> {
  const url = `${API_BASE_URL}${URL_ENDPOINT}`;

  // Use fetch for uploads (do NOT set Content-Type header manually).
  try {
    const resp = await fetch(url, {
      method: "POST",
      body: form,
      mode: "cors",
      headers: {
        Accept: "application/json",
        "ngrok-skip-browser-warning": "true",
      },
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      throw new Error(`Upload failed: ${resp.status} ${text}`);
    }

    const json = (await resp.json()) as unknown;
    return json as Record<string, unknown>;
  } catch (err) {
    throw new Error(`uploadHighlightReel error: ${err}`);
  }
}

/**
 * Poll or fetch job status by id
 */
export function getJobStatus(id: string) {
  const endpoint = `/jobs/status/${id}`;
  return apiClient.get<Record<string, unknown>>(endpoint);
}

/**
 * Download the result for a job id. Returns a Response so caller can handle blob/json.
 */
export async function downloadResult(id: string): Promise<Response> {
  const url = `${API_BASE_URL}/download/${id}`;
  return fetch(url, {
    method: "GET",
    mode: "cors",
    headers: {
      Accept: "application/json",
      "ngrok-skip-browser-warning": "true",
    },
  });
}

/**
 * Download by a URL or path returned from the job result.
 * Accepts either a full URL (https://...) or a path like '/download/<id>' or an id string.
 */
export async function downloadResultByUrl(
  pathOrUrl: string
): Promise<Response> {
  let url = pathOrUrl;
  if (!/https?:\/\//i.test(pathOrUrl)) {
    // path may be '/download/<id>' or just '<id>'
    if (pathOrUrl.startsWith("/")) {
      url = `${API_BASE_URL}${pathOrUrl}`;
    } else if (pathOrUrl.startsWith("download/")) {
      url = `${API_BASE_URL}/${pathOrUrl}`;
    } else {
      url = `${API_BASE_URL}/download/${pathOrUrl}`;
    }
  }
  return fetch(url, {
    method: "GET",
    mode: "cors",
    headers: {
      Accept: "application/json",
      "ngrok-skip-browser-warning": "true",
    },
  });
}

export const urlService = {
  uploadHighlightReel,
  getJobStatus,
  downloadResult,
  downloadResultByUrl,
};
