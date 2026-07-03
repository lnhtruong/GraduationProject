import { createApi, apiHttpClient } from "@/features/_shared/api-factories";
import type {
  CourseDiscussionsResponse,
  DiscussionReply,
  DiscussionStatus,
  DiscussionSort,
  LessonDiscussionsResponse,
} from "./types";

export interface CourseDiscussionParams {
  page?: number;
  limit?: number;
  lessonId?: number;
  status?: DiscussionStatus;
  courseId?: number;
  sort?: DiscussionSort;
}

function normaliseAuthor(raw: Record<string, unknown>) {
  return {
    id: (raw.id ?? 0) as number,
    name: ((raw.name ?? "") as string).trim(),
    avatarUrl: (raw.avatarUrl ?? raw.avatar_url ?? null) as string | null,
  };
}

function normaliseDate(val: unknown): string {
  if (val instanceof Date) return val.toISOString();
  return String(val ?? "");
}

export const discussionApi = createApi({
  listByCourse: async (
    courseId: number,
    params: CourseDiscussionParams = {},
  ): Promise<CourseDiscussionsResponse> => {
    const query: Record<string, unknown> = {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
    };
    if (params.lessonId) query.lessonId = params.lessonId;
    if (params.status) query.status = params.status;
    if (params.sort) query.sort = params.sort;

    const { data } = await apiHttpClient.get(
      `/course/courses/${courseId}/discussions`,
      { params: query },
    );

    const items = (data.data ?? []) as Record<string, unknown>[];
    return {
      total: (data.total ?? items.length) as number,
      page: (data.page ?? 1) as number,
      limit: (data.limit ?? 20) as number,
      totalCount: data.totalCount as number | undefined,
      unansweredTotal: data.unansweredTotal as number | undefined,
      answeredTotal: data.answeredTotal as number | undefined,
      data: items.map((q) => ({
        id: q.id as number,
        lessonId: (q.lessonId ?? q.lesson_id) as number,
        lessonTitle: ((q.lessonTitle ?? q.lesson_title ?? "") as string),
        content: ((q.content ?? "") as string),
        upvotes: (q.upvotes ?? 0) as number,
        replyCount: (q.replyCount ?? q.reply_count ?? 0) as number,
        createdAt: normaliseDate(q.createdAt ?? q.created_at),
        author: normaliseAuthor(q.author as Record<string, unknown>),
        hasInstructorReply: q.hasInstructorReply !== undefined 
          ? Boolean(q.hasInstructorReply) 
          : (q.has_instructor_reply !== undefined ? Boolean(q.has_instructor_reply) : undefined),
      })),
    };
  },

  listByLesson: async (lessonId: number): Promise<LessonDiscussionsResponse> => {
    // Backend cap is limit=100; questions beyond that won't appear when expanding
    const { data } = await apiHttpClient.get(
      `/course/lessons/${lessonId}/discussions`,
      { params: { page: 1, limit: 100, sort: "newest" } },
    );

    const items = (data.data ?? []) as Record<string, unknown>[];
    return {
      total: (data.total ?? items.length) as number,
      page: (data.page ?? 1) as number,
      limit: (data.limit ?? 100) as number,
      data: items.map((root) => ({
        id: root.id as number,
        lessonId: (root.lessonId ?? root.lesson_id) as number,
        parentId: null,
        content: ((root.content ?? "") as string),
        upvotes: (root.upvotes ?? 0) as number,
        createdAt: normaliseDate(root.createdAt ?? root.created_at),
        author: normaliseAuthor(root.author as Record<string, unknown>),
        replies: ((root.replies ?? []) as Record<string, unknown>[]).map((r) => ({
          id: r.id as number,
          lessonId: (r.lessonId ?? r.lesson_id) as number,
          parentId: (r.parentId ?? r.parent_id) as number,
          content: ((r.content ?? "") as string),
          isBestAnswer: Boolean(r.isBestAnswer ?? r.is_best_answer),
          upvotes: (r.upvotes ?? 0) as number,
          createdAt: normaliseDate(r.createdAt ?? r.created_at),
          author: normaliseAuthor(r.author as Record<string, unknown>),
        })),
      })),
    };
  },

  createReply: async (
    lessonId: number,
    content: string,
    parentId: number,
  ): Promise<void> => {
    await apiHttpClient.post(`/course/lessons/${lessonId}/discussions`, {
      content,
      parentId,
    });
  },

  toggleBestAnswer: async (postId: number): Promise<DiscussionReply> => {
    const { data } = await apiHttpClient.patch(
      `/course/discussions/${postId}/best-answer`,
    );
    const r = data as Record<string, unknown>;
    return {
      id: r.id as number,
      lessonId: (r.lessonId ?? r.lesson_id) as number,
      parentId: (r.parentId ?? r.parent_id) as number,
      content: ((r.content ?? "") as string),
      isBestAnswer: Boolean(r.isBestAnswer ?? r.is_best_answer),
      upvotes: (r.upvotes ?? 0) as number,
      createdAt: normaliseDate(r.createdAt ?? r.created_at),
      author: normaliseAuthor(r.author as Record<string, unknown>),
    };
  },

  listForInstructor: async (
    params: CourseDiscussionParams = {},
  ): Promise<CourseDiscussionsResponse> => {
    const query: Record<string, unknown> = {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
    };
    if (params.status) query.status = params.status;
    if (params.courseId) query.courseId = params.courseId;
    if (params.sort) query.sort = params.sort;

    const { data } = await apiHttpClient.get(
      `/course/instructor/discussions`,
      { params: query },
    );

    const items = (data.data ?? []) as Record<string, unknown>[];
    return {
      total: (data.total ?? items.length) as number,
      page: (data.page ?? 1) as number,
      limit: (data.limit ?? 20) as number,
      totalCount: data.totalCount as number | undefined,
      unansweredTotal: data.unansweredTotal as number | undefined,
      answeredTotal: data.answeredTotal as number | undefined,
      data: items.map((q) => ({
        id: q.id as number,
        lessonId: (q.lessonId ?? q.lesson_id) as number,
        lessonTitle: ((q.lessonTitle ?? q.lesson_title ?? "") as string),
        courseName: ((q.courseName ?? q.course_name ?? "") as string),
        courseId: (q.courseId ?? q.course_id) as number | undefined,
        content: ((q.content ?? "") as string),
        upvotes: (q.upvotes ?? 0) as number,
        replyCount: (q.replyCount ?? q.reply_count ?? 0) as number,
        createdAt: normaliseDate(q.createdAt ?? q.created_at),
        author: normaliseAuthor(q.author as Record<string, unknown>),
        hasInstructorReply: q.hasInstructorReply !== undefined 
          ? Boolean(q.hasInstructorReply) 
          : (q.has_instructor_reply !== undefined ? Boolean(q.has_instructor_reply) : undefined),
      })),
    };
  },
});
