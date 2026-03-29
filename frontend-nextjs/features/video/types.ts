/**
 * Video Feature Types
 */

export type VideoType = "highlight" | "mascot" | "full" | (string & {});

export interface VideoImage {
	id?: number;
	thumbnail?: string | null;
	url?: string;
	[key: string]: unknown;
}

export interface Video {
	id: number;
	user_id?: number;
	image_id: number | null;
	url: string;
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

