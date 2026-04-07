/**
 * Image API
 * CRUD endpoints for user mascot images
 */

import { createResourceApi } from "@/features/_shared/crud-hooks";
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

const imageCrudApi = createResourceApi<
	ImageApiResponse,
	Image,
	CreateImageRequest,
	UpdateImageRequest,
	number,
	unknown,
	DeleteImageResponse
>({
	basePath: IMAGE_ENDPOINT,
	mapItem: mapImage,
	getListPath: () => `${IMAGE_ENDPOINT}/user`,
});

export const imageApi = {
	...imageCrudApi,
	findById: imageCrudApi.getOne,
	getAllByUser: () => imageCrudApi.list?.() ?? Promise.resolve([]),
	updateById: imageCrudApi.update,
	deleteById: imageCrudApi.delete,
};
