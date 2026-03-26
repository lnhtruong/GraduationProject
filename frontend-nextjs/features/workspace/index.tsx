"use client";

import { useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWorkspace } from "./hooks/useWorkspace";
import { WorkspaceHeader } from "./components/WorkspaceHeader";
import { WorkspaceFilters } from "./components/WorkspaceFilters";
import { ProjectGrid } from "./components/ProjectGrid";

export default function Workspace() {
  const router = useRouter();
  const {
    projects,
    projectCount,
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
  } = useWorkspace();

  const handleCreateProject = async () => {
    const created = await createNewProject();
    const params = new URLSearchParams();
    params.set("project_id", String(created.id));
    params.set("projectId", String(created.id));
    router.push(`/editor?${params.toString()}`);
  };

  const handleOpenProject = (projectId: number) => {
    const params = new URLSearchParams();
    params.set("project_id", String(projectId));
    params.set("projectId", String(projectId));
    router.push(`/editor?${params.toString()}`);
  };

  const handleDeleteProject = async (projectId: number) => {
    const target = projects.find((item) => item.project.id === projectId);
    if (!target) {
      return;
    }

    const accepted = window.confirm(
      `Bạn có chắc muốn xóa dự án \"${target.project.session_name}\"?`,
    );

    if (!accepted) {
      return;
    }

    await removeProject(target.project);
  };

  return (
    <div className="min-h-screen bg-background">
      <section className="container mx-auto flex h-[calc(100vh-8rem)] flex-col gap-4 px-4 py-6">
        <div className="sticky top-16 z-20 space-y-3">
          <WorkspaceHeader
            projectCount={projectCount}
            isCreatingProject={isCreatingProject}
            onCreateProject={() => {
              void handleCreateProject();
            }}
          />
          <WorkspaceFilters
            searchValue={searchValue}
            statusFilter={statusFilter}
            sortBy={sortBy}
            onSearchChange={setSearchValue}
            onStatusChange={setStatusFilter}
            onSortChange={setSortBy}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-border/60 bg-card/40 p-4">
          <ScrollArea className="h-full pr-2">
            <ProjectGrid
              items={projects}
              isLoading={isProjectLoading}
              isLoadingThumbnails={isLoadingThumbnails}
              deletingProjectId={deletingProjectId}
              error={error}
              onRetry={() => {
                void refetchProjects();
              }}
              onOpenProject={handleOpenProject}
              onDeleteProject={(projectId) => {
                void handleDeleteProject(projectId);
              }}
            />
          </ScrollArea>
        </div>
      </section>
    </div>
  );
}
