"use client";

import { useMemo, useState } from "react";
import {
  useDeleteProject,
  useProjectsByUserPaginated,
  useUpdateProject,
} from "@/features/project/api/project.hooks";
import { toast } from "sonner";
import type { Project } from "@/features/project";
import type {
  WorkspaceProjectItem,
  WorkspaceSortBy,
  WorkspaceStatusFilter,
} from "../types";

interface UseWorkspaceParams {
  page: number;
  limit: number;
  searchValue: string;
  statusFilter: WorkspaceStatusFilter;
  sortBy: WorkspaceSortBy;
}

export function useWorkspace({
  page,
  limit,
  searchValue,
  statusFilter,
  sortBy,
}: UseWorkspaceParams) {
  const projectsQuery = useProjectsByUserPaginated({
    page,
    limit,
    search: searchValue.trim() || undefined,
    status: statusFilter,
    sort: sortBy,
  });
  const updateProjectMutation = useUpdateProject();
  const deleteProjectMutation = useDeleteProject();

  const [deletingProjectId, setDeletingProjectId] = useState<number | null>(null);
  const [renamingProjectId, setRenamingProjectId] = useState<number | null>(null);

  const rawItems = useMemo<WorkspaceProjectItem[]>(() => {
    return (projectsQuery.data?.data ?? []).map((project) => {
      const videoData = project.video ?? null;
      return {
        project,
        video: videoData,
        thumbnail: videoData?.thumbnail ?? null,
      };
    });
  }, [projectsQuery.data]);

  const isLoadingThumbnails = false;

  const removeProject = async (project: Project) => {
    try {
      setDeletingProjectId(project.edit_id);
      await deleteProjectMutation.mutateAsync(project.edit_id);
      await projectsQuery.refetch();
    } finally {
      setDeletingProjectId(null);
    }
  };

  const renameProject = async (project: Project, sessionName: string) => {
    const trimmedName = sessionName.trim();

    if (!trimmedName) {
      toast.error("Tên dự án không được để trống");
      return false;
    }

    if (trimmedName === project.session_name) {
      return true;
    }

    try {
      setRenamingProjectId(project.edit_id);
      await updateProjectMutation.mutateAsync({
        id: project.edit_id,
        data: { session_name: trimmedName },
      });
      await projectsQuery.refetch();
      toast.success("Đã cập nhật tên dự án");
      return true;
    } catch (renameError) {
      toast.error("Không thể đổi tên dự án", {
        description:
          renameError instanceof Error
            ? renameError.message
            : "Vui lòng thử lại sau",
      });
      return false;
    } finally {
      setRenamingProjectId(null);
    }
  };

  return {
    projects: rawItems,
    pagination: projectsQuery.data?.pagination ?? {
      page,
      limit,
      totalItems: 0,
      totalPages: 0,
    },
    projectCount: projectsQuery.data?.pagination.totalItems ?? 0,
    isProjectLoading:
      projectsQuery.isLoading ||
      updateProjectMutation.isPending ||
      deleteProjectMutation.isPending,
    isLoadingThumbnails,
    deletingProjectId,
    renamingProjectId,
    error: projectsQuery.error || updateProjectMutation.error || deleteProjectMutation.error,
    refetchProjects: projectsQuery.refetch,
    removeProject,
    renameProject,
  } as const;
}
