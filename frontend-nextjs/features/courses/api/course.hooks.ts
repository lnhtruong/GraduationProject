/**
 * Course Hooks
 * TanStack Query hooks for course CRUD
 */

import { createCrudHooks } from "@/features/_shared/crud-factories";
import { courseApi } from "./course.api";
import type {
	CourseItem,
	CourseListParams,
	CreateCourseRequest,
	UpdateCourseRequest,
} from "../types";

export const courseHooks = createCrudHooks<
	CourseItem,
	CreateCourseRequest,
	UpdateCourseRequest,
	number,
	number,
	CourseListParams
>("course", courseApi);

export const courseKeys = courseHooks.keys;

export const {
	useDetail: useCourseById,
	useList: useCourses,
	useCreate: useCreateCourse,
	useUpdate: useUpdateCourse,
	useDelete: useDeleteCourse,
} = courseHooks;
