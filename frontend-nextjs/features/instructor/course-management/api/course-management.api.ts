import {
  type Course,
  type CreateCoursePayload,
  type CourseListParams,
  type CourseReviewAction,
  courseApi as baseCourseApi,
  courseWorkflowApi as baseCourseWorkflowApi,
} from "@/features/courses/api/course.api";
import {
  type CreateLessonPayload,
  type LessonActivityListParams,
  type LessonListParams,
  lessonActivityApi,
  lessonApi as baseLessonApi,
} from "@/features/lessons/api/lesson.api";
import {
  type CreateQuizPayload,
  type QuizListParams,
  quizApi as baseQuizApi,
} from "@/features/quizzes/api/quizz.api";
import {
  createResourceApi,
  withQueryPath,
} from "@/features/_shared/crud-factories";
import type {
  CourseFeedCreatePayload,
  CourseFeedItem,
  CourseFeedUpsertPayload,
  CourseFormValues,
  InstructorCourse,
  InstructorLesson,
  InstructorQuiz,
  QuizQuestionType,
  LessonFormValues,
  QuizEditorState,
} from "../types";

export type CourseFeedListParams = {
  courseId?: number;
  status?: "active" | "hidden" | "removed";
  page?: number;
  pageSize?: number;
  sortBy?: "created_at" | "id" | "title";
  order?: "asc" | "desc";
};

type FeedListResponse = {
  data?: CourseFeedItem[];
  next_cursor?: number | null;
};

