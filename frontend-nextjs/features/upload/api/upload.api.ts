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
  /** Called with 0–100 as file bytes are sent to the server */
  onUploadProgress?: (percent: number) => void;
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
      (
        clip:
          | string
          | {
              name?: string;
              url: string;
              video_id?: number | string;
              videoId?: number | string;
            },
        index: number,
      ) => {
        const clipObj =
          typeof clip === "object"
            ? clip
            : { name: `clip-${index + 1}`, url: clip };
        const rawVideoId = clipObj.videoId ?? clipObj.video_id;
        const parsedVideoId =
          typeof rawVideoId === "string" ? Number(rawVideoId) : rawVideoId;

        return {
          name: clipObj.name || `clip-${index + 1}`,
          url: clipObj.url,
          videoUrl: clipObj.url,
          videoId:
            typeof parsedVideoId === "number" && Number.isFinite(parsedVideoId)
              ? parsedVideoId
              : undefined,
        };
      },
    );
  } catch (error) {
    console.error("Failed to parse clips from URL:", error);
    return [];
  }
}

// ============================================================================
// API OBJECT
// ============================================================================

export const UPLOAD_ENDPOINT = "/mascot_colab/highlight-reel";

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
      {
        headers: {
          // Remove default "application/json" so browser sets correct
          // "multipart/form-data; boundary=..." for the FormData upload
          "Content-Type": undefined,
        },
        timeout: 0, // Disable timeout for file uploads (large files need more time)
        onUploadProgress: (event) => {
          if (event.total && params.onUploadProgress) {
            const percent = Math.round((event.loaded * 100) / event.total);
            params.onUploadProgress(percent);
          }
        },
      },
    );
    return data.job_id;
  },
  getStatus: async (jobId: string) => {
    const { data } = await apiClient.get<JobStatusResponse>(
      `/mascot_colab/jobs/status/${jobId}`,
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
