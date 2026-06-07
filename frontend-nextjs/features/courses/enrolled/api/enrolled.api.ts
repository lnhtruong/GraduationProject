import { createApi, apiHttpClient } from "@/features/_shared/api-factories";
import type { EnrollListResponse } from "../types";

export const enrolledApi = createApi({
  list: async (): Promise<EnrollListResponse> => {
    const { data } = await apiHttpClient.get<EnrollListResponse>(
      "/course/enroll",
      { params: { page: 1, limit: 100 } },
    );
    return data;
  },
});
