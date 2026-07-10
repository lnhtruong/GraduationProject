/**
 * Upload Feature API
 */

import {
  createApi,
  inferenceHttpClient as inferenceClient,
} from "@/features/_shared/api-factories";
import { buildHighlightReelLinkPayload } from "../utils/upload.utils";
import type {
  JobIdResponse,
  HighlightReelLinkParams,
} from "../types";

// ============================================================================
// API OBJECT
// ============================================================================

export const HIGHLIGHT_LINK_ENDPOINT = "/mascot_colab/highlight-reel-link";
export const JOB_STATUS_ENDPOINT = "/mascot_colab/jobs/status";

export const uploadApi = createApi({
  startJobFromLink: async (params: HighlightReelLinkParams) => {
    const payload = buildHighlightReelLinkPayload(params);
    const { data } = await inferenceClient.post<JobIdResponse>(
      HIGHLIGHT_LINK_ENDPOINT,
      {
        ...payload,
        user_id: String(payload.user_id ?? ""),
        isOpenAI: String(payload.isOpenAI ?? false),
        isMultiOutput: String(payload.isMultiOutput ?? false),
      },
    );
    return data.job_id;
  },
  getJobStatus: async (jobId: string) => {
    const { data } = await inferenceClient.get<Record<string, unknown>>(
      `${JOB_STATUS_ENDPOINT}/${encodeURIComponent(jobId)}`,
    );
    return data;
  },
});
