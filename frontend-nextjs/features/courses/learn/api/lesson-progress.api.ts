import {
  createResourceApi,
  withQueryPath,
} from "@/features/_shared/crud-factories";
import type {
  LessonProgressRecord,
  LessonProgressStatus,
  UpsertLessonProgressPayload,
} from "../types";

type LessonProgressListResponse = {
  data?: LessonProgressRecord[];
  pagination?: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
};

export interface LessonProgressListParams {
  courseId: number;
  limit?: number;
}

type UpdateLessonProgressPayload = {
  progress: LessonProgressStatus;
};

export const lessonProgressApi = createResourceApi<
  LessonProgressRecord,
  LessonProgressRecord,
  UpsertLessonProgressPayload,
  UpdateLessonProgressPayload,
  number,
  LessonProgressListParams,
  { message?: string },
  LessonProgressListResponse | LessonProgressRecord[]
>({
  basePath: "/course/lesson-progress",
  mapItem: (item) => item,
  mapListResponse: (raw) => (Array.isArray(raw) ? raw : (raw.data ?? [])),
  toCreatePayload: (payload) => ({
    courseId: payload.courseId,
    lessonId: payload.lessonId,
    progress: payload.progress,
  }),
  toUpdatePayload: (payload) => payload,
  toPatchPayload: (payload) => payload,
  getListPath: (params) =>
    withQueryPath("/course/lesson-progress", {
      courseId: params?.courseId,
      limit: params?.limit,
    }),
});
