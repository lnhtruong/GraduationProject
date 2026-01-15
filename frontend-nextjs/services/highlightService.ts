import { API_BASE_URL } from "@/lib/config";
import {
  jobService,
  type JobStatusResponse,
  type PollOptions,
} from "./jobService";

// ============================================================================
// TYPES
// ============================================================================

export interface HighlightReelParams {
  file: File;
  topic?: string;
  includeKeywords?: string;
  excludeKeywords?: string;
}

export interface HighlightReelResponse {
  job_id?: string;
  jobId?: string;
  id?: string;
  data?: {
    id?: string;
    job_id?: string;
  };
  [key: string]: unknown;
}

export interface Clip {
  name: string;
  url: string;
}

// ============================================================================
// DEFAULT PARAMETERS
// ============================================================================

const DEFAULT_PARAMS = {
  topic: "Binary Tree data structures and problem-solving",
  includeKeywords:
    '"solution explanations","step-by-step problem solving","algorithm analysis","implementation details","time/space complexity discussion"',
  excludeKeywords:
    '"advertisements","course promotions","discount announcements","channel subscriptions","greetings and sign-offs","emotional filler"',
};

// ============================================================================
// CORE UPLOAD FUNCTION
// ============================================================================

/**
 * Upload video for highlight reel processing
 * @param params - Upload parameters
 * @returns Response with job ID
 */
export async function uploadHighlightReel(
  params: HighlightReelParams
): Promise<string> {
  const {
    file,
    topic = DEFAULT_PARAMS.topic,
    includeKeywords = DEFAULT_PARAMS.includeKeywords,
    excludeKeywords = DEFAULT_PARAMS.excludeKeywords,
  } = params;

  const url = `${API_BASE_URL}/highlight-reel`;

  // Create FormData
  const formData = new FormData();
  formData.append("video", file); // Backend expects "video", not "file"
  formData.append("topic", topic);
  formData.append("include_keywords", includeKeywords);
  formData.append("exclude_keywords", excludeKeywords);

  try {
    const response = await fetch(url, {
      method: "POST",
      body: formData,
      mode: "cors",
      headers: {
        Accept: "application/json",
        "ngrok-skip-browser-warning": "true",
      },
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Upload failed: ${response.status} ${text}`);
    }

    const data = (await response.json()) as HighlightReelResponse;
    const jobId = extractJobId(data);

    if (!jobId) {
      throw new Error("No job ID returned from server");
    }

    return jobId;
  } catch (err) {
    throw err;
  }
}

/**
 * Extract job ID from various response formats
 * @param response - Server response
 * @returns Job ID or null
 */
function extractJobId(response: HighlightReelResponse): string | null {
  // Check data.id or data.job_id
  if (response.data && typeof response.data === "object") {
    if (response.data.id) return response.data.id;
    if (response.data.job_id) return response.data.job_id;
  }

  // Check direct fields
  if (response.job_id) return response.job_id;
  if (response.jobId) return response.jobId;
  if (response.id) return response.id;

  return null;
}

// ============================================================================
// PROCESS AND DOWNLOAD WORKFLOW
// ============================================================================

/**
 * Complete workflow: Upload → Poll → Download
 * @param params - Upload parameters
 * @param pollOptions - Polling options
 * @returns Array of clips with blob URLs
 */
export async function processHighlightReel(
  params: HighlightReelParams,
  pollOptions?: PollOptions
): Promise<Clip[]> {
  try {
    // Step 1: Upload
    const jobId = await uploadHighlightReel(params);
    // Step 2: Poll status
    const result = await jobService.pollJobStatus(jobId, pollOptions);

    // Step 3: Download and parse clips
    const clips = await downloadAndParseClips(jobId, result);
    return clips;
  } catch (err) {
    throw err;
  }
}

/**
 * Download and parse clips from job result
 * @param jobId - Job ID
 * @param jobResult - Job status response
 * @returns Array of clips
 */
async function downloadAndParseClips(
  jobId: string,
  jobResult: JobStatusResponse
): Promise<Clip[]> {
  try {
    // Try to get download URL from result
    const downloadUrl = jobService.extractDownloadUrl(jobResult.result);

    if (downloadUrl) {
      return await downloadFromUrl(downloadUrl, jobId);
    }

    // Fallback: download by job ID
    return await downloadByJobId(jobId);
  } catch (err) {
    throw err;
  }
}

/**
 * Download clips by job ID
 * @param jobId - Job ID
 * @returns Array of clips
 */
async function downloadByJobId(jobId: string): Promise<Clip[]> {
  const response = await jobService.downloadJobResult(jobId);
  return parseDownloadResponse(response, jobId);
}

/**
 * Download clips by URL
 * @param url - Download URL
 * @param fallbackName - Fallback name if needed
 * @returns Array of clips
 */
async function downloadFromUrl(
  url: string,
  fallbackName?: string
): Promise<Clip[]> {
  const response = await jobService.downloadJobResultByUrl(url);
  return parseDownloadResponse(response, fallbackName);
}

/**
 * Parse download response into clips
 * @param response - Fetch response
 * @param fallbackName - Fallback name for clips
 * @returns Array of clips
 */
async function parseDownloadResponse(
  response: Response,
  fallbackName?: string
): Promise<Clip[]> {
  const contentType = response.headers.get("content-type") || "";

  // If JSON, parse clips metadata
  if (contentType.includes("application/json")) {
    const data = await response.json();

    // Check if it's a clips array
    if (data.clips && Array.isArray(data.clips)) {
      return jobService.parseClipsFromResult({ clips: data.clips });
    }

    // Check if response itself is an array
    if (Array.isArray(data)) {
      return jobService.parseClipsFromResult({ clips: data });
    }

  }

  // Otherwise, treat as binary file
  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);

  const name = getFileName(blob.type, contentType, fallbackName);

  return [{ name, url: blobUrl }];
}

/**
 * Get appropriate file name based on content type
 * @param blobType - Blob MIME type
 * @param contentType - Response content type
 * @param fallbackName - Fallback name
 * @returns File name
 */
function getFileName(
  blobType: string,
  contentType: string,
  fallbackName?: string
): string {
  if (contentType.includes("zip") || blobType.includes("zip")) {
    return `${fallbackName || "result"}.zip`;
  }

  if (blobType.startsWith("video/")) {
    return fallbackName || "result.mp4";
  }

  return `${fallbackName || "result"}.bin`;
}

// ============================================================================
// LEGACY SUPPORT (for backward compatibility)
// ============================================================================

/**
 * @deprecated Use uploadHighlightReel with HighlightReelParams instead
 * Legacy support: accepts FormData directly
 * NOTE: FormData must have "video" field, not "file"
 */
export async function uploadHighlightReelLegacy(
  formData: FormData
): Promise<Record<string, unknown>> {
  const url = `${API_BASE_URL}/highlight-reel`;

  try {
    const response = await fetch(url, {
      method: "POST",
      body: formData,
      mode: "cors",
      headers: {
        Accept: "application/json",
        "ngrok-skip-browser-warning": "true",
      },
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Upload failed: ${response.status} ${text}`);
    }

    return (await response.json()) as Record<string, unknown>;
  } catch (err) {
    throw new Error(`uploadHighlightReel error: ${err}`);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const highlightService = {
  uploadHighlightReel,
  processHighlightReel,
  // Re-export job service utilities
  pollJobStatus: jobService.pollJobStatus,
  downloadJobResult: jobService.downloadJobResult,
  downloadJobResultByUrl: jobService.downloadJobResultByUrl,
};
