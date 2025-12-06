/**
 * API response types and utilities
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface JobStatus {
  id: string;
  status: "pending" | "processing" | "completed" | "failed" | "error";
  progress?: number;
  message?: string;
  error?: string;
  result?: unknown;
  clips?: ClipData[];
  download_url?: string;
  downloadUrl?: string;
}

export interface ClipData {
  id: string;
  url: string;
  download_url?: string;
  downloadUrl?: string;
  title?: string;
  duration?: number;
  size?: number;
}

export interface UploadResponse {
  success: boolean;
  job_id?: string;
  jobId?: string;
  message?: string;
  error?: string;
}

/**
 * Handle API errors consistently
 */
export function handleApiError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "An unexpected error occurred";
}

/**
 * Check if API response indicates success
 */
export function isApiSuccess<T>(
  response: ApiResponse<T>
): response is ApiResponse<T> & { data: T } {
  return response.success === true && response.data !== undefined;
}

/**
 * Extract job ID from upload response
 */
export function extractJobId(response: Record<string, unknown>): string | null {
  return (response.job_id as string) || (response.jobId as string) || null;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Format duration in seconds to HH:MM:SS
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  return `${minutes.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
}
