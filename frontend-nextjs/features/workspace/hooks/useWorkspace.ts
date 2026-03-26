"use client";

import { useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { useProject } from "@/features/project";
import { videoApi } from "@/features/video";
import { videoKeys } from "@/features/video";
import { toast } from "sonner";
import type { Project } from "@/features/project";
import type {
  WorkspaceProjectItem,
  WorkspaceSortBy,
  WorkspaceStatusFilter,
} from "../types";

export function useWorkspace() {
  const {
    projects,
    isLoading: isProjectLoading,
    error,
    refetchProjects,
    updateProject,
    deleteProject,
  } = useProject();

  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<WorkspaceStatusFilter>("all");
  const [sortBy, setSortBy] = useState<WorkspaceSortBy>("updated_desc");
  const [deletingProjectId, setDeletingProjectId] = useState<number | null>(null);
  const [renamingProjectId, setRenamingProjectId] = useState<number | null>(null);

  const videoQueries = useQueries({
    queries: projects.map((project) => ({
      queryKey: videoKeys.detail(project.video_id ?? -1),
      queryFn: () => videoApi.findById(project.video_id ?? 0),
      enabled: !!project.video_id,
      staleTime: 60_000,
    })),
  });

  const rawItems = useMemo<WorkspaceProjectItem[]>(() => {
    return projects.map((project, index) => {
      const videoData = videoQueries[index]?.data ?? null;
      return {
        project,
        video: videoData,
        thumbnail: videoData?.thumbnail ?? null,
      };
    });
  }, [projects, videoQueries]);

  const filteredItems = useMemo(() => {
    const keyword = searchValue.trim().toLowerCase();

    const byFilter = rawItems.filter(({ project }) => {
      const matchStatus =
        statusFilter === "all" || project.status === statusFilter;

      if (!matchStatus) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      return (
        project.session_name.toLowerCase().includes(keyword) ||
        String(project.edit_id).includes(keyword)
      );
    });

    const sorted = [...byFilter].sort((a, b) => {
      const aTime = toTime(a.project.updated_at ?? a.project.created_at);
      const bTime = toTime(b.project.updated_at ?? b.project.created_at);

      if (sortBy === "updated_desc") return bTime - aTime;
      if (sortBy === "updated_asc") return aTime - bTime;
      if (sortBy === "name_asc") {
        return a.project.session_name.localeCompare(b.project.session_name, "vi");
      }
      return b.project.session_name.localeCompare(a.project.session_name, "vi");
    });

    return sorted;
  }, [rawItems, searchValue, sortBy, statusFilter]);

  const isLoadingThumbnails = videoQueries.some((query) => query.isLoading);

  const removeProject = async (project: Project) => {
    try {
      setDeletingProjectId(project.edit_id);
      await deleteProject(project.edit_id);
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
      await updateProject(project.edit_id, { session_name: trimmedName });
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
    projects: filteredItems,
    projectCount: projects.length,
    isProjectLoading,
    isLoadingThumbnails,
    deletingProjectId,
    renamingProjectId,
    error,
    searchValue,
    statusFilter,
    sortBy,
    setSearchValue,
    setStatusFilter,
    setSortBy,
    refetchProjects,
    removeProject,
    renameProject,
  } as const;
}

function toTime(value?: string) {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}
