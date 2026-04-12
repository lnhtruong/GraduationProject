"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, MoreVertical, Wand2, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface StudioHeaderProps {
  activeSessionName: string;
  activeEditId: number | null;
  isLoading: boolean;
  onStartEmptyProject: () => void;
  onSaveSession: (name: string) => Promise<void>;
  hasMascotOverlay?: boolean;
  isCreatingMascotVideo?: boolean;
  mascotProgress?: string;
  onCreateMascotVideo?: () => void | Promise<void>;
}

export function StudioHeader({
  activeSessionName,
  activeEditId,
  isLoading,
  onStartEmptyProject,
  onSaveSession,
  hasMascotOverlay = false,
  isCreatingMascotVideo = false,
  mascotProgress = "",
  onCreateMascotVideo,
}: StudioHeaderProps) {
  const [draftName, setDraftName] = useState(activeSessionName);
  const [isNameEditing, setIsNameEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isNameEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isNameEditing]);

  const trimmedDraftName = useMemo(() => draftName.trim(), [draftName]);
  const canSave = Boolean(activeEditId) && !isLoading;

  const handleSave = async () => {
    if (!canSave) return;
    const nextName = trimmedDraftName || activeSessionName;
    await onSaveSession(nextName);
  };

  const handleCommitName = async () => {
    if (!activeEditId) return;

    if (!trimmedDraftName) {
      setDraftName(activeSessionName);
      setIsNameEditing(false);
      return;
    }

    if (trimmedDraftName !== activeSessionName && !isLoading) {
      await onSaveSession(trimmedDraftName);
    }

    setIsNameEditing(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--muted)/0.35)_100%)] backdrop-blur">
      <div className="flex h-14 items-center justify-between gap-3 px-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onStartEmptyProject}
            className="h-8 w-8 p-0 hover:bg-accent/80"
            title="Project rỗng"
          >
            <ArrowLeft size={18} />
          </Button>
          {activeEditId ? (
            isNameEditing ? (
              <Input
                ref={inputRef}
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onBlur={() => {
                  void handleCommitName();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void handleCommitName();
                  }
                  if (e.key === "Escape") {
                    e.preventDefault();
                    setDraftName(activeSessionName);
                    setIsNameEditing(false);
                  }
                }}
                className="h-9 w-56 sm:w-80 border-border bg-background/90 text-sm font-semibold"
                placeholder="Tên dự án"
                aria-label="Tên dự án"
              />
            ) : (
              <button
                type="button"
                className="max-w-[70vw] truncate rounded px-1 text-left text-base font-semibold tracking-tight transition hover:bg-accent/40 sm:text-lg"
                onClick={() => {
                  setDraftName(activeSessionName);
                  setIsNameEditing(true);
                }}
                title="Nhấn để đổi tên dự án"
              >
                {activeSessionName}
              </button>
            )
          ) : (
            <h2 className="truncate text-base font-semibold tracking-tight sm:text-lg">
              {activeSessionName}
            </h2>
          )}
        </div>

        <div className="flex items-center gap-2">
          {activeEditId ? (
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isCreatingMascotVideo || isLoading}
                      className="h-9 w-9 p-0"
                      title="Tùy chọn video"
                    >
                      {isCreatingMascotVideo ? (
                        <Loader size={16} className="animate-spin" />
                      ) : (
                        <MoreVertical size={16} />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  {isCreatingMascotVideo
                    ? `Đang tạo video: ${mascotProgress}`
                    : "Tùy chọn video mascot"}
                </TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => {
                    void onCreateMascotVideo?.();
                  }}
                  disabled={isCreatingMascotVideo || isLoading}
                  className="cursor-pointer flex items-center gap-2"
                >
                  <Wand2 size={16} />
                  <span>Tạo video mascot</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}

          {activeEditId ? (
            <Button
              size="sm"
              onClick={() => {
                void handleSave();
              }}
              disabled={!canSave}
              className="h-9"
            >
              Lưu dự án
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
