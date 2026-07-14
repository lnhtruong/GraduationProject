import {
  createApi,
  inferenceHttpClient as inferenceClient,
} from "@/features/_shared/api-factories";
import { buildMascotFormData } from "../utils/mascot.utils";
import type { MascotParams } from "../types";

export const MASCOT_ENDPOINT = "/mascot_colab/mascot";
export const MASCOT_JOB_STATUS_ENDPOINT = "/mascot_colab/jobs/status";

export const mascotApi = createApi({
  startJob: async (params: MascotParams) => {
    const formData = buildMascotFormData(params);
    const { data } = await inferenceClient.post<{ job_id: string }>(
      MASCOT_ENDPOINT,
      formData,
    );
    return data.job_id;
  },
  getJobStatus: async (jobId: string) => {
    const { data } = await inferenceClient.get<Record<string, unknown>>(
      `${MASCOT_JOB_STATUS_ENDPOINT}/${encodeURIComponent(jobId)}`,
    );
    return data;
  },
});
