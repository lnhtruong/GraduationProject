/**
 * Upload Service Layer
 * Handles all upload-related API communications
 * Client-side service that communicates with Route Handlers
 */

import { httpClient } from "@/lib/client/http";
import { UploadResponse, JobStatus } from "@/lib/shared/types";

const UPLOAD_ENDPOINT = "/highlight-reel";
const JOB_STATUS_ENDPOINT = "/jobs/status";
const DOWNLOAD_ENDPOINT = "/download";

/**
 * Upload video file via Route Handler
 * @param formData - FormData containing video file
 * @returns Promise<UploadResponse> - Upload response with job ID
 */
export async function uploadVideo(formData: FormData): Promise<UploadResponse> {
  try {
    const result = await httpClient.postFormData<Record<string, unknown>>(
      UPLOAD_ENDPOINT,
      formData
    );
    return {
      success: true,
      job_id: (result.job_id as string) || (result.jobId as string),
      message: result.message as string,
    };
  } catch (error) {
    throw new Error(`Upload service error: ${error}`);
  }
}

/**
 * Poll job status via Route Handler
 * @param jobId - Job ID to check status for
 * @returns Promise<JobStatus> - Current job status
 */
export async function pollJobStatus(jobId: string): Promise<JobStatus> {
  try {
    const result = await httpClient.get<Record<string, unknown>>(
      `${JOB_STATUS_ENDPOINT}/${jobId}`
    );
    return {
      id: jobId,
      status: result.status as JobStatus["status"],
      progress: result.progress as number,
      message: result.message as string,
      error: result.error as string,
      clips: result.clips as JobStatus["clips"],
      download_url: result.download_url as string,
      downloadUrl: result.downloadUrl as string,
    };
  } catch (error) {
    throw new Error(`Job status service error: ${error}`);
  }
}

/**
 * Download processed video via Route Handler
 * @param jobId - Job ID or clip ID
 * @returns Promise<Response> - Download response
 */
export async function downloadVideo(jobId: string): Promise<Response> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  return fetch(`${baseUrl}${DOWNLOAD_ENDPOINT}/${jobId}`, {
    method: "GET",
  });
}

/**
 * Download video by URL or path
 * @param pathOrUrl - URL or path to download
 * @returns Promise<Response> - Download response
 */
export async function downloadVideoByUrl(pathOrUrl: string): Promise<Response> {
  let url = pathOrUrl;

  if (!/https?:\/\//i.test(pathOrUrl)) {
    if (pathOrUrl.startsWith("/api/")) {
      url = pathOrUrl;
    } else if (pathOrUrl.startsWith("/download/")) {
      url = `/api${pathOrUrl}`;
    } else if (pathOrUrl.startsWith("download/")) {
      url = `/api/${pathOrUrl}`;
    } else {
      url = `/api${DOWNLOAD_ENDPOINT}/${pathOrUrl}`;
    }
  }

  return fetch(url, { method: "GET" });
}

// Export service object for convenient usage
export const uploadService = {
  uploadVideo,
  pollJobStatus,
  downloadVideo,
  downloadVideoByUrl,
};
