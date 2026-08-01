/**
 * Image API
 * CRUD endpoints for user mascot images
 */

import {
  createResourceApi,
  normalizePaginatedResponse,
  withQueryPath,
} from "@/features/_shared/crud-factories";
import type { PaginatedResponse } from "@/features/_shared/crud-factories";
import { apiHttpClient as apiClient } from "@/features/_shared/api-factories";
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
  type?: string;
  job_id?: string | null;
  name?: string | null;
  format?: string | null;
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ImageLibraryPageParams = {
  page: number;
  limit: number;
};

export type ImageListParams = {
  type?: string;
};

function mapImage(raw: ImageApiResponse): Image {
  return {
    id: raw.id ?? raw.image_id ?? 0,
    user_id: raw.user_id,
    url: raw.url ?? "",
    thumbnail: raw.thumbnail ?? null,
    type: raw.type,
    job_id: raw.job_id ?? null,
    name: raw.name ?? null,
    format: raw.format ?? null,
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
  getAllByUser: async (params?: ImageListParams): Promise<Image[]> => {
    const { data } = await apiClient.get<ImageApiResponse[]>(
      `${IMAGE_ENDPOINT}/user`,
      { params },
    );
    return data.map(mapImage);
  },
  getAllByUserPaginated: async ({
    page,
    limit,
  }: ImageLibraryPageParams): Promise<PaginatedResponse<Image>> => {
    const { data } = await apiClient.get<
      | {
          data?: ImageApiResponse[];
          pagination?: {
            page?: number;
            limit?: number;
            totalItems?: number;
            totalPages?: number;
          };
        }
      | ImageApiResponse[]
    >(withQueryPath(`${IMAGE_ENDPOINT}/user`, { page, limit }));

    if (Array.isArray(data)) {
      return normalizePaginatedResponse(data.map(mapImage), { page, limit });
    }

    return normalizePaginatedResponse(
      {
        data: (data.data ?? []).map(mapImage),
        pagination: data.pagination,
      },
      { page, limit },
    );
  },
  updateById: imageCrudApi.update,
  deleteById: imageCrudApi.delete,
};
