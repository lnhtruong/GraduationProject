/**
 * Video Feature Types
 */

export type VideoType =
  | "highlight"
  | "mascot"
  | "long"
  | "full"
  | (string & {});
export type VideoListType = "highlight" | "mascot" | "long";

export interface VideoImage {
  id?: number;
  thumbnail?: string | null;
  url?: string;
  [key: string]: unknown;
}

export interface Video {
  id: number;
  user_id?: number;
  job_id?: string | null;
  jobId?: string | null;
  image_id: number | null;
  name?: string | null;
  url: string;
  srt_raw_url?: string | null;
  srtRawUrl?: string | null;
  duration: number | null;
  type: VideoType;
  thumbnail?: string | null;
  image?: VideoImage | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateVideoRequest {
  image_id?: number | null;
  url: string;
  duration?: number | null;
  type: VideoType;
}

export interface UpdateVideoRequest {
  image_id?: number;
  url?: string;
  duration?: number;
  type?: VideoType;
}

export interface DeleteVideoResponse {
  message: string;
}

export interface UpdateVideoMutationVariables {
  id: number;
  data: UpdateVideoRequest;
}
