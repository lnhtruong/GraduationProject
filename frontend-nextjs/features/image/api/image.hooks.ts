/**
 * Image Hooks
 * TanStack Query hooks for image CRUD
 */

import { createCrudHooks } from "@/features/_shared/crud-factories";
import { imageApi } from "./image.api";
import type { CreateImageRequest, Image, UpdateImageRequest } from "../types";

export const imageHooks = createCrudHooks<
  Image,
  CreateImageRequest,
  UpdateImageRequest,
  number
>("image", imageApi);

export const imageKeys = imageHooks.keys;

export const {
  useDetail: useImageById,
  useList: useImagesByUser,
  useCreate: useCreateImage,
  useUpdate: useUpdateImage,
  useDelete: useDeleteImage,
} = imageHooks;
