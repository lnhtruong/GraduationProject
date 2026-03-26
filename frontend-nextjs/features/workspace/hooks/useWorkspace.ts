"use client";

import { useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { useProject } from "@/features/project";
import { videoApi } from "@/features/video";
import { videoKeys } from "@/features/video";
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
    createProject,
    deleteProject,
  } = useProject();

  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<WorkspaceStatusFilter>("all");
  const [sortBy, setSortBy] = useState<WorkspaceSortBy>("updated_desc");
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [deletingProjectId, setDeletingProjectId] = useState<number | null>(null);

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
        String(project.id).includes(keyword)
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

  const createNewProject = async () => {
    try {
      setIsCreatingProject(true);
      const created = await createProject({
        session_name: buildDefaultSessionName(),
      });
      return created;
    } finally {
      setIsCreatingProject(false);
    }
  };

  const removeProject = async (project: Project) => {
    try {
      setDeletingProjectId(project.id);
      await deleteProject(project.id);
    } finally {
      setDeletingProjectId(null);
    }
  };

  return {
    projects: filteredItems,
    projectCount: projects.length,
    isProjectLoading,
    isLoadingThumbnails,
    isCreatingProject,
    deletingProjectId,
    error,
    searchValue,
    statusFilter,
    sortBy,
    setSearchValue,
    setStatusFilter,
    setSortBy,
    refetchProjects,
    createNewProject,
    removeProject,
  } as const;
}

function buildDefaultSessionName() {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");

  return `Project mới - ${dd}/${mm} ${hh}:${min}`;
}

function toTime(value?: string) {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}
