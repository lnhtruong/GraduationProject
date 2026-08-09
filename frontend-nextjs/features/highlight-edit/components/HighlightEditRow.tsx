import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SubtitleLine } from "@/features/upload/types";

function formatTime(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const mm = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const ss = (total % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}

interface HighlightEditRowProps {
  line: SubtitleLine;
  /** Position on the highlight's rendered timeline, not the source video's timestamps. */
  displayStart: number;
  displayEnd: number;
  isMarked: boolean;
  onToggle: () => void;
  isHighlighted?: boolean;
  onMouseDown?: (event: React.MouseEvent) => void;
  onMouseEnter?: (event: React.MouseEvent) => void;
}

export default function HighlightEditRow({
  line,
  displayStart,
  displayEnd,
  isMarked,
  onToggle,
  isHighlighted = false,
  onMouseDown,
  onMouseEnter,
}: HighlightEditRowProps) {
  const actionLabel = isMarked ? "Bỏ đánh dấu" : "Đánh dấu bỏ đoạn";

  return (
    <div
      data-subtitle-index={line.index}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      className={cn(
        "grid cursor-pointer select-none grid-cols-[5.5rem_minmax(0,1fr)_2.25rem] items-start gap-2 rounded-md border px-3 py-2 text-sm transition hover:bg-muted/30",
        isMarked
          ? "border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/30"
          : "border-border",
        isHighlighted && "ring-2 ring-primary/60",
      )}
    >
      <div className="whitespace-nowrap pt-0.5 font-mono text-[11px] text-muted-foreground">
        {formatTime(displayStart)} - {formatTime(displayEnd)}
      </div>
      <p
        className={cn(
          "line-clamp-2 min-w-0 leading-5",
          isMarked && "text-muted-foreground line-through",
        )}
        title={line.text}
      >
        {line.text}
      </p>
      <button
        type="button"
        aria-label={actionLabel}
        title={actionLabel}
        onMouseDown={(event) => {
          event.stopPropagation();
        }}
        onClick={(event) => {
          event.stopPropagation();
          onToggle();
        }}
        className={cn(
          "flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border transition hover:border-red-400 hover:bg-red-50",
          isMarked
            ? "border-red-500 bg-red-500 text-white"
            : "border-border text-muted-foreground",
        )}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}