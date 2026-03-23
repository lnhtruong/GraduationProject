/**
 * Project Feature Types
 */

export type ProjectStatus =
	| "draft"
	| "processing"
	| "completed"
	| "failed"
	| (string & {});

export interface Project {
	id: number;
	user_id: number;
	video_id: number;
	session_name: string;
	status: ProjectStatus;
	created_at?: string;
	updated_at?: string;
}

export interface CreateProjectRequest {
	user_id: number;
	video_id: number;
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

