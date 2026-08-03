/**
 * Image Hooks
 * TanStack Query hooks for image CRUD
 */

import { createCrudHooks } from "@/features/_shared/crud-factories";
import { useQuery } from "@tanstack/react-query";
import { imageApi } from "./image.api";
import type { ImageListParams } from "./image.api";
import type { CreateImageRequest, Image, ImageType, UpdateImageRequest } from "../types";

export const imageHooks = createCrudHooks<
  Image,
  CreateImageRequest,
  UpdateImageRequest,
  number,
  number,
  ImageListParams
>("image", imageApi);

export const imageKeys = imageHooks.keys;

export const {
  useDetail: useImageById,
  useList: useImagesByUser,
  useCreate: useCreateImage,
  useUpdate: useUpdateImage,
  useDelete: useDeleteImage,
} = imageHooks;

export function useImagesByUserPaginated(
  page: number,
  limit: number,
  enabled = true,
  type?: ImageType,
) {
  return useQuery({
    queryKey: imageKeys.custom("library-page", { page, limit, type }),
    queryFn: () => imageApi.getAllByUserPaginated({ page, limit, type }),
    enabled,
    staleTime: 2 * 60_000,
  });
}
