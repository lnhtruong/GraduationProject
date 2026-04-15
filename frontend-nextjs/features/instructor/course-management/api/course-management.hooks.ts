import { createCrudHooks } from "@/features/_shared/crud-factories";
import { apiHttpClient } from "@/features/_shared/api-factories";
import { createKeyFactory } from "@/lib/queryKeys";
import { useQuery } from "@tanstack/react-query";
import {
  courseFeedApi,
  courseApi,
  lessonActivityApi,
  lessonApi,
  quizApi,
  type CourseFeedListParams,
  type CourseListParams,
  type LessonActivityListParams,
  type LessonListParams,
  type QuizListParams,
} from "./course-management.api";
import type {
  CourseFormValues,
  InstructorCourse,
  InstructorLesson,
  InstructorLessonActivity,
  CourseFeedCreatePayload,
  CourseFeedItem,
  CourseFeedUpsertPayload,
  InstructorQuiz,
  LessonFormValues,
  QuizEditorState,
} from "../types";

export const courseHooks = createCrudHooks<
  InstructorCourse,
  CourseFormValues,
  CourseFormValues,
  number,
  number,
  CourseListParams
>("instructor-course", courseApi);

export const lessonHooks = createCrudHooks<
  InstructorLesson,
  LessonFormValues,
  LessonFormValues,
  number,
  number,
  LessonListParams
>("instructor-lesson", lessonApi, {
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
  useList: useInstructorCourses,
  useDetail: useInstructorCourseById,
  useCreate: useCreateCourse,
  useUpdate: useUpdateCourse,
  useDelete: useDeleteCourse,
} = courseHooks;

export const {
  useListByParent: useLessonsByCourseId,
  useDetail: useLessonById,
  useCreate: useCreateLesson,
  useUpdate: useUpdateLesson,
  useDelete: useDeleteLesson,
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
  useList: useCourseFeeds,
  useDetail: useCourseFeedById,
  useCreate: useCreateCourseFeed,
  useUpdate: useUpdateCourseFeed,
  useDelete: useDeleteCourseFeed,
} = courseFeedHooks;

type LessonQuizTypeFilter = "in_video" | "after_video";

const lessonQuizKeys = createKeyFactory("lesson-quizzes");
const courseFeedKeys = createKeyFactory("course-feed");

export function useQuizzesByLessonId(
  lessonId: number | null,
  type: LessonQuizTypeFilter,
  enabled = true,
) {
  return useQuery({
    queryKey: lessonQuizKeys.custom("by-lesson", lessonId, type),
    queryFn: async () => {
      const { data } = await apiHttpClient.get<InstructorQuiz[]>(
        `/course/quizzes/lesson/${lessonId}`,
        {
          params: { type },
        },
      );
      return data;
    },
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
};

export function useCourseFeed(courseId: number | null, enabled = true) {
  return useCourseFeeds(
    { courseId: courseId ?? undefined },
    enabled && courseId !== null,
  );
}

export function useCourseFeedCandidateVideos(
  courseId: number | null,
  enabled = true,
) {
  return useQuery({
    queryKey: courseFeedKeys.custom("candidate-videos", courseId),
    queryFn: async () => {
      const [highlightResponse, mascotResponse] = await Promise.all([
        apiHttpClient.get<MediaVideoRaw[]>("/media/videos/user/highlight"),
        apiHttpClient.get<MediaVideoRaw[]>("/media/videos/user/mascot"),
      ]);

      const resolvedVideos = [
        ...(Array.isArray(highlightResponse.data)
          ? highlightResponse.data
          : []),
        ...(Array.isArray(mascotResponse.data) ? mascotResponse.data : []),
      ];

      return resolvedVideos
        .filter((video) => Boolean(video.url))
        .filter(
          (video, index, allVideos) =>
            index === allVideos.findIndex((item) => item.id === video.id),
        )
        .map((video) => ({
          id: video.id,
          name: video.name?.trim() || `Video #${video.id}`,
          url: video.url,
          thumbnail: video.thumbnail ?? null,
          duration: video.duration ?? null,
          type: video.type ?? "unknown",
        }));
    },
    enabled: enabled && courseId !== null,
    staleTime: 60 * 1000,
  });
}
