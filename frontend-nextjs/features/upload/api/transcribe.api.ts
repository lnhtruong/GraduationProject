/**
 * Transcribe Feature API
 *
 * First frontend caller of the already-existing `/transcribe` endpoint
 * (inference_service -> Colab). See
 * specs/002-highlight-segment-picker-ui/contracts/frontend-payload-and-endpoints.md
 * (colab2 repo) for the full contract.
 */

import {
  createApi,
  inferenceHttpClient as inferenceClient,
} from "@/features/_shared/api-factories";
import { JOB_STATUS_ENDPOINT } from "./upload.api";
import type { JobIdResponse } from "../types";

export const TRANSCRIBE_ENDPOINT = "/mascot_colab/transcribe";

export interface StartTranscribeJobParams {
  videoUrl: string;
  videoId: number;
  sourceOriginalFilename?: string;
  language?: string;
}

export const transcribeApi = createApi({
  startJob: async (params: StartTranscribeJobParams) => {
    const { data } = await inferenceClient.post<JobIdResponse>(
      TRANSCRIBE_ENDPOINT,
      {
        video_url: params.videoUrl,
        video_id: params.videoId,
        ...(params.sourceOriginalFilename
          ? { source_original_filename: params.sourceOriginalFilename }
          : {}),
        ...(params.language ? { language: params.language } : {}),
      },
    );
    return data.job_id;
  },
  // Same endpoint/shape as uploadApi.getJobStatus — the job_id namespace is
  // shared across job types (highlight/subtitle/quiz) on the Colab worker.
  getJobStatus: async (jobId: string) => {
    const { data } = await inferenceClient.get<Record<string, unknown>>(
      `${JOB_STATUS_ENDPOINT}/${encodeURIComponent(jobId)}`,
    );
    return data;
  },
});
