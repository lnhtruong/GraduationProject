import { createCrudHooks } from "@/features/_shared/crud-factories";
import { apiHttpClient } from "@/features/_shared/api-factories";
import { createMutationHooks } from "@/features/_shared/react-query-factories";
import { createKeyFactory } from "@/lib/queryKeys";
import { useQuery } from "@tanstack/react-query";
import {
  courseFeedApi,
  courseApi,
  instructorChangeRequestApi,
  isCourseChangeRequestResult,
  courseWorkflowApi,
  lessonActivityApi,
  lessonApi,
  quizApi,
  type CourseReviewAction,
  type CourseFeedListParams,
  type CourseListParams,
  type LessonActivityListParams,
  type LessonListParams,
  type QuizListParams,
  type InstructorCourseMutationResult,
  type InstructorLessonDeleteResult,
  type InstructorLessonMutationResult,
  type CancelChangeRequestResponse,
} from "./course-management.api";
import type {
  CourseFormValues,
  InstructorCourse,
  InstructorLesson,
  InstructorLessonActivity,
  CourseFeedCreatePayload,
  CourseFeedItem,
  CourseFeedPage,
  CourseFeedUpsertPayload,
  InstructorQuiz,
  LessonFormValues,
  QuizEditorState,
} from "../types";
import type { ChangeRequestListParams } from "@/features/admin/types/change-request.types";

const courseCrudApiForHooks = {
  ...courseApi,
  update: async (id: number, data: CourseFormValues): Promise<InstructorCourse> => {
    const result = await courseApi.update(id, data);
    if (isCourseChangeRequestResult(result)) {
      throw new Error("Course update returned a change request");
    }
    return result;
  },
  updatePatch: async (id: number, data: CourseFormValues): Promise<InstructorCourse> => {
    const result = await courseApi.updatePatch(id, data);
    if (isCourseChangeRequestResult(result)) {
      throw new Error("Course patch returned a change request");
    }
    return result;
  },
};

const lessonCrudApiForHooks = {
  ...lessonApi,
  create: async (data: LessonFormValues): Promise<InstructorLesson> => {
    const result = await lessonApi.create(data);
    if (isCourseChangeRequestResult(result)) {
      throw new Error("Lesson create returned a change request");
    }
    return result;
  },
  update: async (id: number, data: LessonFormValues): Promise<InstructorLesson> => {
    const result = await lessonApi.update(id, data);
    if (isCourseChangeRequestResult(result)) {
      throw new Error("Lesson update returned a change request");
    }
    return result;
  },
  updatePatch: async (id: number, data: LessonFormValues): Promise<InstructorLesson> => {
    const result = await lessonApi.updatePatch(id, data);
    if (isCourseChangeRequestResult(result)) {
      throw new Error("Lesson patch returned a change request");
    }
    return result;
  },
  delete: async (id: number): Promise<{ success?: boolean }> => {
    const result = await lessonApi.delete(id);
    if (isCourseChangeRequestResult(result)) {
      throw new Error("Lesson delete returned a change request");
    }
    return result ?? { success: true };
  },
};

export const courseHooks = createCrudHooks<
  InstructorCourse,
  CourseFormValues,
  CourseFormValues,
  number,
  number,
  CourseListParams
>("instructor-course", courseCrudApiForHooks);

export const lessonHooks = createCrudHooks<
  InstructorLesson,
  LessonFormValues,
  LessonFormValues,
  number,
  number,
  LessonListParams
>("instructor-lesson", lessonCrudApiForHooks, {
  parentListKey: "courseId",
  parentListParamsBuilder: (courseId) => ({ courseId: Number(courseId) }),
});

export const lessonActivityHooks = createCrudHooks<
  InstructorLessonActivity,
  Omit<InstructorLessonActivity, "id">,
  Partial<InstructorLessonActivity>,
  number,
  number,
  LessonActivityListParams
>("instructor-lesson-activity", lessonActivityApi, {
  parentListKey: "lessonId",
  parentListParamsBuilder: (lessonId) => ({ lessonId: Number(lessonId) }),
});

export const quizHooks = createCrudHooks<
  InstructorQuiz,
  QuizEditorState,
  QuizEditorState,
  number,
  number,
  QuizListParams
>("instructor-quiz", quizApi, {
  parentListKey: "lessonActivityId",
  parentListParamsBuilder: (lessonActivityId) => ({
    lessonActivityId: Number(lessonActivityId),
  }),
});

export const courseFeedHooks = createCrudHooks<
  CourseFeedItem,
  CourseFeedCreatePayload,
  CourseFeedUpsertPayload,
  number,
  number,
  CourseFeedListParams,
  { message?: string }
