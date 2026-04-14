import { createCrudHooks } from "@/features/_shared/crud-factories";
import {
  courseApi,
  lessonActivityApi,
  lessonApi,
  quizApi,
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
