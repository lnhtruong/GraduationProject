import {
	createResourceApi,
	withQueryPath,
} from "@/features/_shared/crud-factories";
import { apiHttpClient } from "@/features/_shared/api-factories";
import type {
	Course,
	CourseLevel,
	CourseListParams,
	CourseReviewAction,
	CourseStatus,
	CreateCoursePayload,
	UpdateCoursePayload,
} from "../types";

type CourseListResponse = {
	data?: CourseApiResponse[];
};

type CourseApiResponse = {
	id?: number;
	name?: string;
	description?: string;
	categories?: string[];
	level?: CourseLevel;
	duration?: string;
	language?: string;
	price?: number;
	userId?: number;
	status?: CourseStatus;
	created_at?: string;
	updated_at?: string;
};

function mapCourse(raw: CourseApiResponse): Course {
	return {
		id: raw.id ?? 0,
		name: raw.name ?? "",
		description: raw.description ?? "",
		categories: Array.isArray(raw.categories) ? raw.categories : [],
		level: raw.level ?? "Beginner",
		duration: raw.duration,
		language: raw.language ?? "vi",
		price: raw.price ?? 0,
		userId: raw.userId ?? 0,
		status: raw.status ?? "draft",
		created_at: raw.created_at,
		updated_at: raw.updated_at,
	};
}

const courseCrudApi = createResourceApi<
	CourseApiResponse,
	Course,
	CreateCoursePayload,
	UpdateCoursePayload,
	number,
	CourseListParams,
	{ message?: string },
	CourseListResponse | CourseApiResponse[]
>({
	basePath: "/course/courses",
	mapItem: mapCourse,
	mapListResponse: (raw) => (Array.isArray(raw) ? raw.map(mapCourse) : (raw.data ?? []).map(mapCourse)),
	getListPath: (params) => withQueryPath("/course/courses", params),
});

export const courseApi = {
	...courseCrudApi,
	findById: courseCrudApi.getOne,
	getAll: (params?: CourseListParams) =>
		courseCrudApi.list?.(params) ?? Promise.resolve([]),
	listMine: async (params?: CourseListParams) => {
		// Backend exposes a dedicated "mine" endpoint for instructor-owned courses
		try {
			const { data } = await apiHttpClient.get<CourseListResponse>(
				"/course/courses/mine",
			);
			return (Array.isArray(data) ? data : data.data ?? []).map(mapCourse);
		} catch (err) {
			return [];
		}
	},
};

export const courseWorkflowApi = {
	submitForReview: async (courseId: number) => {
		const { data } = await apiHttpClient.post<CourseApiResponse>(
			`/course/courses/${courseId}/submit-for-review`,
		);
		return mapCourse(data);
	},
	review: async (courseId: number, status: CourseReviewAction) => {
		const { data } = await apiHttpClient.post<CourseApiResponse>(
			`/course/courses/${courseId}/review`,
			{ status },
		);
		return mapCourse(data);
	},
	publish: async (courseId: number) => {
		const { data } = await apiHttpClient.post<CourseApiResponse>(
			`/course/courses/${courseId}/publish`,
		);
		return mapCourse(data);
	},
};

export type {
	Course,
	CourseListParams,
	CourseReviewAction,
	CourseStatus,
	CreateCoursePayload,
	UpdateCoursePayload,
} from "../types";
