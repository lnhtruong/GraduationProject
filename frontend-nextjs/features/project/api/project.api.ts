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

type ProjectApiResponse = {
	edit_id?: number;
	user_id?: number;
	video_id?: number | null;
	session_name?: string;
	status?: string;
	created_at?: string;
	updated_at?: string;
};

function mapProject(raw: ProjectApiResponse): Project {
	return {
		edit_id: raw.edit_id ?? 0,
		user_id: raw.user_id ?? 0,
		video_id: raw.video_id ?? null,
		session_name: raw.session_name ?? "Untitled project",
		status: (raw.status ?? "draft") as Project["status"],
		created_at: raw.created_at,
		updated_at: raw.updated_at,
	};
}

export const projectApi = createSimpleApi({
	create: async (data: CreateProjectRequest) => {
		const { data: response } = await apiClient.post<ProjectApiResponse>(
			PROJECT_ENDPOINT,
			data,
		);
		return mapProject(response);
	},

	findById: async (id: number) => {
		const { data: response } = await apiClient.get<ProjectApiResponse>(
			`${PROJECT_ENDPOINT}/${id}`,
		);
		return mapProject(response);
	},

	getAllByUser: async () => {
		const { data: response } = await apiClient.get<ProjectApiResponse[]>(
			`${PROJECT_ENDPOINT}/user`,
		);
		return response.map(mapProject);
	},

	updateById: async (id: number, data: UpdateProjectRequest) => {
		const { data: response } = await apiClient.patch<ProjectApiResponse>(
			`${PROJECT_ENDPOINT}/${id}`,
			data,
		);
		return mapProject(response);
	},

	deleteById: async (id: number) => {
		const { data: response } = await apiClient.delete<DeleteProjectResponse>(
			`${PROJECT_ENDPOINT}/${id}`,
		);
		return response;
	},
});

