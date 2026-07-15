"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWorkspace } from "./hooks/useWorkspace";
import { WorkspaceHeader } from "./components/WorkspaceHeader";
import { WorkspaceFilters } from "./components/WorkspaceFilters";
import { ProjectGrid } from "./components/ProjectGrid";

export default function Workspace() {
  const router = useRouter();
  const [projectPendingDelete, setProjectPendingDelete] = useState<number | null>(null);
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

  const projectToDelete =
    projectPendingDelete !== null
      ? projects.find((item) => item.project.edit_id === projectPendingDelete)
      : null;

  const handleConfirmDeleteProject = async () => {
    if (!projectToDelete) return;
    await removeProject(projectToDelete.project);
    setProjectPendingDelete(null);
  };

  const handleRenameProject = async (projectId: number, sessionName: string) => {
    const target = projects.find((item) => item.project.edit_id === projectId);
    if (!target) {
      return false;
    }

    return renameProject(target.project, sessionName);
  };

  return (
    <div className="min-h-screen bg-background">
      <WorkspaceHeader
        projectCount={projectCount}
        onCreateProject={() => {
          handleCreateProject();
        }}
      />

      <section className="mx-auto flex h-[calc(100vh-11rem)] min-h-[520px] w-full max-w-7xl flex-col gap-3 px-4 py-4 lg:px-8">
        <div className="z-10 shrink-0 space-y-3 bg-background pb-1">
          <WorkspaceFilters
            searchValue={searchValue}
            statusFilter={statusFilter}
            sortBy={sortBy}
            onSearchChange={setSearchValue}
            onStatusChange={setStatusFilter}
            onSortChange={setSortBy}
          />
        </div>

        <Card className="min-h-0 flex-1 overflow-hidden rounded-lg border-border/70 p-2 shadow-sm">
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
              onDeleteProject={setProjectPendingDelete}
              onRenameProject={handleRenameProject}
            />
          </ScrollArea>
        </Card>
      </section>

      <AlertDialog
        open={projectPendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setProjectPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa dự án?</AlertDialogTitle>
            <AlertDialogDescription>
              Dự án{" "}
              <span className="font-medium text-foreground">
                {projectToDelete?.project.session_name}
              </span>{" "}
              sẽ bị xóa khỏi workspace. Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleConfirmDeleteProject();
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
