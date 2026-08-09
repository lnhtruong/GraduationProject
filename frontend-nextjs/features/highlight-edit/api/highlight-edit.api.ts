/**
 * Highlight Segment Removal API
 *
 * First frontend caller of the new `/highlight-edit-link` endpoint
 * (inference_service -> Colab). See
 * specs/003-highlight-segment-removal/contracts/highlight-edit-endpoints.md
 * (colab2 repo) for the full contract.
 */

import {
  createApi,
  inferenceHttpClient as inferenceClient,
} from "@/features/_shared/api-factories";
import { JOB_STATUS_ENDPOINT } from "@/features/upload/api/upload.api";
import type { JobIdResponse } from "@/features/upload/types";
import type { SegmentRangePayload } from "@/features/upload/types";

export const HIGHLIGHT_EDIT_LINK_ENDPOINT = "/mascot_colab/highlight-edit-link";

export interface StartHighlightEditParams {
  videoId: number;
  removeRanges: SegmentRangePayload[];
}

export const highlightEditApi = createApi({
  startJob: async (params: StartHighlightEditParams) => {
    const { data } = await inferenceClient.post<JobIdResponse>(
      HIGHLIGHT_EDIT_LINK_ENDPOINT,
      {
        video_id: params.videoId,
        remove_ranges: params.removeRanges,
      },
    );
    return data.job_id;
  },
  // Same endpoint/shape as uploadApi.getJobStatus — the job_id namespace is
  // shared across job types (highlight/subtitle/quiz/highlight_edit) on the
  // Colab worker.
  getJobStatus: async (jobId: string) => {
    const { data } = await inferenceClient.get<Record<string, unknown>>(
      `${JOB_STATUS_ENDPOINT}/${encodeURIComponent(jobId)}`,
    );
    return data;
  },
});
