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
  } = useWorkspace();

  const handleCreateProject = () => {
    router.push("/editor");
  };

  const handleOpenProject = (projectId: number) => {
    const params = new URLSearchParams();
    params.set("edit_id", String(projectId));
    router.push(`/editor?${params.toString()}`);
  };

  const handleDeleteProject = async (projectId: number) => {
    const target = projects.find((item) => item.project.edit_id === projectId);
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

  const handleRenameProject = async (projectId: number, sessionName: string) => {
    const target = projects.find((item) => item.project.edit_id === projectId);
    if (!target) {
      return false;
    }

    return renameProject(target.project, sessionName);
  };

  return (
    <div className="bg-background">
      <section className="mx-auto flex h-[calc(100vh-4rem)] w-full max-w-6xl flex-col gap-3 px-4 py-4">
        <div className="z-10 shrink-0 space-y-3 bg-background pb-1">
          <WorkspaceHeader
            projectCount={projectCount}
            onCreateProject={() => {
              handleCreateProject();
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

        <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-border/70 bg-card p-2 shadow-sm">
          <ScrollArea className="h-full pr-2">
            <ProjectGrid
              items={projects}
              isLoading={isProjectLoading}
              isLoadingThumbnails={isLoadingThumbnails}
              deletingProjectId={deletingProjectId}
              renamingProjectId={renamingProjectId}
              error={error}
              onRetry={() => {
                void refetchProjects();
              }}
              onOpenProject={handleOpenProject}
              onDeleteProject={(projectId) => {
                void handleDeleteProject(projectId);
              }}
              onRenameProject={handleRenameProject}
            />
          </ScrollArea>
        </div>
      </section>
    </div>
  );
}
