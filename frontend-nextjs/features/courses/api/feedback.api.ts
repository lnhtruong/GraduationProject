import { createApi, apiHttpClient } from "@/features/_shared/api-factories";
import type { FeedbackListResponse, CreateFeedbackPayload } from "../types";

export const feedbackApi = createApi({
  listByCourse: async (
    courseId: number,
    page = 1,
    limit = 5,
    userId?: number,
  ): Promise<FeedbackListResponse> => {
    const params: Record<string, unknown> = { page, limit };
    if (userId) params.userId = userId;
    const { data } = await apiHttpClient.get<FeedbackListResponse>(
      `/course/feedbacks/${courseId}`,
      { params },
    );
    return data;
  },

  create: async (payload: CreateFeedbackPayload): Promise<void> => {
    await apiHttpClient.post("/course/feedbacks", payload);
  },
});
