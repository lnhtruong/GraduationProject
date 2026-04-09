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
import type { JobIdResponse, HighlightReelParams } from "../types";

// ============================================================================
// API OBJECT
// ============================================================================

export const UPLOAD_ENDPOINT = "/mascot_colab/highlight-reel";

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
});
