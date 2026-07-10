/**
 * Video API
 * CRUD endpoints for user videos
 */

import { createResourceApi } from "@/features/_shared/crud-factories";
import { apiHttpClient as apiClient } from "@/features/_shared/api-factories";
import type {
  CreateVideoRequest,
  DeleteVideoResponse,
  UpdateVideoRequest,
  Video,
  VideoListType,
} from "../types";

const VIDEO_ENDPOINT = "/media/videos";

type BunnyInitUploadRequest = {
  title?: string;
  collectionId?: string;
  thumbnailTime?: number;
  expiresInSeconds?: number;
  meta?: Record<string, unknown>;
};

export type BunnyInitUploadResponse = {
  success: boolean;
  videoId: number;
  bunnyVideoId: string;
  url?: string;
  originalUrl?: string;
  libraryId: string;
  tus: {
    endpoint: string;
    headers: {
      AuthorizationSignature: string;
      AuthorizationExpire: string;
      LibraryId: string;
      VideoId: string;
    };
  };
  bunnyVideo?: Record<string, unknown>;
};

export type BunnyVideoStatusResponse = {
  status?: number;
  Status?: number;
  [key: string]: unknown;
};

export type BunnyVideoPlayDataResponse = {
  isPlayable?: boolean;
  videoPlaylistUrl?: string;
  fallbackUrl?: string;
  originalUrl?: string;
  thumbnailUrl?: string;
  previewUrl?: string;
  video?: {
    title?: string;
    length?: number;
    [key: string]: unknown;
  } | null;
  [key: string]: unknown;
};

type VideoApiResponse = {
  id?: number;
  user_id?: number;
  image_id?: number | null;
  mascot_image_id?: number | null;
  url?: string;
  srt_raw_url?: string | null;
  srtRawUrl?: string | null;
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
    srt_raw_url: raw.srt_raw_url ?? raw.srtRawUrl ?? null,
    srtRawUrl: raw.srtRawUrl ?? raw.srt_raw_url ?? null,
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
  initBunnyUpload: async (payload: BunnyInitUploadRequest) => {
    const { data } = await apiClient.post<BunnyInitUploadResponse>(
      "/media/bunny/videos/init-upload",
      payload,
    );
    return data;
  },
  getBunnyVideoStatus: async (bunnyVideoId: string) => {
    const { data } = await apiClient.get<BunnyVideoStatusResponse>(
      `/media/bunny/videos/${bunnyVideoId}/status`,
    );
    return data;
  },
  getBunnyVideoPlayData: async (bunnyVideoId: string) => {
    const { data } = await apiClient.get<BunnyVideoPlayDataResponse>(
      `/media/bunny/videos/${bunnyVideoId}/play-data`,
    );
    return data;
  },
};
