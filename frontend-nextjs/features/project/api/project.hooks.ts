/**
 * Project Hooks
 * TanStack Query hooks for project CRUD
 */

import { useQuery } from "@tanstack/react-query";
import { createMutationHooks } from "@/features/_shared/hooks";
import { createKeyFactory } from "@/lib/queryKeys";
import { projectApi } from "./project.api";
import type {
	CreateProjectRequest,
	DeleteProjectResponse,
	Project,
	UpdateProjectMutationVariables,
} from "../types";

const keys = createKeyFactory("project");

export const projectKeys = keys;

export function useProjectById(id: number, enabled = true) {
	return useQuery({
		queryKey: keys.detail(id),
		queryFn: () => projectApi.findById(id),
		enabled: enabled && !!id,
	});
}

export function useProjectsByUser(enabled = true) {
	return useQuery({
		queryKey: keys.custom("user", "list"),
		queryFn: () => projectApi.getAllByUser(),
		enabled,
	});
}

const useCreateProjectBase = createMutationHooks<Project, CreateProjectRequest>(
	"project",
	"create",
	projectApi.create,
	{
		onSuccess: (_data, _variables, queryClient) => {
			queryClient.invalidateQueries({ queryKey: keys.root });
		},
	},
);

export function useCreateProject(options?: {
	onSuccess?: (data: Project) => void;
	onError?: (error: Error) => void;
}) {
	return useCreateProjectBase(options);
}

const useUpdateProjectBase = createMutationHooks<
	Project,
	UpdateProjectMutationVariables
>("project", "update", ({ id, data }) => projectApi.updateById(id, data), {
	onSuccess: (updatedProject, _variables, queryClient) => {
		queryClient.invalidateQueries({ queryKey: keys.root });
		queryClient.setQueryData(keys.detail(updatedProject.id), updatedProject);
	},
});

export function useUpdateProject(options?: {
	onSuccess?: (data: Project) => void;
	onError?: (error: Error) => void;
}) {
	return useUpdateProjectBase(options);
}

const useDeleteProjectBase = createMutationHooks<DeleteProjectResponse, number>(
	"project",
	"delete",
	projectApi.deleteById,
	{
		onSuccess: (_data, deletedId, queryClient) => {
			queryClient.invalidateQueries({ queryKey: keys.root });
			queryClient.removeQueries({ queryKey: keys.detail(deletedId) });
		},
	},
);

export function useDeleteProject(options?: {
	onSuccess?: (data: DeleteProjectResponse, id: number) => void;
	onError?: (error: Error) => void;
}) {
	return useDeleteProjectBase(options);
}

