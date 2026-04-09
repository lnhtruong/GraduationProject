/**
 * Video API
 * CRUD endpoints for user videos
 */

import { createResourceApi } from "@/features/_shared/crud-factories";
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
  name?: string | null;
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
    name: raw.name ?? null,
    url: raw.url ?? "",
    duration: raw.duration ?? null,
    type: (raw.type ?? "mascot") as Video["type"],
    thumbnail: raw.thumbnail ?? raw.image?.thumbnail ?? null,
    image: raw.image ?? null,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
}

const videoCrudApi = createResourceApi<
  VideoApiResponse,
  Video,
  CreateVideoRequest,
  UpdateVideoRequest,
  number,
  VideoListType | null | undefined,
  DeleteVideoResponse
>({
  basePath: VIDEO_ENDPOINT,
  mapItem: mapVideo,
  getListPath: (type) =>
    type ? `${VIDEO_ENDPOINT}/user/${type}` : `${VIDEO_ENDPOINT}/user`,
});

export const videoApi = {
  ...videoCrudApi,
  findById: videoCrudApi.getOne,
  getAllByUser: (type?: VideoListType | null) =>
    videoCrudApi.list?.(type) ?? Promise.resolve([]),
  updateById: videoCrudApi.update,
  deleteById: videoCrudApi.delete,
};
