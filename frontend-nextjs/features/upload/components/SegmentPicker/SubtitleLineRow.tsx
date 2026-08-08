import * as React from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SegmentMarkState, SubtitleLine } from "../../types";

function formatTime(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const mm = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const ss = (total % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}

interface SubtitleLineRowProps {
  line: SubtitleLine;
  mark: SegmentMarkState | undefined;
  isHighlighted?: boolean;
  onMark: (mark: SegmentMarkState) => void;
  onMouseDown?: (event: React.MouseEvent) => void;
  onMouseEnter?: (event: React.MouseEvent) => void;
  onClick?: (event: React.MouseEvent) => void;
}

export default function SubtitleLineRow({
  line,
  mark,
  isHighlighted = false,
  onMark,
  onMouseDown,
  onMouseEnter,
  onClick,
}: SubtitleLineRowProps) {
  return (
    <div
      data-subtitle-index={line.index}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      className={cn(
        "flex select-none items-start gap-3 rounded-md border px-3 py-2 text-sm transition",
        mark === "keep" && "border-emerald-300 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30",
        mark === "remove" && "border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/30",
        !mark && "border-border",
        isHighlighted && "ring-2 ring-primary/60",
      )}
    >
      <div className="w-24 shrink-0 pt-0.5 font-mono text-xs text-muted-foreground">
        {formatTime(line.startSec)} - {formatTime(line.endSec)}
      </div>
      <p className="min-w-0 flex-1 leading-5">{line.text}</p>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          title="Đánh dấu ưu tiên"
          onClick={(event) => {
            event.stopPropagation();
            onMark("keep");
          }}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full border transition hover:border-emerald-400",
            mark === "keep"
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-border text-muted-foreground",
          )}
        >
          <Check className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          title="Đánh dấu loại bỏ"
          onClick={(event) => {
            event.stopPropagation();
            onMark("remove");
          }}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full border transition hover:border-red-400",
            mark === "remove"
              ? "border-red-500 bg-red-500 text-white"
              : "border-border text-muted-foreground",
          )}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
