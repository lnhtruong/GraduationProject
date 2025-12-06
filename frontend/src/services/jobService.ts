import { API_BASE_URL } from "@/config";
import { apiClient } from "./apiClient";

// ============================================================================
// TYPES
// ============================================================================

export type JobStatus = "pending" | "processing" | "completed" | "failed";

export interface JobStatusResponse {
  status: JobStatus;
  stage?: string;
  progress?: number;
  error?: string;
  result?: {
    download_url?: string;
    output_filename?: string;
    url?: string;
    clips?: Array<{ name: string; url: string } | string>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface PollOptions {
  onProgress?: (stage: string, progress?: number) => void;
  maxRetries?: number;
  pollInterval?: number;
}

// ============================================================================
// LOGGING UTILITY
// ============================================================================

const log = {
  info: (message: string, data?: unknown) => {
    console.log(`[JobService] ${message}`, data || "");
  },
  error: (message: string, error?: unknown) => {
    console.error(`[JobService ERROR] ${message}`, error || "");
  },
  warn: (message: string, data?: unknown) => {
    console.warn(`[JobService WARNING] ${message}`, data || "");
  },
};

// ============================================================================
// CORE JOB STATUS POLLING
// ============================================================================

/**
 * Poll job status until completed or failed
 * @param jobId - Job ID to poll
 * @param options - Polling options
 * @returns Final job status response
 */
export async function pollJobStatus(
  jobId: string,
  options: PollOptions = {}
): Promise<JobStatusResponse> {
  const {
    onProgress,
    maxRetries = 3,
    pollInterval = 2000, // 2 seconds default
  } = options;

  const endpoint = `/jobs/status/${jobId}`;
  let pollCount = 0;
  let consecutiveErrors = 0;

  log.info("Starting job status polling", { jobId, maxRetries, pollInterval });

  while (true) {
    pollCount++;

    try {
      log.info(`Polling attempt #${pollCount}`, { jobId });

      const data = await apiClient.get<JobStatusResponse>(endpoint);

      consecutiveErrors = 0; // Reset error counter on success

      log.info("Job status received", {
        pollCount,
        status: data.status,
        stage: data.stage,
        progress: data.progress,
      });

      // Update progress callback
      if (onProgress && data.stage) {
        onProgress(data.stage, data.progress);
        log.info("Progress callback fired", {
          stage: data.stage,
          progress: data.progress,
        });
      }

      // Check if completed
      if (data.status === "completed") {
        log.info("Job completed successfully", { jobId, result: data.result });
        return data;
      }

      // Check if failed
      if (data.status === "failed") {
        const errorMsg = data.error || "Job failed";
        log.error("Job failed", { jobId, error: errorMsg });
        throw new Error(errorMsg);
      }

      // Wait before next poll
      log.info(`Waiting ${pollInterval}ms before next poll...`);
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    } catch (err: unknown) {
      consecutiveErrors++;

      const errorMessage = err instanceof Error ? err.message : String(err);
      log.error(`Poll error (attempt ${consecutiveErrors}/${maxRetries})`, {
        jobId,
        error: errorMessage,
      });

      // If we've hit max retries, throw the error
      if (consecutiveErrors >= maxRetries) {
        log.error("Max retries reached, giving up", {
          jobId,
          consecutiveErrors,
        });
        throw new Error(
          `Failed to get job status after ${maxRetries} retries: ${errorMessage}`
        );
      }

      // Exponential backoff on error
      const backoffTime = pollInterval * Math.pow(2, consecutiveErrors - 1);
      log.warn(`Retrying after ${backoffTime}ms...`, { consecutiveErrors });
      await new Promise((resolve) => setTimeout(resolve, backoffTime));
    }
  }
}

// ============================================================================
// DOWNLOAD UTILITIES
// ============================================================================

/**
 * Download job result by job ID
 * @param jobId - Job ID
 * @returns Response object
 */
export async function downloadJobResult(jobId: string): Promise<Response> {
  const url = `${API_BASE_URL}/download/${jobId}`;

  log.info("Starting download by job ID", { jobId, url });

  try {
    const response = await fetch(url, {
      method: "GET",
      mode: "cors",
      headers: {
        Accept: "application/json",
        "ngrok-skip-browser-warning": "true",
      },
    });

    log.info("Download response received", {
      status: response.status,
      contentType: response.headers.get("content-type"),
      contentLength: response.headers.get("content-length"),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      log.error("Download failed", { status: response.status, text });
      throw new Error(`Download failed: ${response.status} ${text}`);
    }

    return response;
  } catch (err) {
    log.error("Download error", err);
    throw err;
  }
}

/**
 * Download job result by URL or path
 * @param pathOrUrl - Full URL or path like '/download/123' or just '123'
 * @returns Response object
 */
export async function downloadJobResultByUrl(
  pathOrUrl: string
): Promise<Response> {
  let url = pathOrUrl;

  // Normalize URL
  if (!/https?:\/\//i.test(pathOrUrl)) {
    if (pathOrUrl.startsWith("/")) {
      url = `${API_BASE_URL}${pathOrUrl}`;
    } else if (pathOrUrl.startsWith("download/")) {
      url = `${API_BASE_URL}/${pathOrUrl}`;
    } else {
      url = `${API_BASE_URL}/download/${pathOrUrl}`;
    }
  }

  log.info("Starting download by URL", { pathOrUrl, normalizedUrl: url });

  try {
    const response = await fetch(url, {
      method: "GET",
      mode: "cors",
      headers: {
        Accept: "application/json",
        "ngrok-skip-browser-warning": "true",
      },
    });

    log.info("Download response received", {
      status: response.status,
      contentType: response.headers.get("content-type"),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      log.error("Download failed", { status: response.status, text });
      throw new Error(`Download failed: ${response.status} ${text}`);
    }

    return response;
  } catch (err) {
    log.error("Download error", err);
    throw err;
  }
}

/**
 * Create blob URL from Response
 * @param response - Fetch Response
 * @returns Blob URL
 */
export async function createBlobUrlFromResponse(
  response: Response
): Promise<string> {
  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);

  log.info("Blob URL created", {
    blobSize: blob.size,
    blobType: blob.type,
    blobUrl,
  });

  return blobUrl;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract download URL from job result
 * @param result - Job result object
 * @returns Download URL or null
 */
export function extractDownloadUrl(
  result: JobStatusResponse["result"]
): string | null {
  if (!result) return null;

  return (
    result.download_url ||
    result.output_filename ||
    result.url ||
    null
  );
}

/**
 * Parse clips from job result
 * @param result - Job result object
 * @returns Array of clips with name and url
 */
export function parseClipsFromResult(
  result: JobStatusResponse["result"]
): Array<{ name: string; url: string }> {
  if (!result) return [];

  const clips = result.clips;
  if (!Array.isArray(clips)) return [];

  return clips.map((clip, index) => {
    if (typeof clip === "string") {
      return { name: `clip-${index + 1}`, url: clip };
    }
    if (typeof clip === "object" && clip !== null) {
      return {
        name: clip.name || `clip-${index + 1}`,
        url: clip.url || String(clip),
      };
    }
    return { name: `clip-${index + 1}`, url: String(clip) };
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export const jobService = {
  pollJobStatus,
  downloadJobResult,
  downloadJobResultByUrl,
  createBlobUrlFromResponse,
  extractDownloadUrl,
  parseClipsFromResult,
};