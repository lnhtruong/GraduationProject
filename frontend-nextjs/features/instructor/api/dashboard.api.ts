import { apiHttpClient } from "@/features/_shared/api-factories";
import type { Course } from "@/features/courses/types";

export type { Course };

export const dashboardApi = {
  /** GET /course/courses/mine — trả về khoá học của instructor hiện tại */
  listMyCourses: async (): Promise<Course[]> => {
    const { data } = await apiHttpClient.get<Course[] | { data: Course[] }>(
      "/course/courses/mine",
    );
    return Array.isArray(data) ? data : (data.data ?? []);
  },

  /** GET /course/courses/:courseId/discussions?status=unanswered&limit=5 */
  listUnansweredDiscussions: async (
    courseId: number,
    limit = 5,
  ): Promise<DiscussionItem[]> => {
    const { data } = await apiHttpClient.get<{ data: DiscussionItem[] }>(
      `/course/courses/${courseId}/discussions`,
      { params: { status: "unanswered", limit } },
    );
    return data?.data ?? [];
  },
};

export interface DiscussionItem {
  id: number;
  content: string;
  createdAt: string;
  isAnswered: boolean;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  lesson?: { id: number; title: string };
}
