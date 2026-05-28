import { createCrudHooks } from "@/features/_shared/crud-factories";
import {
  createMutationHooks,
  createQueryHooks,
} from "@/features/_shared/react-query-factories";
import {
  lessonProgressExtraApi,
  lessonProgressApi,
  type LessonProgressListParams,
} from "./lesson-progress.api";
import type {
  ContinueWatchingLesson,
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
  positionSec: number;
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

    return lessonProgressApi.create(payload);
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
  LessonProgressRecord,
  LessonProgressHeartbeatPayload
>(
  "lesson-progress",
  "heartbeat",
  async (payload) => {
    return lessonProgressExtraApi.heartbeat(payload.lessonProgressId, {
      positionSec: payload.positionSec,
    });
  },
  {
    onSuccess: (savedRecord, _payload, queryClient) => {
      queryClient.setQueriesData<LessonProgressRecord[]>(
        { queryKey: lessonProgressKeys.root },
        (current) => {
          if (!current?.length) {
            return current;
          }

          return mergeLessonProgress(current, savedRecord);
        },
      );
    },
  },
);

export function useLessonProgressHeartbeat() {
  return useLessonProgressHeartbeatBase();
}

const continueWatchingHooks = createQueryHooks<ContinueWatchingLesson[]>(
  "lesson-progress",
  ["continue-watching"],
  lessonProgressExtraApi.getContinueWatching,
  {
    staleTime: 60 * 1000,
  },
);

export const useContinueWatchingList = continueWatchingHooks.useQuery;
