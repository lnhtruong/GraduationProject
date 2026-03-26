import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FolderKanban, RefreshCcw } from "lucide-react";
import { ProjectCard } from "./ProjectCard";
import type { WorkspaceProjectItem } from "../types";

interface ProjectGridProps {
  items: WorkspaceProjectItem[];
  isLoading: boolean;
  isLoadingThumbnails: boolean;
  deletingProjectId: number | null;
  error: unknown;
  onRetry: () => void;
  onOpenProject: (projectId: number) => void;
  onDeleteProject: (projectId: number) => void;
}

export function ProjectGrid({
  items,
  isLoading,
  isLoadingThumbnails,
  deletingProjectId,
  error,
  onRetry,
  onOpenProject,
  onDeleteProject,
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
    <div className="space-y-3">
      <div className="text-xs text-muted-foreground">
        {isLoadingThumbnails ? "Đang tải thumbnail..." : `Hiển thị ${items.length} dự án`}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <ProjectCard
            key={item.project.id}
            item={item}
            isDeleting={deletingProjectId === item.project.id}
            onOpen={onOpenProject}
            onDelete={onDeleteProject}
          />
        ))}
      </div>
    </div>
  );
}

function ProjectGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-2xl border border-border/70">
          <Skeleton className="aspect-video rounded-none" />
          <div className="space-y-3 p-4">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-4 w-3/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return "Đã xảy ra lỗi không xác định";
}
