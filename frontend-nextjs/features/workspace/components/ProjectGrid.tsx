import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserFacingErrorMessage } from "@/lib/user-facing-error";
import { FolderKanban, RefreshCcw } from "lucide-react";
import { ProjectCard } from "./ProjectCard";
import type { WorkspaceProjectItem } from "../types";

interface ProjectGridProps {
  items: WorkspaceProjectItem[];
  isLoading: boolean;
  isLoadingThumbnails: boolean;
  deletingProjectId: number | null;
  renamingProjectId: number | null;
  error: unknown;
  onRetry: () => void;
  onOpenProject: (projectId: number) => void;
  onDeleteProject: (projectId: number) => void;
  onRenameProject: (projectId: number, sessionName: string) => Promise<boolean>;
}

export function ProjectGrid({
  items,
  isLoading,
  isLoadingThumbnails,
  deletingProjectId,
  renamingProjectId,
  error,
  onRetry,
  onOpenProject,
  onDeleteProject,
  onRenameProject,
}: ProjectGridProps) {
  if (isLoading) {
    return <ProjectGridSkeleton />;
  }

  if (error) {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/5 px-4 text-center">
        <p className="text-sm font-medium text-destructive">Không thể tải danh sách dự án</p>
        <p className="mt-2 text-sm text-muted-foreground">{toErrorMessage(error)}</p>
        <Button variant="outline" className="mt-4" onClick={onRetry}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Thử lại
        </Button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 text-center">
        <FolderKanban className="h-10 w-10 text-muted-foreground" />
        <p className="mt-4 text-lg font-semibold">Không có dự án phù hợp</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Hãy tạo dự án mới hoặc điều chỉnh bộ lọc để xem kết quả.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="text-[11px] text-muted-foreground">
        {isLoadingThumbnails ? "Đang tải thumbnail..." : `Hiển thị ${items.length} dự án`}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {items.map((item) => (
          <ProjectCard
            key={item.project.edit_id}
            item={item}
            isDeleting={deletingProjectId === item.project.edit_id}
            isRenaming={renamingProjectId === item.project.edit_id}
            onOpen={onOpenProject}
            onDelete={onDeleteProject}
            onRename={onRenameProject}
          />
        ))}
      </div>
    </div>
  );
}

function ProjectGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: 16 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-lg border border-border/70">
          <Skeleton className="aspect-video rounded-none" />
          <div className="space-y-1.5 p-2.5">
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

function toErrorMessage(error: unknown) {
  return getUserFacingErrorMessage(
    error,
    "Hiện chưa thể tải danh sách dự án. Vui lòng thử lại sau.",
  );
}
