/**
 * Shared API Types
 * Common types used across all API features
 */

// ============================================================================
// JOB TYPES
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
    clips?: Array<{ name: string; url: string }>;
    [key: string]: unknown;
  };
}

export interface JobIdResponse {
  job_id: string;
  status: string;
}

// ============================================================================
// CLIP TYPES
// ============================================================================

export interface Clip {
  name: string;
  url: string;
  videoUrl?: string;
}

// ============================================================================
// POLL OPTIONS
// ============================================================================

export interface PollOptions {
  interval?: number;
  maxRetries?: number;
  onProgress?: (stage: string, progress?: number) => void;
}