type FeedItemResponse = CourseFeedItem | { data?: CourseFeedItem | null };

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

  const totalMillis = Math.max(0, Math.round(value * 1000));
  const totalSeconds = Math.floor(totalMillis / 1000);
  const milliseconds = totalMillis % 1000;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(milliseconds).padStart(3, "0")}`;
}

function toLessonPayload(payload: LessonFormValues) {
  return {
    ...payload,
    duration: toTimeDuration(payload.duration),
  } satisfies CreateLessonPayload;
}

function toCoursePayload(payload: CourseFormValues) {
  return {
    name: payload.name,
    description: payload.description,
    thumbnailUrl: payload.thumbnailUrl ?? undefined,
    categories: payload.categories,
    level: payload.level,
    language: payload.language,
    price: payload.price,
  } satisfies CreateCoursePayload;
}

function toQuizPayload(payload: QuizEditorState) {
  const fallbackTimestamp = payload.questions.find((q) => q.videoTimestamp?.trim())?.videoTimestamp?.trim() || "00:00:00.000";

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
        ? question.videoTimestamp?.trim() || fallbackTimestamp
        : undefined,
      options: question.options.map((option, optionIndex) => ({
        optionText: option.label,
        isCorrect: option.isCorrect,
        orderIndex: optionIndex + 1,
      })),
    })),
  } satisfies CreateQuizPayload;
}

function toInstructorCourse(item: Course): InstructorCourse {
  return {
    ...item,
    duration: item.duration ?? "00:00:00",
  };
}

export const courseApi = {
  list: (params?: CourseListParams): Promise<InstructorCourse[]> =>
    (baseCourseApi.list?.(params) ?? Promise.resolve([])).then((items) =>
      items.map(toInstructorCourse),
    ),
  listMine: (params?: CourseListParams): Promise<InstructorCourse[]> =>
    (baseCourseApi.listMine?.(params) ?? Promise.resolve([])).then((items) =>
      items.map(toInstructorCourse),
    ),
  getOne: (id: number): Promise<InstructorCourse> =>
    baseCourseApi.getOne(id).then(toInstructorCourse),
  create: (payload: CourseFormValues): Promise<InstructorCourse> =>
    baseCourseApi.create(toCoursePayload(payload)).then(toInstructorCourse),
  update: (id: number, payload: CourseFormValues): Promise<InstructorCourse> =>
    baseCourseApi.update(id, toCoursePayload(payload)).then(toInstructorCourse),
  updatePatch: (
    id: number,
    payload: CourseFormValues,
  ): Promise<InstructorCourse> =>
    baseCourseApi.updatePatch
      ? baseCourseApi
          .updatePatch(id, toCoursePayload(payload))
          .then(toInstructorCourse)
      : baseCourseApi
          .update(id, toCoursePayload(payload))
          .then(toInstructorCourse),
  delete: (id: number) => baseCourseApi.delete(id),
};

export const courseWorkflowApi = {
  submitForReview: async (courseId: number): Promise<InstructorCourse> => {
    const updated = await baseCourseWorkflowApi.submitForReview(courseId);
    return toInstructorCourse(updated);
  },
  review: async (
    courseId: number,
    status: CourseReviewAction,
  ): Promise<InstructorCourse> => {
    const updated = await baseCourseWorkflowApi.review(courseId, status);
    return toInstructorCourse(updated);
  },
  publish: async (courseId: number): Promise<InstructorCourse> => {
    const updated = await baseCourseWorkflowApi.publish(courseId);
    return toInstructorCourse(updated);
  },
};

export const lessonApi = {
  list: (params?: LessonListParams): Promise<InstructorLesson[]> =>
    baseLessonApi.list?.(params) ?? Promise.resolve([]),
  getOne: (id: number): Promise<InstructorLesson> => baseLessonApi.getOne(id),
  create: (payload: LessonFormValues): Promise<InstructorLesson> =>
    baseLessonApi.create(toLessonPayload(payload)),
  update: (id: number, payload: LessonFormValues): Promise<InstructorLesson> =>
    baseLessonApi.update(id, toLessonPayload(payload)),
  updatePatch: (
    id: number,
    payload: LessonFormValues,
  ): Promise<InstructorLesson> =>
    baseLessonApi.updatePatch
      ? baseLessonApi.updatePatch(id, toLessonPayload(payload))
      : baseLessonApi.update(id, toLessonPayload(payload)),
  delete: (id: number) => baseLessonApi.delete(id),
};

export const quizApi = {
  list: (params?: QuizListParams): Promise<InstructorQuiz[]> =>
    baseQuizApi.list?.(params) ?? Promise.resolve([]),
  getOne: (id: number): Promise<InstructorQuiz> => baseQuizApi.getOne(id),
  create: (payload: QuizEditorState): Promise<InstructorQuiz> => {
    if (!payload.lessonActivityId) {
      throw new Error("Missing lessonActivityId when creating quiz");
    }
    return baseQuizApi.create(toQuizPayload(payload));
  },
  update: (id: number, payload: QuizEditorState): Promise<InstructorQuiz> =>
    baseQuizApi.update(id, toQuizPayload(payload)),
  updatePatch: (
    id: number,
    payload: QuizEditorState,
  ): Promise<InstructorQuiz> =>
    baseQuizApi.updatePatch
      ? baseQuizApi.updatePatch(id, toQuizPayload(payload))
      : baseQuizApi.update(id, toQuizPayload(payload)),
  delete: (id: number) => baseQuizApi.delete(id),
  listByLesson: baseQuizApi.listByLesson,
};

const courseFeedCrudApi = createResourceApi<
  FeedItemResponse,
  CourseFeedItem,
  CourseFeedCreatePayload,
  CourseFeedUpsertPayload,
  number,
  CourseFeedListParams,
  { message?: string },
  FeedListResponse | CourseFeedItem[]
>({
  basePath: "/media/feed",
  mapItem: (item) => {
    if ("feed_id" in item) {
      return item;
    }
    return item.data ?? ({} as CourseFeedItem);
  },
  mapListResponse: (raw) => (Array.isArray(raw) ? raw : (raw.data ?? [])),
  getListPath: (params) => withQueryPath("/media/feed", params),
  getOnePath: (id) => `/media/feed/${id}`,
  getUpdatePath: (id) => `/media/feed/${id}`,
  getDeletePath: (id) => `/media/feed/${id}`,
  updateMethod: "put",
});

const courseFeedMineCrudApi = createResourceApi<
  FeedItemResponse,
  CourseFeedItem,
  CourseFeedCreatePayload,
  CourseFeedUpsertPayload,
  number,
  CourseFeedListParams,
  { message?: string },
  FeedListResponse | CourseFeedItem[]
>({
  basePath: "/media/feed/mine",
  mapItem: (item) => {
    if ("feed_id" in item) {
      return item;
    }
    return item.data ?? ({} as CourseFeedItem);
  },
  mapListResponse: (raw) => (Array.isArray(raw) ? raw : (raw.data ?? [])),
  getListPath: (params) => withQueryPath("/media/feed/mine", params),
  getOnePath: (id) => `/media/feed/${id}`,
  getUpdatePath: (id) => `/media/feed/${id}`,
  getDeletePath: (id) => `/media/feed/${id}`,
  updateMethod: "put",
});

export const courseFeedApi = {
  ...courseFeedCrudApi,
  listMine: courseFeedMineCrudApi.list,
};
export { lessonActivityApi };

export type {
  CourseListParams,
  CourseReviewAction,
  LessonActivityListParams,
  LessonListParams,
  QuizListParams,
};
