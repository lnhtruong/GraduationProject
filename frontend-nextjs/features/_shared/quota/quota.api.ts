import {
  createApi,
  inferenceHttpClient as inferenceClient,
} from "@/features/_shared/api-factories";
import type { QuotaSnapshot } from "./quota.types";

export const QUOTA_ENDPOINT = "/mascot_colab/quota";

export const quotaApi = createApi({
  getSnapshot: async () => {
    const { data } = await inferenceClient.get<QuotaSnapshot>(QUOTA_ENDPOINT);
    return data;
  },
});
