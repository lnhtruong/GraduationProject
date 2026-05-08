import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createKeyFactory } from "@/lib/queryKeys";
import { createCrudHooks } from "@/features/_shared/crud-factories";
import {
	roadmapApi,
	roadmapCourseApi,
	type RoadmapListParams,
} from "./roadmap.api";
import type {
	AddManyRoadmapCoursesPayload,
	Roadmap,
	RoadmapCourseFormValues,
	RoadmapFormValues,
	ReorderRoadmapCoursesPayload,
} from "../types";

const roadmapFeature = "roadmap";
export const roadmapKeys = createKeyFactory(roadmapFeature);

export const roadmapHooks = createCrudHooks<
	Roadmap,
	RoadmapFormValues,
	RoadmapFormValues,
	number,
	number,
	RoadmapListParams,
	void
>(roadmapFeature, roadmapApi, {
	listStaleTimeMs: 30 * 1000,
	detailStaleTimeMs: 15 * 1000,
});

export const {
	useList: useRoadmaps,
	useDetail: useRoadmapById,
	useCreate: useCreateRoadmap,
	useUpdate: useUpdateRoadmap,
	useDelete: useDeleteRoadmap,
} = roadmapHooks;

export function useRoadmapsPaginated(
	params?: RoadmapListParams,
	enabled = true,
) {
	return useQuery({
		queryKey: roadmapKeys.custom(
			"paginated",
			params?.userId,
			params?.page,
			params?.limit,
		),
		queryFn: async () => {
			if (roadmapApi.listPaginated) {
				return roadmapApi.listPaginated(params);
			}

			const items = roadmapApi.list ? await roadmapApi.list(params) : [];
			return {
				data: items,
				pagination: {
					page: params?.page ?? 1,
					limit: params?.limit ?? items.length,
					totalItems: items.length,
					totalPages: 1,
				},
			};
		},
		enabled,
		staleTime: 30 * 1000,
	});
}

type RoadmapCourseVariables = {
	roadmapId: number;
	courseId: number;
	data: RoadmapCourseFormValues;
};

type BulkRoadmapCourseVariables = {
	roadmapId: number;
	data: AddManyRoadmapCoursesPayload;
};

type ReorderRoadmapCourseVariables = {
	roadmapId: number;
	data: ReorderRoadmapCoursesPayload;
};

export function useAddRoadmapCourse() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationKey: roadmapKeys.custom("add-course"),
		mutationFn: ({ roadmapId, data }: { roadmapId: number; data: RoadmapCourseFormValues }) =>
			roadmapCourseApi.addCourse(roadmapId, data),
		retry: false,
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: roadmapKeys.root });
		},
	});
}

export function useAddManyRoadmapCourses() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationKey: roadmapKeys.custom("add-many-courses"),
		mutationFn: ({ roadmapId, data }: BulkRoadmapCourseVariables) =>
			roadmapCourseApi.addCoursesBulk(roadmapId, data),
		retry: false,
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: roadmapKeys.root });
		},
	});
}

export function useReorderRoadmapCourses() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationKey: roadmapKeys.custom("reorder-courses"),
		mutationFn: ({ roadmapId, data }: ReorderRoadmapCourseVariables) =>
			roadmapCourseApi.reorderCourses(roadmapId, data),
		retry: false,
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: roadmapKeys.root });
		},
	});
}

export function useUpdateRoadmapCourse() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationKey: roadmapKeys.custom("update-course"),
		mutationFn: ({ roadmapId, courseId, data }: RoadmapCourseVariables) =>
			roadmapCourseApi.updateCourse(roadmapId, courseId, data),
		retry: false,
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: roadmapKeys.root });
		},
	});
}

export function useRemoveRoadmapCourse() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationKey: roadmapKeys.custom("remove-course"),
		mutationFn: ({ roadmapId, courseId }: Omit<RoadmapCourseVariables, "data">) =>
			roadmapCourseApi.removeCourse(roadmapId, courseId),
		retry: false,
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: roadmapKeys.root });
		},
	});
}
