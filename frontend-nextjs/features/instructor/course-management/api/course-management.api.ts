import {
  createResourceApi,
  withQueryPath,
} from "@/features/_shared/crud-factories";
import type {
  CourseFeedCreatePayload,
  CourseFeedItem,
  CourseFeedUpsertPayload,
  CourseFormValues,
  CourseStatus,
  InstructorCourse,
  InstructorLesson,
  InstructorLessonActivity,
  InstructorQuiz,
  QuizQuestionType,
  LessonFormValues,
  QuizEditorState,
} from "../types";

type CourseListParams = {
  userId?: number;
  status?: CourseStatus;
  page?: number;
  limit?: number;
};

export type LessonListParams = {
  courseId?: number;
};

export type LessonActivityListParams = {
  lessonId?: number;
};

export type QuizListParams = {
  lessonActivityId?: number;
};

export type CourseFeedListParams = {
  courseId?: number;
};

type QuizListResponse = {
  data?: InstructorQuiz[];
};

type LessonListResponse = {
  data?: InstructorLesson[];
};

type CourseListResponse = {
  data?: InstructorCourse[];
};

type FeedListResponse = {
  data?: CourseFeedItem[];
  next_cursor?: number | null;
};

const DURATION_TIME_REGEX = /^\d{2,3}:[0-5]\d:[0-5]\d(\.\d{1,3})?$/;

function toTimeDuration(value?: number | string | null): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (DURATION_TIME_REGEX.test(trimmed)) {
      return trimmed;
    }

    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return "00:00:00";
    }

    value = parsed;
  }

  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return "00:00:00";
  }

  // Current lesson form stores duration in minutes, convert it to HH:MM:SS.
  const totalSeconds = Math.max(0, Math.round(value * 60));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function toLessonPayload(payload: LessonFormValues) {
  return {
    ...payload,
    duration: toTimeDuration(payload.duration),
  };
}

function toCoursePayload(payload: CourseFormValues) {
  return {
    name: payload.name,
    description: payload.description,
    categories: payload.categories,
    level: payload.level,
    duration: payload.duration,
    language: payload.language,
    price: payload.price,
    status: payload.status,
  };
}

function toQuizPayload(payload: QuizEditorState) {
  return {
    lessonActivityId: payload.lessonActivityId as number,
    name: payload.title,
    shuffleQuestion: payload.shuffleQuestion,
    shuffleOption: payload.shuffleOption,
    passingScore: payload.passingScore,
    timeLimitMinutes: payload.timeLimitMinutes,
    isInVideo: payload.isInVideo,
    questions: payload.questions.map((question, index) => ({
      quesType: "mcq" as QuizQuestionType,
      quesText: question.prompt,
      point: 1,
      correctAns:
        question.options.find((option) => option.isCorrect)?.label ?? "",
      orderIndex: index + 1,
      videoTimestamp: payload.isInVideo
        ? question.videoTimestamp?.trim() || undefined
        : undefined,
      options: question.options.map((option, optionIndex) => ({
        optionText: option.label,
        isCorrect: option.isCorrect,
        orderIndex: optionIndex + 1,
      })),
    })),
  };
}

const courseCrudApi = createResourceApi<
  InstructorCourse,
  InstructorCourse,
  CourseFormValues,
  CourseFormValues,
  number,
  CourseListParams,
  { message?: string },
  CourseListResponse | InstructorCourse[]
>({
  basePath: "/course/courses",
  mapItem: (item) => item,
  mapListResponse: (raw) => (Array.isArray(raw) ? raw : (raw.data ?? [])),
  toCreatePayload: toCoursePayload,
  toUpdatePayload: toCoursePayload,
  toPatchPayload: toCoursePayload,
  getListPath: (params) => withQueryPath("/course/courses", params),
});

export const courseApi = courseCrudApi;

const lessonCrudApi = createResourceApi<
  InstructorLesson,
  InstructorLesson,
  LessonFormValues,
  LessonFormValues,
  number,
  LessonListParams,
  { success?: boolean },
  LessonListResponse | InstructorLesson[]
>({
  basePath: "/course/lessons",
  mapItem: (item) => item,
  mapListResponse: (raw) => (Array.isArray(raw) ? raw : (raw.data ?? [])),
  toCreatePayload: toLessonPayload,
  toUpdatePayload: toLessonPayload,
  toPatchPayload: toLessonPayload,
  getListPath: (params) =>
    withQueryPath("/course/lessons/course", {
      courseId: params?.courseId,
      page: 1,
      limit: 100,
    }),
});

export const lessonApi = lessonCrudApi;

const lessonActivityCrudApi = createResourceApi<
  InstructorLessonActivity,
  InstructorLessonActivity,
  Omit<InstructorLessonActivity, "id">,
  Partial<InstructorLessonActivity>,
  number,
  LessonActivityListParams,
  { success?: boolean }
>({
  basePath: "/course/lesson-activities",
  mapItem: (item) => item,
  getListPath: (params) => withQueryPath("/course/lesson-activities", params),
});

export const lessonActivityApi = lessonActivityCrudApi;

const quizCrudApi = createResourceApi<
  InstructorQuiz,
  InstructorQuiz,
  QuizEditorState,
  QuizEditorState,
  number,
  QuizListParams,
  { success?: boolean },
  QuizListResponse | InstructorQuiz[]
>({
  basePath: "/course/quizzes",
  mapItem: (item) => item,
  mapListResponse: (raw) => (Array.isArray(raw) ? raw : (raw.data ?? [])),
  toCreatePayload: (payload) => {
    if (!payload.lessonActivityId) {
      throw new Error("Missing lessonActivityId when creating quiz");
    }
    return toQuizPayload(payload);
  },
  toPatchPayload: toQuizPayload,
  getListPath: (params) => withQueryPath("/course/quizzes", params),
});

export const quizApi = quizCrudApi;

const courseFeedCrudApi = createResourceApi<
  CourseFeedItem,
  CourseFeedItem,
  CourseFeedCreatePayload,
  CourseFeedUpsertPayload,
  number,
  CourseFeedListParams,
  { message?: string },
  FeedListResponse | CourseFeedItem[]
>({
  basePath: "/media/feed",
  mapItem: (item) => item,
  mapListResponse: (raw) => (Array.isArray(raw) ? raw : (raw.data ?? [])),
  getListPath: (params) =>
    withQueryPath("/media/feed", {
      courseId: params?.courseId,
      limit: 100,
    }),
  getOnePath: (id) => `/media/feed/${id}`,
  getUpdatePath: (id) => `/media/feed/${id}`,
  getDeletePath: (id) => `/media/feed/${id}`,
});

export const courseFeedApi = courseFeedCrudApi;

export type { CourseListParams };
