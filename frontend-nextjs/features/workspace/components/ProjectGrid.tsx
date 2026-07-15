import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserFacingErrorMessage } from "@/lib/user-facing-error";
import { AppEmptyState } from "@/features/_shared/components/AppEmptyState";
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
      <AppEmptyState
        icon={<RefreshCcw className="h-8 w-8" />}
        title="Không thể tải danh sách dự án"
        description={toErrorMessage(error)}
        tone="destructive"
        action={
          <Button variant="outline" onClick={onRetry}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Thử lại
          </Button>
        }
      />
    );
  }

  if (items.length === 0) {
    return (
      <AppEmptyState
        icon={<FolderKanban className="h-8 w-8" />}
        title="Không có dự án phù hợp"
        description="Hãy tạo dự án mới hoặc điều chỉnh bộ lọc để xem kết quả."
      />
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
        <Card key={index} className="gap-0 overflow-hidden rounded-lg border-border/70 py-0">
          <Skeleton className="aspect-video rounded-none" />
          <CardContent className="space-y-1.5 p-2.5">
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-3 w-3/5" />
          </CardContent>
        </Card>
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
