/**
 * Course API
 * CRUD endpoints for courses
 */

import {
	apiHttpClient,
	createApi,
} from "@/features/_shared/api-factories";
import { createResourceApi } from "@/features/_shared/crud-factories";
import type {
	CourseItem,
	CourseLevel,
	CourseListParams,
	CourseStatus,
	CreateCourseRequest,
	DeleteCourseResponse,
	UpdateCourseRequest,
} from "../types";

const COURSE_ENDPOINT = "/courses";

type CourseApiResponse = {
	id?: number;
	name?: string;
	description?: string;
	categories?: unknown;
	level?: string;
	duration?: string;
	language?: string;
	price?: number;
	userId?: number;
	user_id?: number;
	status?: string;
	createdAt?: string;
	updatedAt?: string;
	created_at?: string;
	updated_at?: string;
};

type CourseListApiResponse =
	| CourseApiResponse[]
	| {
			data?: CourseApiResponse[];
		};

function toCourseLevel(value?: string): CourseLevel {
	if (value === "Intermediate") return "Intermediate";
	if (value === "Advanced") return "Advanced";
	return "Beginner";
}

function toCourseStatus(value?: string): CourseStatus {
	if (value === "pending") return "pending";
	if (value === "approved") return "approved";
	if (value === "rejected") return "rejected";
	if (value === "publish") return "publish";
	return "draft";
}

function mapCategories(raw: unknown): string[] {
	if (!Array.isArray(raw)) return [];
	return raw
		.map((item) => (typeof item === "string" ? item.trim() : ""))
		.filter(Boolean);
}

function mapCourse(raw: CourseApiResponse): CourseItem {
	return {
		id: raw.id ?? 0,
		name: raw.name ?? "",
		description: raw.description,
		categories: mapCategories(raw.categories),
		level: toCourseLevel(raw.level),
		duration: raw.duration ?? "00:00:00",
		language: raw.language ?? "Vietnamese",
		price: raw.price ?? 0,
		userId: raw.userId ?? raw.user_id ?? 0,
		status: toCourseStatus(raw.status),
		createdAt: raw.createdAt ?? raw.created_at,
		updatedAt: raw.updatedAt ?? raw.updated_at,
	};
}

function buildListPath(params?: CourseListParams): string {
	if (!params) return COURSE_ENDPOINT;

	const query = new URLSearchParams();

	if (typeof params.userId === "number") {
		query.set("userId", String(params.userId));
	}

	if (params.status) {
		query.set("status", params.status);
	}

	if (typeof params.page === "number") {
		query.set("page", String(params.page));
	}

	if (typeof params.limit === "number") {
		query.set("limit", String(params.limit));
	}

	const queryString = query.toString();
	return queryString ? `${COURSE_ENDPOINT}?${queryString}` : COURSE_ENDPOINT;
}

const courseCrudApi = createResourceApi<
	CourseApiResponse,
	CourseItem,
	CreateCourseRequest,
	UpdateCourseRequest,
	number,
	CourseListParams,
	DeleteCourseResponse
>({
	basePath: COURSE_ENDPOINT,
	mapItem: mapCourse,
	getListPath: buildListPath,
});

async function listCourses(params?: CourseListParams): Promise<CourseItem[]> {
	const { data } = await apiHttpClient.get<CourseListApiResponse>(
		buildListPath(params),
	);

	const rawItems = Array.isArray(data) ? data : (data.data ?? []);
	return rawItems.map(mapCourse);
}

export const courseApi = createApi({
	...courseCrudApi,
	list: listCourses,
	findById: courseCrudApi.getOne,
	getAll: listCourses,
	updateById: courseCrudApi.update,
	deleteById: courseCrudApi.delete,
});
