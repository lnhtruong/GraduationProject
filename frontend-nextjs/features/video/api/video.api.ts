/**
 * Video API
 * CRUD endpoints for user videos
 */

import { createSimpleApi } from "@/features/_shared/api";
import { apiClient } from "@/lib/http";
import type {
	CreateVideoRequest,
	DeleteVideoResponse,
	UpdateVideoRequest,
	Video,
} from "../types";

const VIDEO_ENDPOINT = "/media/videos";

export const videoApi = createSimpleApi({
	create: async (data: CreateVideoRequest) => {
		const { data: response } = await apiClient.post<Video>(VIDEO_ENDPOINT, data);
		return response;
	},

	findById: async (id: number) => {
		const { data: response } = await apiClient.get<Video>(`${VIDEO_ENDPOINT}/${id}`);
		return response;
	},

	getAllByUser: async () => {
		const { data: response } = await apiClient.get<Video[]>(`${VIDEO_ENDPOINT}/user`);
		return response;
	},

	updateById: async (id: number, data: UpdateVideoRequest) => {
		const { data: response } = await apiClient.patch<Video>(
			`${VIDEO_ENDPOINT}/${id}`,
			data,
		);
		return response;
	},

	deleteById: async (id: number) => {
		const { data: response } = await apiClient.delete<DeleteVideoResponse>(
			`${VIDEO_ENDPOINT}/${id}`,
		);
		return response;
	},
});

