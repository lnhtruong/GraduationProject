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
  last_video_position_ms?: number;
  last_watched_at?: string;
};

type HeartbeatPayload = {
  position: number;
};

type HeartbeatResponse = {
  ok?: boolean;
  position?: number;
  lastWatchedAt?: string;
  last_watched_at?: string;
};

type RawContinueWatchingLesson = Partial<ContinueWatchingLesson> & {
  progressId?: number;
  lessonProgressId?: number;
  course_id?: number;
  lesson_id?: number;
  lesson_title?: string;
  course_title?: string;
  thumbnail_url?: string | null;
  last_video_position_ms?: number;
  lastWatchedAt?: string;
  last_watched_at?: string;
  percentage?: number;
  course?: {
    id?: number;
    name?: string;
    title?: string;
    thumbnailUrl?: string | null;
    thumbnail_url?: string | null;
  };
  lesson?: {
    id?: number;
    title?: string;
    name?: string;
  };
  updated_at?: string;
};

function mapLessonProgressRecord(
  raw: RawLessonProgressRecord,
): LessonProgressRecord {
  return {
    ...raw,
    lastVideoPositionMs:
      raw.lastVideoPositionMs ?? raw.last_video_position_ms ?? 0,
    lastWatchedAt: raw.lastWatchedAt ?? raw.last_watched_at,
  };
}

function mapContinueWatchingItem(
  raw: RawContinueWatchingLesson,
): ContinueWatchingLesson {
  const courseId = Number(raw.courseId ?? raw.course?.id ?? raw.course_id ?? 0);
  const lessonId = Number(raw.lessonId ?? raw.lesson?.id ?? raw.lesson_id ?? 0);
  const lessonTitle =
    raw.lessonTitle ??
    raw.lesson?.title ??
    raw.lesson?.name ??
    raw.lesson_title;
  const courseTitle =
    raw.courseTitle ??
    raw.course?.name ??
    raw.course?.title ??
    raw.course_title;
  const thumbnailUrl =
    raw.thumbnailUrl ??
    raw.course?.thumbnailUrl ??
    raw.course?.thumbnail_url ??
    raw.thumbnail_url ??
    null;

  return {
    lessonProgressId: Number(raw.lessonProgressId ?? raw.progressId ?? 0),
    courseId,
    lessonId,
    lessonTitle: String(lessonTitle ?? "Bài học"),
    courseTitle: String(courseTitle ?? "Khóa học"),
    thumbnailUrl,
    lastVideoPositionMs: Number(
      raw.lastVideoPositionMs ?? raw.last_video_position_ms ?? 0,
    ),
    percentage: Number(raw.percentage ?? 0),
    updatedAt:
      raw.updatedAt ??
      raw.lastWatchedAt ??
      raw.last_watched_at ??
      raw.updated_at,
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
    const { data } = await apiHttpClient.patch<HeartbeatResponse>(
      `/course/lesson-progress/${lessonProgressId}/heartbeat`,
      {
        position: payload.position,
      },
    );

    return {
      ok: data.ok ?? true,
      position: Number(data.position ?? payload.position),
      lastWatchedAt: data.lastWatchedAt ?? data.last_watched_at,
    };
  },
  getContinueWatching: async (
    limit = 10,
  ): Promise<ContinueWatchingLesson[]> => {
    const { data } = await apiHttpClient.get<
      | { items?: RawContinueWatchingLesson[] }
      | { data?: RawContinueWatchingLesson[] }
      | RawContinueWatchingLesson[]
    >(withQueryPath("/course/lesson-progress/continue-watching", { limit }));

    const items = Array.isArray(data)
      ? data
      : Array.isArray((data as { items?: RawContinueWatchingLesson[] }).items)
        ? ((data as { items?: RawContinueWatchingLesson[] }).items ?? [])
        : ((data as { data?: RawContinueWatchingLesson[] }).data ?? []);
    return items
      .map(mapContinueWatchingItem)
      .filter((item) => item.lessonId > 0);
  },
};
