/**
 * Project Hooks
 * TanStack Query hooks for project CRUD
 */

import { createCrudHooks } from "@/features/_shared/crud-hooks";
import { projectApi } from "./project.api";
import type {
	CreateProjectRequest,
	DeleteProjectResponse,
	Project,
	UpdateProjectRequest,
} from "../types";

const projectCrudHooks = createCrudHooks<
	Project,
	CreateProjectRequest,
	UpdateProjectRequest,
	number
>("project", projectApi, {
	idField: "edit_id",
});

export const projectKeys = projectCrudHooks.keys;

export function useProjectById(id: number, enabled = true) {
	return projectCrudHooks.useDetail(id, enabled);
}

export function useProjectsByUser(enabled = true) {
 	return projectCrudHooks.useList(undefined, enabled);
}

export function useCreateProject(options?: {
	onSuccess?: (data: Project) => void;
	onError?: (error: Error) => void;
}) {
	return projectCrudHooks.useCreate({
		onSuccess: (data) => options?.onSuccess?.(data),
		onError: options?.onError,
	});
}

export function useUpdateProject(options?: {
	onSuccess?: (data: Project) => void;
	onError?: (error: Error) => void;
}) {
	return projectCrudHooks.useUpdate({
		onSuccess: (data) => options?.onSuccess?.(data),
		onError: options?.onError,
	});
}

export function useDeleteProject(options?: {
	onSuccess?: (data: DeleteProjectResponse, id: number) => void;
	onError?: (error: Error) => void;
}) {
	return projectCrudHooks.useDelete({
		onSuccess: (data, id) =>
			options?.onSuccess?.(data as DeleteProjectResponse, id),
		onError: options?.onError,
	});
}

