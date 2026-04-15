import {
  createResourceApi,
  withQueryPath,
} from "@/features/_shared/crud-factories";
import type {
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

type QuizListResponse = {
  data?: InstructorQuiz[];
};

type LessonListResponse = {
  data?: InstructorLesson[];
};

type CourseListResponse = {
  data?: InstructorCourse[];
};

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

export type { CourseListParams };
