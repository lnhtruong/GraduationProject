"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Loader, Save, Wand2 } from "lucide-react";
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
  mascotProgress?: string;
  onCreateMascotVideo?: () => void | Promise<void>;
}

export function StudioHeader({
  activeSessionName,
  activeEditId,
  isLoading,
  onStartEmptyProject,
  onSaveSession,
  isCreatingMascotVideo = false,
  mascotProgress = "",
  onCreateMascotVideo,
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
  const canSave = Boolean(activeEditId) && !isLoading && !isSaving;

  const handleSave = async () => {
    if (!canSave) return;
    const nextName = trimmedDraftName || activeSessionName;
    setIsSaving(true);
    try {
      await onSaveSession(nextName);
      toast.success("Đã lưu nháp");
    } catch (error) {
      console.error("Save draft failed:", error);
      toast.error("Không thể lưu nháp. Vui lòng thử lại.");
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
              <button
                type="button"
                className="max-w-[34vw] truncate rounded px-1 text-left text-sm font-semibold tracking-tight transition hover:bg-accent/40 sm:max-w-[70vw] sm:text-lg"
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
            <h2 className="truncate text-sm font-semibold tracking-tight sm:text-lg">
              {activeSessionName}
            </h2>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {activeEditId ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                void handleSave();
              }}
              disabled={!canSave}
              className="h-9 gap-1.5 px-2.5 sm:px-3"
              title="Lưu nháp"
            >
              {isSaving ? (
                <Loader size={15} className="animate-spin" />
              ) : (
                <Save size={15} />
              )}
              <span className="hidden sm:inline">
                {isSaving ? "Đang lưu" : "Lưu nháp"}
              </span>
            </Button>
          ) : null}

          {activeEditId && onCreateMascotVideo ? (
            <Button
              size="sm"
              disabled={isCreatingMascotVideo || isLoading}
              onClick={() => {
                void onCreateMascotVideo?.();
              }}
              className="h-9 gap-1.5 px-3 font-semibold"
            >
              {isCreatingMascotVideo ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  <span className="hidden sm:inline">
                    {mascotProgress
                      ? `Đang tạo (${mascotProgress})`
                      : "Đang tạo..."}
                  </span>
                  <span className="sm:hidden">Đang tạo</span>
                </>
              ) : (
                <>
                  <Wand2 size={16} />
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
