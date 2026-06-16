import { apiHttpClient } from "@/features/_shared/api-factories";
import type { DiscussionListResponse } from "../types";

export interface LessonDiscussionsParams {
  lessonId: number;
  page?: number;
  limit?: number;
}

function buildQueryString(params: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined) return;
    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export const discussionApi = {
  listByLesson: async ({
    lessonId,
    page = 1,
    limit = 20,
  }: LessonDiscussionsParams): Promise<DiscussionListResponse> => {
    const { data } = await apiHttpClient.get<DiscussionListResponse>(
      `/course/lessons/${lessonId}/discussions${buildQueryString({
        page,
        limit,
      })}`,
    );

    return data;
  },
  createForLesson: async (
    lessonId: number,
    payload: { content: string; parentId?: number | null },
  ) => {
    const { data } = await apiHttpClient.post(
      `/course/lessons/${lessonId}/discussions`,
      payload,
    );
    return data as any;
  },
  toggleUpvote: async (postId: number) => {
    const { data } = await apiHttpClient.post(
      `/course/discussions/${postId}/upvote`,
    );
    return data as { upvotes: number; voted: boolean };
  },
};
