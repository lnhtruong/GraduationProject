import {
  createApi,
  inferenceHttpClient as inferenceClient,
} from "@/features/_shared/api-factories";
import { buildMascotFormData } from "../utils/mascot.utils";
import type { MascotParams } from "../types";

export const MASCOT_ENDPOINT = "/mascot_colab/mascot";

export const mascotApi = createApi({
  startJob: async (params: MascotParams) => {
    const formData = buildMascotFormData(params);
    const { data } = await inferenceClient.post<{ job_id: string }>(
      MASCOT_ENDPOINT,
      formData,
    );
    return data.job_id;
  },
});
