import { apiHttpClient } from "@/features/_shared/api-factories";
import {
	createResourceApi,
	withQueryPath,
} from "@/features/_shared/crud-factories";
import type {
	AddManyRoadmapCoursesPayload,
	Roadmap,
	RoadmapCourse,
	RoadmapCourseFormValues,
	RoadmapFormValues,
	RoadmapListParams,
	ReorderRoadmapCoursesPayload,
} from "../types";

type RoadmapListResponse = {
	data?: Roadmap[];
	pagination?: {
		page: number;
		limit: number;
		totalItems: number;
		totalPages: number;
	};
};

type RoadmapCourseCreatePayload = {
	roadmapId: number;
	data: RoadmapCourseFormValues;
};

type RoadmapCourseId = string;

function buildRoadmapCourseKey(roadmapId: number, courseId: number): string {
	return `${roadmapId}:${courseId}`;
}

function parseRoadmapCourseKey(key: string): {
	roadmapId: number;
	courseId: number;
} {
	const [rawRoadmapId, rawCourseId] = key.split(":");

	return {
		roadmapId: Number(rawRoadmapId),
		courseId: Number(rawCourseId),
	};
}

const roadmapCrudApi = createResourceApi<
	Roadmap,
	Roadmap,
	RoadmapFormValues,
	RoadmapFormValues,
	number,
	RoadmapListParams,
	void,
	RoadmapListResponse | Roadmap[]
>({
	basePath: "/course/roadmaps",
	mapItem: (item) => item,
	mapListResponse: (raw) => (Array.isArray(raw) ? raw : raw.data ?? []),
	getListPath: (params) =>
		withQueryPath("/course/roadmaps", {
			userId: params?.userId,
			page: params?.page,
			limit: params?.limit,
		}),
});

const roadmapCourseCrudApi = createResourceApi<
	RoadmapCourse,
	RoadmapCourse,
	RoadmapCourseCreatePayload,
	RoadmapCourseFormValues,
	RoadmapCourseId,
	unknown,
	RoadmapCourse | void
>({
	basePath: "/course/roadmaps",
	mapItem: (item) => item,
	toCreatePayload: (payload) => payload.data,
	getCreatePath: (payload) => `/course/roadmaps/${payload.roadmapId}/courses`,
	getOnePath: (id) => {
		const parsed = parseRoadmapCourseKey(id);
		return `/course/roadmaps/${parsed.roadmapId}/courses/${parsed.courseId}`;
	},
	getUpdatePath: (id) => {
		const parsed = parseRoadmapCourseKey(id);
		return `/course/roadmaps/${parsed.roadmapId}/courses/${parsed.courseId}`;
	},
	getDeletePath: (id) => {
		const parsed = parseRoadmapCourseKey(id);
		return `/course/roadmaps/${parsed.roadmapId}/courses/${parsed.courseId}`;
	},
});

export const roadmapApi = roadmapCrudApi;

export const roadmapCourseApi = {
	addCourse: (roadmapId: number, data: RoadmapCourseFormValues) =>
		roadmapCourseCrudApi.create({ roadmapId, data }),
	updateCourse: (
		roadmapId: number,
		courseId: number,
		data: RoadmapCourseFormValues,
	) =>
		roadmapCourseCrudApi.update(buildRoadmapCourseKey(roadmapId, courseId), data),
	removeCourse: (roadmapId: number, courseId: number) =>
		roadmapCourseCrudApi.delete(buildRoadmapCourseKey(roadmapId, courseId)),
	addCoursesBulk: async (roadmapId: number, payload: AddManyRoadmapCoursesPayload) => {
		const { data } = await apiHttpClient.post<Roadmap>(
			`/course/roadmaps/${roadmapId}/courses/bulk`,
			payload,
		);

		return data;
	},
	reorderCourses: async (
		roadmapId: number,
		payload: ReorderRoadmapCoursesPayload,
	) => {
		const { data } = await apiHttpClient.patch<Roadmap>(
			`/course/roadmaps/${roadmapId}/courses/reorder`,
			payload,
		);

		return data;
	},
};

export type {
	AddManyRoadmapCoursesPayload,
	Roadmap,
	RoadmapCourse,
	RoadmapCourseFormValues,
	RoadmapFormValues,
	RoadmapListParams,
	ReorderRoadmapCoursesPayload,
};