>("instructor-course-feed", courseFeedApi);

export const {
  useListMine: useInstructorCourses,
  useDetail: useInstructorCourseById,
  useCreate: useCreateCourse,
  useUpdate: useUpdateCourseDirect,
  useDelete: useDeleteCourse,
} = courseHooks;

export const {
  useListByParent: useLessonsByCourseId,
  useDetail: useLessonById,
  useCreate: useCreateLessonDirect,
  useUpdate: useUpdateLessonDirect,
  useDelete: useDeleteLessonDirect,
} = lessonHooks;

export const {
  useListByParent: useLessonActivitiesByLessonId,
  useDetail: useLessonActivityById,
  useCreate: useCreateLessonActivity,
  useUpdate: useUpdateLessonActivity,
  useDelete: useDeleteLessonActivity,
} = lessonActivityHooks;

export const {
  useListByParent: useQuizzesByLessonActivityId,
  useDetail: useQuizById,
  useCreate: useCreateQuiz,
  useUpdatePatch: useUpdateQuiz,
  useDelete: useDeleteQuiz,
} = quizHooks;

export const {
  useListMine: useCourseFeeds,
  useDetail: useCourseFeedById,
  useCreate: useCreateCourseFeed,
  useUpdate: useUpdateCourseFeed,
  useDelete: useDeleteCourseFeed,
} = courseFeedHooks;

export const instructorCourseKeys = createKeyFactory("instructor-course");
export const instructorLessonKeys = createKeyFactory("instructor-lesson");
export const instructorChangeRequestKeys = createKeyFactory("instructor-course-change-requests");

export function useInstructorCourseChangeRequests(
  courseId: number | null,
  params?: Omit<ChangeRequestListParams, "courseId">,
  enabled = true,
) {
  return useQuery({
    queryKey: instructorChangeRequestKeys.custom("course", courseId, params ?? {}),
    queryFn: () => instructorChangeRequestApi.listByCourse(courseId as number, params),
    enabled: enabled && typeof courseId === "number",
    staleTime: 30 * 1000,
  });
}

function invalidateChangeRequestCache(
  queryClient: {
    invalidateQueries: (input: { queryKey: readonly unknown[] }) => void;
  },
  courseId?: number,
) {
  queryClient.invalidateQueries({ queryKey: instructorChangeRequestKeys.root });
  if (typeof courseId === "number") {
    queryClient.invalidateQueries({
      queryKey: instructorChangeRequestKeys.custom("course", courseId),
    });
  }
}

export const useCancelInstructorChangeRequest = createMutationHooks<
  CancelChangeRequestResponse,
  number
>(
  "instructor-course-change-requests",
  "cancel",
  (requestId) => instructorChangeRequestApi.cancel(requestId),
  {
    retry: false,
    onSuccess: (data, _variables, queryClient) => {
      invalidateChangeRequestCache(queryClient, data.courseId);
      invalidateCourseCache(queryClient, data.courseId);
    },
  },
);

function invalidateCourseCache(
  queryClient: {
    invalidateQueries: (input: { queryKey: readonly unknown[] }) => void;
  },
  courseId?: number,
) {
  queryClient.invalidateQueries({ queryKey: instructorCourseKeys.root });
  if (typeof courseId === "number") {
    queryClient.invalidateQueries({
      queryKey: instructorCourseKeys.detail(courseId),
    });
  }
}

export const useUpdateCourse = createMutationHooks<
  InstructorCourseMutationResult,
  { id: number; data: CourseFormValues }
>(
  "instructor-course",
  "update",
  ({ id, data }) => courseApi.update(id, data),
  {
    retry: false,
    onSuccess: (data, variables, queryClient) => {
      const courseId = isCourseChangeRequestResult(data) ? data.courseId : data.id;
      invalidateCourseCache(queryClient, courseId || variables.id);
      if (isCourseChangeRequestResult(data)) {
        invalidateChangeRequestCache(queryClient, data.courseId);
      }
    },
  },
);

export const useCreateLesson = createMutationHooks<
  InstructorLessonMutationResult,
  LessonFormValues
>(
  "instructor-lesson",
  "create",
  (payload) => lessonApi.create(payload),
  {
    retry: false,
    onSuccess: (data, variables, queryClient) => {
      queryClient.invalidateQueries({ queryKey: instructorLessonKeys.root });
      invalidateCourseCache(queryClient, variables.courseId);
      if (isCourseChangeRequestResult(data)) {
        invalidateChangeRequestCache(queryClient, data.courseId);
      }
    },
  },
);

