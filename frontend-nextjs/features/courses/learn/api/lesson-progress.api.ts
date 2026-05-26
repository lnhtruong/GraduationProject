import {
  createResourceApi,
  withQueryPath,
} from "@/features/_shared/crud-factories";
import { apiHttpClient } from "@/features/_shared/api-factories";
import type {
  ContinueWatchingLesson,
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

type RawLessonProgressRecord = LessonProgressRecord & {
  last_video_position_sec?: number;
};

type HeartbeatPayload = {
  positionSec: number;
};

type RawContinueWatchingLesson = Partial<ContinueWatchingLesson> & {
  lesson_progress_id?: number;
  course_id?: number;
  lesson_id?: number;
  lesson_title?: string;
  course_title?: string;
  thumbnail_url?: string | null;
  last_video_position_sec?: number;
  updated_at?: string;
};

function mapLessonProgressRecord(
  raw: RawLessonProgressRecord,
): LessonProgressRecord {
  return {
    ...raw,
    lastVideoPositionSec:
      raw.lastVideoPositionSec ?? raw.last_video_position_sec ?? 0,
  };
}

function mapContinueWatchingItem(
  raw: RawContinueWatchingLesson,
): ContinueWatchingLesson {
  return {
    lessonProgressId: Number(
      raw.lessonProgressId ?? raw.lesson_progress_id ?? 0,
    ),
    courseId: Number(raw.courseId ?? raw.course_id ?? 0),
    lessonId: Number(raw.lessonId ?? raw.lesson_id ?? 0),
    lessonTitle: String(raw.lessonTitle ?? raw.lesson_title ?? "Bài học"),
    courseTitle: String(raw.courseTitle ?? raw.course_title ?? "Khóa học"),
    thumbnailUrl: raw.thumbnailUrl ?? raw.thumbnail_url ?? null,
    lastVideoPositionSec: Number(
      raw.lastVideoPositionSec ?? raw.last_video_position_sec ?? 0,
    ),
    updatedAt: raw.updatedAt ?? raw.updated_at,
  };
}

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
  mapItem: mapLessonProgressRecord,
  mapListResponse: (raw) =>
    (Array.isArray(raw) ? raw : (raw.data ?? [])).map(mapLessonProgressRecord),
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

export const lessonProgressExtraApi = {
  heartbeat: async (lessonProgressId: number, payload: HeartbeatPayload) => {
    const { data } = await apiHttpClient.patch<LessonProgressRecord>(
      `/course/lesson-progress/${lessonProgressId}/heartbeat`,
      {
        positionSec: payload.positionSec,
      },
    );

    return mapLessonProgressRecord(data as RawLessonProgressRecord);
  },
  getContinueWatching: async (): Promise<ContinueWatchingLesson[]> => {
    const { data } = await apiHttpClient.get<
      RawContinueWatchingLesson[] | { data?: RawContinueWatchingLesson[] }
    >("/course/lesson-progress/continue-watching");

    const items = Array.isArray(data) ? data : (data.data ?? []);
    return items
      .map(mapContinueWatchingItem)
      .filter((item) => item.lessonId > 0);
  },
};
