/**
 * Video Feature Types
 */

export type VideoType = "highlight" | "full" | (string & {});

export interface Video {
	id: number;
	user_id?: number;
	image_id: number;
	url: string;
	duration: number;
	type: VideoType;
	created_at?: string;
	updated_at?: string;
}

export interface CreateVideoRequest {
	image_id: number;
	url: string;
	duration: number;
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

