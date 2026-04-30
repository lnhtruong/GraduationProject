/**
 * Upload Feature API
 */

import {
  createApi,
  inferenceHttpClient as inferenceClient,
} from "@/features/_shared/api-factories";
import {
  buildHighlightReelFormData,
  buildHighlightReelRequestConfig,
} from "../utils/upload.utils";
import type { JobIdResponse, HighlightReelParams, HighlightReelLinkParams } from "../types";

// ============================================================================
// API OBJECT
// ============================================================================

export const UPLOAD_ENDPOINT = "/mascot_colab/highlight-reel";
export const UPLOAD_LINK_ENDPOINT = "/mascot_colab/highlight-reel-link";

export const uploadApi = createApi({
  startJob: async (params: HighlightReelParams) => {
    const formData = buildHighlightReelFormData(params);
    const requestConfig = buildHighlightReelRequestConfig(params);

    const { data } = await inferenceClient.post<JobIdResponse>(
      UPLOAD_ENDPOINT,
      formData,
      requestConfig,
    );
    return data.job_id;
  },

  startJobByLink: async (params: HighlightReelLinkParams) => {
    const payload: Record<string, unknown> = {
      video_url: params.videoUrl,
    };
    if (params.topic) payload.topic = params.topic;
    if (params.includeKeywords) payload.include_keywords = params.includeKeywords;
    if (params.excludeKeywords) payload.exclude_keywords = params.excludeKeywords;
    if (params.isOpenAI !== undefined) payload.isOpenAI = String(params.isOpenAI);
    if (params.isMultiOutput !== undefined) payload.isMultiOutput = String(params.isMultiOutput);
    if (params.targetMin !== undefined) payload.target_min = String(params.targetMin);
    if (params.targetMax !== undefined) payload.target_max = String(params.targetMax);

    const { data } = await inferenceClient.post<JobIdResponse>(
      UPLOAD_LINK_ENDPOINT,
      payload,
    );
    return data.job_id;
  },
});
