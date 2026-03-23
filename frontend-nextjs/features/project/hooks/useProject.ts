"use client";

import { useMemo, useState } from "react";
import {
	useCreateProject,
	useDeleteProject,
	useProjectById,
	useProjectsByUser,
	useUpdateProject,
} from "../api/project.hooks";
import type { CreateProjectRequest, UpdateProjectRequest } from "../types";

export function useProject(initialProjectId?: number | null) {
	const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
		initialProjectId ?? null,
	);

	const projectsQuery = useProjectsByUser(true);
	const selectedProjectQuery = useProjectById(
		selectedProjectId ?? 0,
		selectedProjectId !== null,
	);

	const createProjectMutation = useCreateProject();
	const updateProjectMutation = useUpdateProject();
	const deleteProjectMutation = useDeleteProject();

	const createProject = async (payload: CreateProjectRequest) => {
		const created = await createProjectMutation.mutateAsync(payload);
		setSelectedProjectId(created.id);
		return created;
	};

	const updateProject = async (id: number, payload: UpdateProjectRequest) => {
		const updated = await updateProjectMutation.mutateAsync({ id, data: payload });
		setSelectedProjectId(updated.id);
		return updated;
	};

	const deleteProject = async (id: number) => {
		const result = await deleteProjectMutation.mutateAsync(id);
		if (selectedProjectId === id) {
			setSelectedProjectId(null);
		}
		return result;
	};

	const isLoading =
		projectsQuery.isLoading ||
		selectedProjectQuery.isLoading ||
		createProjectMutation.isPending ||
		updateProjectMutation.isPending ||
		deleteProjectMutation.isPending;

	const error =
		projectsQuery.error ||
		selectedProjectQuery.error ||
		createProjectMutation.error ||
		updateProjectMutation.error ||
		deleteProjectMutation.error;

	return useMemo(
		() => ({
			projects: projectsQuery.data ?? [],
			selectedProject: selectedProjectQuery.data ?? null,
			selectedProjectId,
			setSelectedProjectId,
			isLoading,
			error,
			refetchProjects: projectsQuery.refetch,
			refetchSelectedProject: selectedProjectQuery.refetch,
			createProject,
			updateProject,
			deleteProject,
			createProjectMutation,
			updateProjectMutation,
			deleteProjectMutation,
		}),
		[
			projectsQuery.data,
			selectedProjectQuery.data,
			selectedProjectId,
			isLoading,
			error,
			projectsQuery.refetch,
			selectedProjectQuery.refetch,
			createProjectMutation,
			updateProjectMutation,
			deleteProjectMutation,
		],
	);
}

