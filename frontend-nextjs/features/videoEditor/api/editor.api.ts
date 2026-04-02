/**
 * Video Editor Feature API
 */

import { apiClient, inferenceClient } from "@/lib/http";
import { createApi, createSimpleApi } from "@/features/_shared/api";
import type { JobStatusResponse } from "@/features/_shared/types";

// ============================================================================
// TYPES
// ============================================================================

export interface MascotParams {
  videoOrUrl: File | string;
  mascotImageUrl: string;
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

export interface CreateMascotVideoPayload {
  url: string;
  image_id?: number;
  duration?: number;
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

export const MASCOT_ENDPOINT = "/mascot_colab/mascot";
export const HIGHLIGHT_ENDPOINT = "/mascot_colab/highlight-reel";

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

    formData.append("mascot_image_url", params.mascotImageUrl);
    formData.append("position", params.position);
    formData.append("margin_x", String(params.margin_x ?? 40));
    formData.append("margin_y", String(params.margin_y ?? 40));
    formData.append("scale", String(params.scale ?? 1));

    if (params.audio) {
      formData.append("audio", params.audio);
    }

    console.log("[mascotApi.startJob] posting to:", MASCOT_ENDPOINT);
    console.log(
      "[mascotApi.startJob] formData entries:",
      Array.from(formData.entries()).map(([key, value]) => {
        if (value instanceof File) {
          return [
            key,
            `File(name=${value.name}, size=${value.size}, type=${value.type})`,
          ];
        }
        return [key, value];
      }),
    );

    const { data } = await inferenceClient.post<{ job_id: string }>(
      MASCOT_ENDPOINT,
      formData,
    );
    return data.job_id;
  },
  getStatus: async (jobId: string) => {
    // Token is auto-added by interceptor
    const { data } = await inferenceClient.get<JobStatusResponse>(
      `/mascot_colab/jobs/status/${jobId}`,
    );
    return data;
  },
  processResult: async (jobResult: JobStatusResponse) => {
    // Extract jobId from job result response
    const jobId =
      (jobResult as { job_id?: string }).job_id ||
      (jobResult as { jobId?: string }).jobId ||
      "";

    return {
      jobId,
      downloadUrl: jobResult.result?.download_url,
    } as MascotResult;
  },
});

export const mascotVideoApi = createSimpleApi({
  createVideoRecord: async (payload: CreateMascotVideoPayload) => {
    const { data } = await apiClient.post("/media/videos", {
      url: payload.url,
      image_id: payload.image_id,
      duration: payload.duration ?? 0,
      type: "mascot",
    });
    return data;
  },
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

    console.log(
      "[highlightApi.startJob] formData entries:",
      Array.from(formData.entries()).map(([key, value]) => {
        if (value instanceof File) {
          return [
            key,
            `File(name=${value.name}, size=${value.size}, type=${value.type})`,
          ];
        }
        return [key, value];
      }),
    );

    const { data } = await inferenceClient.post<{ job_id: string }>(
      HIGHLIGHT_ENDPOINT,
      formData,
    );
    return data.job_id;
  },
  getStatus: async (jobId: string) => {
    // Token is auto-added by interceptor
    const { data } = await inferenceClient.get<JobStatusResponse>(
      `/mascot_colab/jobs/status/${jobId}`,
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
