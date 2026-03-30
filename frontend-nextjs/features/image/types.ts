/**
 * Image Feature Types
 */

export interface Image {
	id: number;
	user_id?: number;
	url: string;
	thumbnail?: string | null;
	created_at?: string;
	updated_at?: string;
}

export interface CreateImageRequest {
	url: string;
	user_id?: number;
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
