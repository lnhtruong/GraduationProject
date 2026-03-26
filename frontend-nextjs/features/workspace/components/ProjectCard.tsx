import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CalendarClock, Film, MoreVertical, Trash2 } from "lucide-react";
import type { WorkspaceProjectItem } from "../types";

interface ProjectCardProps {
  item: WorkspaceProjectItem;
  isDeleting: boolean;
  onOpen: (projectId: number) => void;
  onDelete: (projectId: number) => void;
}

export function ProjectCard({
  item,
  isDeleting,
  onOpen,
  onDelete,
}: ProjectCardProps) {
  const { project, thumbnail } = item;

  return (
    <button
      type="button"
      onClick={() => onOpen(project.id)}
      className="group flex w-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card text-left transition-all hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-lg"
    >
      <div className="relative aspect-video overflow-hidden border-b border-border/70">
        {thumbnail ? (
          <div
            className="h-full w-full bg-cover bg-center transition-transform duration-300 group-hover:scale-[1.02]"
            style={{ backgroundImage: `url(${thumbnail})` }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,hsl(var(--muted))_0%,hsl(var(--muted)/0.5)_100%)] text-muted-foreground">
            <div className="flex flex-col items-center gap-2 text-xs font-medium">
              <Film className="h-6 w-6" />
              Chưa có thumbnail
            </div>
          </div>
        )}

        <div className="absolute right-2 top-2 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="icon-sm"
                onClick={(event) => event.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
              <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                disabled={isDeleting}
                onSelect={(event) => {
                  event.preventDefault();
                  onDelete(project.id);
                }}
              >
                <Trash2 className="h-4 w-4" />
                {isDeleting ? "Đang xóa..." : "Delete"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm text-muted-foreground">Project #{project.id}</p>
            <p className="mt-1 truncate text-lg font-semibold">{project.session_name}</p>
          </div>
          <Badge variant={getStatusVariant(project.status)}>{project.status}</Badge>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Video: {project.video_id ?? "Chưa chọn"}</span>
          <span className="inline-flex items-center gap-1">
            <CalendarClock className="h-3.5 w-3.5" />
            {formatDate(project.updated_at ?? project.created_at)}
          </span>
        </div>
      </div>
    </button>
  );
}

function formatDate(value?: string) {
  if (!value) {
    return "Vừa cập nhật";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Vừa cập nhật";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getStatusVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "finalized" || status === "completed") return "default";
  if (status === "saved" || status === "processing") return "secondary";
  if (status === "failed") return "destructive";
  return "outline";
}
