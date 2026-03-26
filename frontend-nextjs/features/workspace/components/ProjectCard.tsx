import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Film, MoreVertical, SlidersHorizontal, Trash2 } from "lucide-react";
import type { WorkspaceProjectItem } from "../types";

interface ProjectCardProps {
  item: WorkspaceProjectItem;
  isDeleting: boolean;
  isRenaming: boolean;
  onOpen: (projectId: number) => void;
  onDelete: (projectId: number) => void;
  onRename: (projectId: number, sessionName: string) => Promise<boolean>;
}

export function ProjectCard({
  item,
  isDeleting,
  isRenaming,
  onOpen,
  onDelete,
  onRename,
}: ProjectCardProps) {
  const { project, thumbnail } = item;
  const [isNameEditing, setIsNameEditing] = useState(false);
  const [draftName, setDraftName] = useState(project.session_name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraftName(project.session_name);
  }, [project.session_name]);

  useEffect(() => {
    if (isNameEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isNameEditing]);

  const displayName = useMemo(
    () => toMiddleEllipsis(project.session_name),
    [project.session_name],
  );

  const commitRename = async () => {
    const trimmed = draftName.trim();
    if (!trimmed) {
      setDraftName(project.session_name);
      setIsNameEditing(false);
      return;
    }

    const renamed = await onRename(project.edit_id, trimmed);
    if (!renamed) {
      setDraftName(project.session_name);
      return;
    }

    setIsNameEditing(false);
  };

  return (
    <div className="group relative overflow-hidden rounded-lg border border-border/70 bg-card transition-all hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-md">
      <button
        type="button"
        onClick={() => {
          if (isNameEditing) return;
          onOpen(project.edit_id);
        }}
        className="flex w-full flex-col text-left"
      >
        <div className="relative aspect-[4/3] overflow-hidden border-b border-border/70">
          {thumbnail ? (
            <div
              className="h-full w-full bg-cover bg-center transition-transform duration-300 group-hover:scale-[1.02]"
              style={{ backgroundImage: `url(${thumbnail})` }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,hsl(var(--muted))_0%,hsl(var(--muted)/0.5)_100%)] text-muted-foreground">
              <div className="flex flex-col items-center gap-1 text-[10px] font-medium">
                <Film className="h-4 w-4" />
                Chưa có thumbnail
              </div>
            </div>
          )}
        </div>

        <div className="space-y-1.5 p-2.5">
          {isNameEditing ? (
            <Input
              ref={inputRef}
              value={draftName}
              disabled={isRenaming}
              onClick={(event) => {
                event.stopPropagation();
              }}
              onChange={(event) => setDraftName(event.target.value)}
              onBlur={() => {
                void commitRename();
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void commitRename();
                }

                if (event.key === "Escape") {
                  event.preventDefault();
                  setDraftName(project.session_name);
                  setIsNameEditing(false);
                }
              }}
              className="h-7 text-[11px] font-semibold"
              aria-label="Đổi tên dự án"
            />
          ) : (
            <p className="truncate text-[11px] font-semibold" title={project.session_name}>
              {displayName}
            </p>
          )}
        </div>
      </button>

      <div className="absolute right-1.5 top-1.5 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon-sm" className="size-7">
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              disabled={isRenaming}
              onSelect={(event) => {
                event.preventDefault();
                setDraftName(project.session_name);
                setIsNameEditing(true);
              }}
            >
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
              <SlidersHorizontal className="h-4 w-4" />
              Properties
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              disabled={isDeleting}
              onSelect={(event) => {
                event.preventDefault();
                onDelete(project.edit_id);
              }}
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? "Đang xóa..." : "Delete"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function toMiddleEllipsis(value: string) {
  const name = value.trim();
  if (name.length <= 24) return name;

  const chunk = Math.max(6, Math.floor(name.length * 0.32));
  const start = name.slice(0, chunk);
  const end = name.slice(-chunk);
  return `${start}...${end}`;
}
