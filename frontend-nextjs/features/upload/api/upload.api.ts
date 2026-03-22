/**
 * Upload Feature API
 */

import { createApi } from "@/features/_shared/api";
import { apiClient } from "@/lib/http";
import type {
  JobIdResponse,
  Clip,
  JobStatusResponse,
} from "@/features/_shared/types";

// ============================================================================
// TYPES
// ============================================================================

export interface HighlightReelParams {
  file: File;
  topic?: string;
  includeKeywords?: string;
  excludeKeywords?: string;
}

export interface UploadResult {
  jobId: string;
  clips: Clip[];
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Parse clips from download URL
 */
async function parseClipsFromUrl(downloadUrl: string): Promise<Clip[]> {
  // If it's a Cloudinary URL, return it directly
  if (downloadUrl.includes("cloudinary.com")) {
    const fileName = downloadUrl.split("/").pop() || "video.mp4";
    return [
      {
        name: fileName,
        url: downloadUrl,
        videoUrl: downloadUrl,
      },
    ];
  }

  // Otherwise, try to fetch and parse JSON
  try {
    const response = await fetch(downloadUrl);
    const contentType = response.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      return [];
    }

    const data = await response.json();

    if (!data.clips || !Array.isArray(data.clips)) {
      return [];
    }

    return data.clips.map(
      (clip: string | { name?: string; url: string }, index: number) => ({
        name: typeof clip === "object" ? clip.name : `clip-${index + 1}`,
        url: typeof clip === "object" ? clip.url : clip,
        videoUrl: typeof clip === "object" ? clip.url : clip,
      }),
    );
  } catch (error) {
    console.error("Failed to parse clips from URL:", error);
    return [];
  }
}

// ============================================================================
// API OBJECT
// ============================================================================

export const UPLOAD_ENDPOINT = "/highlight-reel";

export const uploadApi = createApi({
  startJob: async (params: HighlightReelParams) => {
    const formData = new FormData();
    formData.append("video", params.file);

    if (params.topic) formData.append("topic", params.topic);
    if (params.includeKeywords)
      formData.append("include_keywords", params.includeKeywords);
    if (params.excludeKeywords)
      formData.append("exclude_keywords", params.excludeKeywords);

    const { data } = await apiClient.post<JobIdResponse>(
      UPLOAD_ENDPOINT,
      formData,
    );
    return data.job_id;
  },
  getStatus: async (jobId: string) => {
    const { data } = await apiClient.get<JobStatusResponse>(
      `/jobs/status/${jobId}`,
    );
    return data;
  },
  processResult: async (jobResult: JobStatusResponse) => {
    const downloadUrl = jobResult.result?.download_url;
    const clips = downloadUrl ? await parseClipsFromUrl(downloadUrl) : [];
    return {
      jobId: (jobResult as { jobId?: string }).jobId || "",
      clips,
    } as UploadResult;
  },
});
