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
	VideoListType,
} from "../types";

const VIDEO_ENDPOINT = "/media/videos";

type VideoApiResponse = {
	id?: number;
	user_id?: number;
	image_id?: number | null;
	mascot_image_id?: number | null;
	url?: string;
	duration?: number | null;
	type?: string;
	thumbnail?: string | null;
	image?: {
		thumbnail?: string | null;
		url?: string;
		[key: string]: unknown;
	} | null;
	created_at?: string;
	updated_at?: string;
};

function mapVideo(raw: VideoApiResponse): Video {
	return {
		id: raw.id ?? 0,
		user_id: raw.user_id,
		image_id: raw.image_id ?? raw.mascot_image_id ?? null,
		url: raw.url ?? "",
		duration: raw.duration ?? null,
		type: (raw.type ?? "mascot") as Video["type"],
		thumbnail: raw.thumbnail ?? raw.image?.thumbnail ?? null,
		image: raw.image ?? null,
		created_at: raw.created_at,
		updated_at: raw.updated_at,
	};
}

export const videoApi = createSimpleApi({
	create: async (data: CreateVideoRequest) => {
		const { data: response } = await apiClient.post<VideoApiResponse>(
			VIDEO_ENDPOINT,
			data,
		);
		return mapVideo(response);
	},

	findById: async (id: number) => {
		const { data: response } = await apiClient.get<VideoApiResponse>(
			`${VIDEO_ENDPOINT}/${id}`,
		);
		return mapVideo(response);
	},

	getAllByUser: async (type?: VideoListType | null) => {
		const endpoint = type
			? `${VIDEO_ENDPOINT}/user/${type}`
			: `${VIDEO_ENDPOINT}/user`;
		const { data: response } = await apiClient.get<VideoApiResponse[]>(
			endpoint,
		);
		return response.map(mapVideo);
	},

	updateById: async (id: number, data: UpdateVideoRequest) => {
		const { data: response } = await apiClient.patch<VideoApiResponse>(
			`${VIDEO_ENDPOINT}/${id}`,
			data,
		);
		return mapVideo(response);
	},

	deleteById: async (id: number) => {
		const { data: response } = await apiClient.delete<DeleteVideoResponse>(
			`${VIDEO_ENDPOINT}/${id}`,
		);
		return response;
	},
});

