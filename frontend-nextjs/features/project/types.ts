/**
 * Project Feature Types
 */

import type { Video } from "@/features/video";

export type ProjectStatus =
	| "draft"
	| "saved"
	| "finalized"
	| "processing"
	| "completed"
	| "failed"
	| (string & {});

export interface Project {
	edit_id: number;
	user_id: number;
	video_id: number | null;
	video?: Video | null;
	session_name: string;
	status: ProjectStatus;
	created_at?: string;
	updated_at?: string;
}

export interface CreateProjectRequest {
	video_id?: number | null;
	session_name: string;
}

export interface UpdateProjectRequest {
	video_id?: number;
	session_name?: string;
	status?: ProjectStatus;
}

export interface DeleteProjectResponse {
	message: string;
}

export interface UpdateProjectMutationVariables {
	id: number;
	data: UpdateProjectRequest;
}

