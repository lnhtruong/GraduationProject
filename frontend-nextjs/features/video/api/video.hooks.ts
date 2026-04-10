/**
 * Video Hooks
 * TanStack Query hooks for video CRUD
 */

import { createCrudHooks } from "@/features/_shared/crud-factories";
import { videoApi } from "./video.api";
import type {
  CreateVideoRequest,
  UpdateVideoRequest,
  Video,
  VideoListType,
} from "../types";

export const videoHooks = createCrudHooks<
  Video,
  CreateVideoRequest,
  UpdateVideoRequest,
  number,
  number,
  VideoListType | null | undefined
>("video", videoApi);

export const videoKeys = videoHooks.keys;

export const {
  useDetail: useVideoById,
  useList: useVideosByUser,
  useCreate: useCreateVideo,
  useUpdate: useUpdateVideo,
  useDelete: useDeleteVideo,
} = videoHooks;