export const useUpdateLesson = createMutationHooks<
  InstructorLessonMutationResult,
  { id: number; data: LessonFormValues }
>(
  "instructor-lesson",
  "update",
  ({ id, data }) => lessonApi.update(id, data),
  {
    retry: false,
    onSuccess: (data, variables, queryClient) => {
      queryClient.invalidateQueries({ queryKey: instructorLessonKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: instructorLessonKeys.root });
      const courseId = isCourseChangeRequestResult(data) ? data.courseId : data.courseId;
      invalidateCourseCache(queryClient, courseId);
      if (isCourseChangeRequestResult(data)) {
        invalidateChangeRequestCache(queryClient, data.courseId);
      }
    },
  },
);

export const useDeleteLesson = createMutationHooks<
  InstructorLessonDeleteResult,
  { id: number; courseId?: number }
>(
  "instructor-lesson",
  "delete",
  ({ id }) => lessonApi.delete(id),
  {
    retry: false,
    onSuccess: (data, variables, queryClient) => {
      queryClient.invalidateQueries({ queryKey: instructorLessonKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: instructorLessonKeys.root });
      const courseId = isCourseChangeRequestResult(data) ? data.courseId : variables.courseId;
      invalidateCourseCache(queryClient, courseId);
      if (isCourseChangeRequestResult(data)) {
        invalidateChangeRequestCache(queryClient, data.courseId);
      }
    },
  },
);
export const useSubmitCourseForReview = createMutationHooks<
  InstructorCourse,
  number
>(
  "instructor-course",
  "submitForReview",
  (courseId) => courseWorkflowApi.submitForReview(courseId),
  {
    retry: false,
    onSuccess: (data, _variables, queryClient) => {
      invalidateCourseCache(queryClient, data.id);
    },
  },
);

export const useReviewCourse = createMutationHooks<
  InstructorCourse,
  { courseId: number; status: CourseReviewAction }
>(
  "instructor-course",
  "review",
  ({ courseId, status }) => courseWorkflowApi.review(courseId, status),
  {
    retry: false,
    onSuccess: (data, _variables, queryClient) => {
      invalidateCourseCache(queryClient, data.id);
    },
  },
);

export const usePublishCourse = createMutationHooks<InstructorCourse, number>(
  "instructor-course",
  "publish",
  (courseId) => courseWorkflowApi.publish(courseId),
  {
    retry: false,
    onSuccess: (data, _variables, queryClient) => {
      invalidateCourseCache(queryClient, data.id);
    },
  },
);

export const useQuickPublishCourse = createMutationHooks<
  InstructorCourse,
  Pick<InstructorCourse, "id" | "status">
>(
  "instructor-course",
  "quickPublish",
  async ({ id, status }) => {
    if (status === "publish") {
      return courseWorkflowApi.publish(id);
    }

    if (status === "approved") {
      return courseWorkflowApi.publish(id);
    }

    if (status === "pending") {
      await courseWorkflowApi.review(id, "accepted");
      return courseWorkflowApi.publish(id);
    }

    if (status === "draft") {
      await courseWorkflowApi.submitForReview(id);
      await courseWorkflowApi.review(id, "accepted");
      return courseWorkflowApi.publish(id);
    }

    throw new Error(
      "Khóa học đang ở trạng thái rejected. Vui lòng chỉnh sửa và gửi duyệt lại.",
    );
  },
  {
    retry: false,
    onSuccess: (data, _variables, queryClient) => {
      invalidateCourseCache(queryClient, data.id);
    },
  },
);

type LessonQuizTypeFilter = "in_video" | "after_video";

export const lessonQuizKeys = createKeyFactory("lesson-quizzes");
export const courseFeedKeys = createKeyFactory("course-feed");

export async function invalidateLessonQuizCache(
  queryClient: {
    invalidateQueries: (input: { queryKey: readonly unknown[] }) => Promise<void>;
  },
  lessonId?: number | null,
) {
  const invalidations = [
    queryClient.invalidateQueries({ queryKey: lessonQuizKeys.root }),
  ];
  if (typeof lessonId === "number") {
    invalidations.push(
      queryClient.invalidateQueries({
        queryKey: lessonQuizKeys.custom("by-lesson", lessonId),
      }),
    );
  }
  await Promise.all(invalidations);
}

export async function invalidateCourseFeedCache(
  queryClient: {
    invalidateQueries: (input: { queryKey: readonly unknown[] }) => Promise<void>;
  },
  courseId?: number | null,
) {
  const invalidations = [
    queryClient.invalidateQueries({ queryKey: courseFeedKeys.root }),
  ];
  if (typeof courseId === "number") {
    invalidations.push(
      queryClient.invalidateQueries({
        queryKey: courseFeedKeys.custom("mine-page", courseId),
      }),
    );
  }
  await Promise.all(invalidations);
}

