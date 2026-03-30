/**
 * Image API
 * CRUD endpoints for user mascot images
 */

import { createSimpleApi } from "@/features/_shared/api";
import { apiClient } from "@/lib/http";
import type {
	CreateImageRequest,
	DeleteImageResponse,
	Image,
	UpdateImageRequest,
} from "../types";

const IMAGE_ENDPOINT = "/media/mascot_images";

type ImageApiResponse = {
	id?: number;
	image_id?: number;
	user_id?: number;
	url?: string;
	thumbnail?: string | null;
	created_at?: string;
	updated_at?: string;
	createdAt?: string;
	updatedAt?: string;
};

function mapImage(raw: ImageApiResponse): Image {
	return {
		id: raw.id ?? raw.image_id ?? 0,
		user_id: raw.user_id,
		url: raw.url ?? "",
		thumbnail: raw.thumbnail ?? null,
		created_at: raw.created_at ?? raw.createdAt,
		updated_at: raw.updated_at ?? raw.updatedAt,
	};
}

export const imageApi = createSimpleApi({
	create: async (data: CreateImageRequest) => {
		const { data: response } = await apiClient.post<ImageApiResponse>(
			IMAGE_ENDPOINT,
			data,
		);
		return mapImage(response);
	},

	findById: async (id: number) => {
		const { data: response } = await apiClient.get<ImageApiResponse>(
			`${IMAGE_ENDPOINT}/${id}`,
		);
		return mapImage(response);
	},

	getAllByUser: async () => {
		const { data: response } = await apiClient.get<ImageApiResponse[]>(
			`${IMAGE_ENDPOINT}/user`,
		);
		return response.map(mapImage);
	},

	updateById: async (id: number, data: UpdateImageRequest) => {
		const { data: response } = await apiClient.patch<ImageApiResponse>(
			`${IMAGE_ENDPOINT}/${id}`,
			data,
		);
		return mapImage(response);
	},

	deleteById: async (id: number) => {
		const { data: response } = await apiClient.delete<DeleteImageResponse>(
			`${IMAGE_ENDPOINT}/${id}`,
		);
		return response;
	},
});
