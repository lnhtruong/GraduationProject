import { createCrudHooks } from "@/features/_shared/crud-factories";
import {
	lessonActivityApi,
	lessonApi,
} from "./lesson.api";
import type {
	CreateLessonActivityPayload,
	CreateLessonPayload,
	Lesson,
	LessonActivity,
	LessonActivityListParams,
	LessonListParams,
	UpdateLessonActivityPayload,
	UpdateLessonPayload,
} from "../types";

export const lessonHooks = createCrudHooks<
	Lesson,
	CreateLessonPayload,
	UpdateLessonPayload,
	number,
	number,
	LessonListParams
>("lesson", lessonApi, {
	parentListKey: "courseId",
	parentListParamsBuilder: (courseId) => ({ courseId: Number(courseId) }),
});

export const lessonActivityHooks = createCrudHooks<
	LessonActivity,
	CreateLessonActivityPayload,
	UpdateLessonActivityPayload,
	number,
	number,
	LessonActivityListParams
>("lesson-activity", lessonActivityApi, {
	parentListKey: "lessonId",
	parentListParamsBuilder: (lessonId) => ({ lessonId: Number(lessonId) }),
});

export const lessonKeys = lessonHooks.keys;
export const lessonActivityKeys = lessonActivityHooks.keys;

export const {
	useList: useLessons,
	useListByParent: useLessonsByCourseId,
	useDetail: useLessonById,
	useCreate: useCreateLesson,
	useUpdate: useUpdateLesson,
	useDelete: useDeleteLesson,
} = lessonHooks;

export const {
	useList: useLessonActivities,
	useListByParent: useLessonActivitiesByLessonId,
	useDetail: useLessonActivityById,
	useCreate: useCreateLessonActivity,
	useUpdate: useUpdateLessonActivity,
	useDelete: useDeleteLessonActivity,
} = lessonActivityHooks;