export function useQuizzesByLessonId(
  lessonId: number | null,
  type: LessonQuizTypeFilter,
  status?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: lessonQuizKeys.custom("by-lesson", lessonId, type, status ?? "all"),
    queryFn: () => quizApi.listByLesson(lessonId as number, type, status),
    enabled: enabled && lessonId !== null,
    staleTime: 60 * 1000,
  });
}

export function useQuizTimelineByLessonId(
  lessonId: number | null,
  status?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: lessonQuizKeys.custom("timeline", lessonId, status ?? "all"),
    queryFn: () => quizApi.listTimelineByLesson(lessonId as number, status),
    enabled: enabled && lessonId !== null,
    staleTime: 60 * 1000,
  });
}

type MediaVideoRaw = {
  id: number;
  name?: string | null;
  url: string;
  thumbnail?: string | null;
  duration?: number | null;
  type?: string;
  srt_raw_url?: string | null;
  original_video_id?: number | null;
  editing_job_id?: string | null;
  is_used_in_feed?: boolean;
  isUsedInFeed?: boolean;
};

export function useCourseFeed(
  courseId: number | null,
  enabled = true,
  params: CourseFeedListParams = {},
) {
  return useCourseFeeds(
    { courseId: courseId ?? undefined, ...params },
    enabled && courseId !== null,
  );
}

export function useCourseFeedPage(
  courseId: number | null,
  enabled = true,
  params: CourseFeedListParams = {},
) {
  return useQuery({
    queryKey: courseFeedKeys.custom("mine-page", courseId, params),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (courseId !== null) {
        searchParams.set("courseId", String(courseId));
      }
      Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          searchParams.set(key, String(value));
        }
      });

      const { data } = await apiHttpClient.get<CourseFeedPage>(
        `/media/feed/mine?${searchParams.toString()}`,
      );

      return {
        data: Array.isArray(data.data) ? data.data : [],
        pagination: data.pagination ?? {
          page: Number(params.page ?? 1),
          pageSize: Number(params.pageSize ?? 20),
          total: Array.isArray(data.data) ? data.data.length : 0,
          totalPages: 1,
        },
      };
    },
    enabled: enabled && courseId !== null,
    staleTime: 60 * 1000,
  });
}

type MediaVideoListResponse = MediaVideoRaw[] | { data?: MediaVideoRaw[] };

function readMediaVideos(payload: MediaVideoListResponse): MediaVideoRaw[] {
  if (Array.isArray(payload)) return payload;
  return Array.isArray(payload.data) ? payload.data : [];
}

type CourseFeedCandidateVideoOptions = {
  includeUsed?: boolean;
};


export function useCourseFeedCandidateVideos(
  courseId: number | null,
  enabled = true,
  options: CourseFeedCandidateVideoOptions = {},
) {
  const includeUsed = options.includeUsed === true;

  return useQuery({
    queryKey: courseFeedKeys.custom(
      "candidate-videos",
      courseId,
      includeUsed ? "full" : "available",
    ),
    queryFn: async () => {
      const videoParams = {
        page: 1,
        limit: 100,
        ...(includeUsed
          ? { includeFeedUsage: true }
          : { availableForFeed: true }),
      };

      const [highlightResponse, mascotResponse] = await Promise.all([
        apiHttpClient.get<MediaVideoListResponse>(
          "/media/videos/user/highlight",
          { params: videoParams },
        ),
        apiHttpClient.get<MediaVideoListResponse>(
          "/media/videos/user/mascot",
          { params: videoParams },
        ),
      ]);

      const resolvedVideos = [
        ...readMediaVideos(highlightResponse.data),
        ...readMediaVideos(mascotResponse.data),
      ];

      return resolvedVideos
        .filter((video) => Boolean(video.url))
        .filter(
          (video, index, allVideos) =>
            index === allVideos.findIndex((item) => item.id === video.id),
        )
        .map((video) => ({
          id: video.id,
          name: video.name?.trim() || "Video chưa đặt tên",
          url: video.url,
          thumbnail: video.thumbnail ?? null,
          duration: video.duration ?? null,
          type: video.type ?? "unknown",
          srt_raw_url: video.srt_raw_url ?? null,
          original_video_id: video.original_video_id ?? null,
          editing_job_id: video.editing_job_id ?? null,
          isUsedInFeed: Boolean(video.is_used_in_feed ?? video.isUsedInFeed),
        }));
    },
    enabled: enabled && courseId !== null,
    staleTime: 60 * 1000,
  });
}
