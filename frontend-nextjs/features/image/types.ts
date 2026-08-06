/**
 * Image Feature Types
 */

export interface Image {
	id: number;
	user_id?: number;
	url: string;
  thumbnail?: string | null;
  type?: ImageType;
  job_id?: string | null;
  name?: string | null;
  format?: string | null;
	created_at?: string;
	updated_at?: string;
}

export type ImageType =
  | "thumbnail_video"
  | "thumbnail_course"
  | "avt"
  | "report"
  | "role_upgrade"
  | "mascot";

export interface CreateImageRequest {
	url: string;
	user_id?: number;
  type?: ImageType;
}

export interface UpdateImageRequest {
	url?: string;
}

export interface DeleteImageResponse {
	message: string;
}

export interface UpdateImageMutationVariables {
	id: number;
	data: UpdateImageRequest;
}
