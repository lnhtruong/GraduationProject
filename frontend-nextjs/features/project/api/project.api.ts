/**
 * Project API
 * CRUD endpoints for editing sessions/projects
 */

import { createSimpleApi } from "@/features/_shared/api";
import { apiClient } from "@/lib/http";
import type {
	CreateProjectRequest,
	DeleteProjectResponse,
	Project,
	UpdateProjectRequest,
} from "../types";

const PROJECT_ENDPOINT = "/media/projects";

export const projectApi = createSimpleApi({
	create: async (data: CreateProjectRequest) => {
		const { data: response } = await apiClient.post<Project>(PROJECT_ENDPOINT, data);
		return response;
	},

	findById: async (id: number) => {
		const { data: response } = await apiClient.get<Project>(
			`${PROJECT_ENDPOINT}/${id}`,
		);
		return response;
	},

	getAllByUser: async () => {
		const { data: response } = await apiClient.get<Project[]>(
			`${PROJECT_ENDPOINT}/user`,
		);
		return response;
	},

	updateById: async (id: number, data: UpdateProjectRequest) => {
		const { data: response } = await apiClient.patch<Project>(
			`${PROJECT_ENDPOINT}/${id}`,
			data,
		);
		return response;
	},

	deleteById: async (id: number) => {
		const { data: response } = await apiClient.delete<DeleteProjectResponse>(
			`${PROJECT_ENDPOINT}/${id}`,
		);
		return response;
	},
});

