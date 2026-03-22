/**
 * Video Editor Feature API
 */

import { apiClient } from "@/lib/http";
import { createApi } from "@/features/_shared/api";
import type { JobStatusResponse } from "@/features/_shared/types";

// ============================================================================
// TYPES
// ============================================================================

export interface MascotParams {
  videoOrUrl: File | string;
  mascotImage: File;
  position:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "replace";
  margin_x?: number;
  margin_y?: number;
  scale?: number;
  audio?: File;
}

export interface MascotResult {
  jobId: string;
  downloadUrl?: string;
}

export interface HighlightParams {
  file: File;
  topic?: string;
  includeKeywords?: string;
  excludeKeywords?: string;
}

export interface HighlightResult {
  jobId: string;
  downloadUrl?: string;
}

// ============================================================================
// API OBJECTS
// ============================================================================

export const MASCOT_ENDPOINT = "/mascot";
export const HIGHLIGHT_ENDPOINT = "/highlight-reel";

export const mascotApi = createApi({
  startJob: async (params: MascotParams) => {
    const formData = new FormData();

    // Backend expects video_url as string URL
    if (typeof params.videoOrUrl === "string") {
      formData.append("video_url", params.videoOrUrl);
    } else {
      throw new Error(
        "Mascot API requires video URL. Please upload video to Cloudinary first.",
      );
    }

    formData.append("mascot_image", params.mascotImage);
    formData.append("position", params.position);
    formData.append("margin_x", (params.margin_x ?? 40).toString());
    formData.append("margin_y", (params.margin_y ?? 40).toString());
    formData.append("scale", (params.scale ?? 1).toString());

    if (params.audio) {
      formData.append("audio", params.audio);
    }

    const { data } = await apiClient.post<{ job_id: string }>(
      MASCOT_ENDPOINT,
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
  processResult: async (jobResult: JobStatusResponse) =>
    ({
      jobId: (jobResult as { jobId?: string }).jobId || "",
      downloadUrl: jobResult.result?.download_url,
    }) as MascotResult,
});

export const highlightApi = createApi({
  startJob: async (params: HighlightParams) => {
    const formData = new FormData();
    formData.append("video", params.file);

    if (params.topic) formData.append("topic", params.topic);
    if (params.includeKeywords)
      formData.append("include_keywords", params.includeKeywords);
    if (params.excludeKeywords)
      formData.append("exclude_keywords", params.excludeKeywords);

    const { data } = await apiClient.post<{ job_id: string }>(
      HIGHLIGHT_ENDPOINT,
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
  processResult: async (jobResult: JobStatusResponse) =>
    ({
      jobId: (jobResult as { jobId?: string }).jobId || "",
      downloadUrl: jobResult.result?.download_url,
    }) as HighlightResult,
});

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

export function calculateMaxMargins(
  videoWidth: number,
  videoHeight: number,
  mascotScale: number,
): { maxX: number; maxY: number } {
  return {
    maxX: Math.floor(videoWidth * (1 - mascotScale * 0.2)),
    maxY: Math.floor(videoHeight * (1 - mascotScale * 0.2)),
  };
}

export function validateMascotParams(params: {
  margin_x: number;
  margin_y: number;
  scale: number;
  maxMargins?: { maxX: number; maxY: number };
}): { valid: boolean; error?: string } {
  if (params.margin_x < 0 || params.margin_y < 0) {
    return { valid: false, error: "Margins cannot be negative" };
  }

  if (params.scale < 0.1 || params.scale > 2.0) {
    return { valid: false, error: "Scale must be between 0.1 and 2.0" };
  }

  if (params.maxMargins) {
    if (
      params.margin_x > params.maxMargins.maxX ||
      params.margin_y > params.maxMargins.maxY
    ) {
      return {
        valid: false,
        error: `Margins exceed max values (${params.maxMargins.maxX}, ${params.maxMargins.maxY})`,
      };
    }
  }

  return { valid: true };
}

export function getDefaultMascotParams() {
  return {
    position: "bottom-right" as const,
    margin_x: 40,
    margin_y: 40,
    scale: 1,
  };
}
