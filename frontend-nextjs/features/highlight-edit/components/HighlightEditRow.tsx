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
  /** Position on the highlight's own rendered timeline (cumulative durations
   * up to this line) — NOT `line.startSec`/`endSec`, which are the source
   * video's timestamps. */
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
  return (
    <div
      data-subtitle-index={line.index}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      className={cn(
        "flex select-none items-start gap-3 rounded-md border px-3 py-2 text-sm transition",
        isMarked
          ? "border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/30"
          : "border-border",
        isHighlighted && "ring-2 ring-primary/60",
      )}
    >
      <div className="w-24 shrink-0 pt-0.5 font-mono text-xs text-muted-foreground">
        {formatTime(displayStart)} - {formatTime(displayEnd)}
      </div>
      <p
        className={cn(
          "min-w-0 flex-1 leading-5",
          isMarked && "text-muted-foreground line-through",
        )}
      >
        {line.text}
      </p>
      <button
        type="button"
        title={isMarked ? "Bỏ đánh dấu" : "Đánh dấu loại bỏ"}
        onClick={(event) => {
          event.stopPropagation();
          onToggle();
        }}
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition hover:border-red-400",
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
