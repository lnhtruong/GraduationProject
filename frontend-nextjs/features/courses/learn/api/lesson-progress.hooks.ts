import { createCrudHooks } from "@/features/_shared/crud-factories";
import { createMutationHooks } from "@/features/_shared/react-query-factories";
import { useQuery } from "@tanstack/react-query";
import {
  lessonProgressExtraApi,
  lessonProgressApi,
  type LessonProgressListParams,
} from "./lesson-progress.api";
import type {
  LessonProgressRecord,
  LessonProgressStatus,
  UpsertLessonProgressPayload,
} from "../types";

type UpdateLessonProgressPayload = {
  progress: LessonProgressStatus;
};

const lessonProgressHooks = createCrudHooks<
  LessonProgressRecord,
  UpsertLessonProgressPayload,
  UpdateLessonProgressPayload,
  number,
  number,
  LessonProgressListParams,
  { message?: string }
>("lesson-progress", lessonProgressApi, {
  parentListKey: "courseId",
  parentListParamsBuilder: (courseId) => ({
    courseId: Number(courseId),
    limit: 100,
  }),
  listStaleTimeMs: 30 * 1000,
});

const lessonProgressKeys = lessonProgressHooks.keys;

const { useListByParent: useLessonProgressListByCourseId } =
  lessonProgressHooks;

export type { LessonProgressRecord, LessonProgressStatus } from "../types";

type LessonProgressHeartbeatPayload = {
  lessonProgressId: number;
  position: number;
};

function mergeLessonProgress(
  existing: LessonProgressRecord[],
  savedRecord: LessonProgressRecord,
) {
  const next = existing.filter(
    (row) => row.id !== savedRecord.id && row.lessonId !== savedRecord.lessonId,
  );

  return [...next, savedRecord].sort(
    (left, right) => left.lessonId - right.lessonId,
  );
}

function getHttpStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }

  const response = (error as { response?: { status?: unknown } }).response;
  return typeof response?.status === "number" ? response.status : undefined;
}

export function useLessonProgressByCourseId(
  courseId: number | null,
  enabled = true,
) {
  return useLessonProgressListByCourseId(courseId, enabled);
}

const useUpsertLessonProgressBase = createMutationHooks<
  LessonProgressRecord,
  UpsertLessonProgressPayload
>(
  "lesson-progress",
  "upsert",
  async (payload) => {
    if (payload.lessonProgressId) {
      return lessonProgressApi.update(payload.lessonProgressId, {
        progress: payload.progress,
      });
    }

    try {
      return await lessonProgressApi.create(payload);
    } catch (err: unknown) {
      // Backend may still return 409 for existing records in some deploys.
      // Fall back to querying existing progress for this course/lesson.
      if (getHttpStatus(err) === 409) {
        // Fetch list for course and find matching lessonId. Call safely in case
        // the API object does not expose `list` (typed optional).
        const listFn =
          lessonProgressApi.list ?? lessonProgressApi.listPaginated;
        if (listFn) {
          const items = await listFn({
            courseId: payload.courseId,
            limit: 100,
          } as LessonProgressListParams);
          const records = Array.isArray(items) ? items : items.data;
          const matches = (records ?? []).filter(
            (record: LessonProgressRecord) =>
              Number(record.lessonId) === Number(payload.lessonId),
          );
          if (matches.length > 0) return matches[0];
        }
      }

      throw err;
    }
  },
  {
    onSuccess: (savedRecord, payload, queryClient) => {
      queryClient.setQueryData<LessonProgressRecord[]>(
        lessonProgressKeys.custom("courseId", payload.courseId),
        (current) => mergeLessonProgress(current ?? [], savedRecord),
      );

      queryClient.invalidateQueries({
        queryKey: ["instructor-course", payload.courseId],
      });
    },
  },
);

export function useUpsertLessonProgress(courseId: number | null) {
  if (courseId === null) {
    throw new Error("courseId is required");
  }

  return useUpsertLessonProgressBase();
}

const useLessonProgressHeartbeatBase = createMutationHooks<
  { ok?: boolean; position: number; lastWatchedAt?: string },
  LessonProgressHeartbeatPayload
>(
  "lesson-progress",
  "heartbeat",
  async (payload) => {
    return lessonProgressExtraApi.heartbeat(payload.lessonProgressId, {
      position: payload.position,
    });
  },
  {
    retry: false,
    onSuccess: (savedResponse, payload, queryClient) => {
      queryClient.setQueriesData<LessonProgressRecord[]>(
        { queryKey: lessonProgressKeys.root },
        (current) => {
          if (!current?.length) {
            return current;
          }

          return current.map((record) =>
            record.id === payload.lessonProgressId
              ? {
                  ...record,
                  lastVideoPositionMs: savedResponse.position,
                  lastWatchedAt: savedResponse.lastWatchedAt,
                }
              : record,
          );
        },
      );

      queryClient.invalidateQueries({
        queryKey: ["lesson-progress", "continue-watching"],
      });
    },
  },
);

export function useLessonProgressHeartbeat() {
  return useLessonProgressHeartbeatBase();
}

export function useContinueWatchingList(limit = 10, enabled = true) {
  return useQuery({
    queryKey: ["lesson-progress", "continue-watching", { limit }],
    queryFn: () => lessonProgressExtraApi.getContinueWatching(limit),
    enabled,
    staleTime: 60 * 1000,
  });
}
