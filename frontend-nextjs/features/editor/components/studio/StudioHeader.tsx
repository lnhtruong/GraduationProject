"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, Clapperboard, Loader, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface StudioHeaderProps {
  activeSessionName: string;
  activeEditId: number | null;
  isLoading: boolean;
  onStartEmptyProject: () => void;
  onSaveSession: (name: string) => Promise<void>;
  isCreatingMascotVideo?: boolean;
  onCreateMascotVideo?: () => void | Promise<void>;
  canCreateMascotVideo?: boolean;
  isFinalized?: boolean;
}

export function StudioHeader({
  activeSessionName,
  activeEditId,
  isLoading,
  onStartEmptyProject,
  onSaveSession,
  isCreatingMascotVideo = false,
  onCreateMascotVideo,
  canCreateMascotVideo = true,
  isFinalized = false,
}: StudioHeaderProps) {
  const [draftName, setDraftName] = useState(activeSessionName);
  const [isNameEditing, setIsNameEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraftName(activeSessionName);
  }, [activeSessionName]);

  useEffect(() => {
    if (isNameEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isNameEditing]);

  const trimmedDraftName = useMemo(() => draftName.trim(), [draftName]);
  const canSave = Boolean(activeEditId) && !isLoading && !isSaving && !isFinalized;

  const handleSave = async () => {
    if (!canSave) return;
    const nextName = trimmedDraftName || activeSessionName;
    setIsSaving(true);
    const toastId = toast.loading("Đang lưu dự án...");
    try {
      await onSaveSession(nextName);
      toast.success("Đã lưu dự án.", { id: toastId });
    } catch (error) {
      console.error("Save project failed:", error);
      toast.error("Không thể lưu dự án. Vui lòng thử lại.", { id: toastId });
    } finally {
      setIsSaving(false);
    }
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
      <div className="flex h-12 items-center justify-between gap-2 px-2 sm:h-14 sm:gap-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onStartEmptyProject}
            className="h-9 w-9 shrink-0 p-0 hover:bg-accent/80"
            title="Dự án mới"
          >
            <ArrowLeft size={18} />
          </Button>

          {activeEditId ? (
            isNameEditing ? (
              <Input
                ref={inputRef}
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                onBlur={() => {
                  void handleCommitName();
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void handleCommitName();
                  }
                  if (event.key === "Escape") {
                    event.preventDefault();
                    setDraftName(activeSessionName);
                    setIsNameEditing(false);
                  }
                }}
                className="h-9 w-[38vw] min-w-28 max-w-56 border-border bg-background/90 text-sm font-semibold sm:w-80 sm:max-w-none"
                placeholder="Tên dự án"
                aria-label="Tên dự án"
              />
            ) : (
              <div className="flex min-w-0 items-center gap-2">
                <button
                  type="button"
                  className="max-w-[34vw] truncate rounded px-1 text-left text-sm font-semibold tracking-tight transition hover:bg-accent/40 disabled:hover:bg-transparent sm:max-w-[70vw] sm:text-lg"
                  disabled={isFinalized}
                  onClick={() => {
                    setDraftName(activeSessionName);
                    setIsNameEditing(true);
                  }}
                  title={
                    isFinalized
                      ? "Dự án đã hoàn thành"
                      : "Nhấn để đổi tên dự án"
                  }
                >
                  {activeSessionName}
                </button>
                {isFinalized ? (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="size-3" />
                    Đã hoàn thành
                  </span>
                ) : null}
              </div>
            )
          ) : (
            <h2 className="truncate text-sm font-semibold tracking-tight sm:text-lg">
              {activeSessionName}
            </h2>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {activeEditId && !isFinalized ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                void handleSave();
              }}
              disabled={!canSave}
              className="h-9 gap-1.5 px-2.5 sm:px-3"
              title="Lưu dự án"
            >
              {isSaving ? (
                <Loader size={15} className="animate-spin" />
              ) : (
                <Save size={15} />
              )}
              <span className="hidden sm:inline">
                {isSaving ? "Đang lưu" : "Lưu dự án"}
              </span>
            </Button>
          ) : null}

          {activeEditId && !isFinalized && onCreateMascotVideo ? (
            <Button
              size="sm"
              disabled={!canCreateMascotVideo || isCreatingMascotVideo || isLoading}
              onClick={() => {
                void onCreateMascotVideo?.();
              }}
              className="h-9 gap-1.5 px-3 font-semibold"
            >
              {isCreatingMascotVideo ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  <span className="hidden sm:inline">Đang tạo...</span>
                  <span className="sm:hidden">Đang tạo</span>
                </>
              ) : (
                <>
                  <Clapperboard size={16} />
                  <span className="hidden sm:inline">Tạo video hoàn chỉnh</span>
                  <span className="sm:hidden">Tạo</span>
                </>
              )}
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
