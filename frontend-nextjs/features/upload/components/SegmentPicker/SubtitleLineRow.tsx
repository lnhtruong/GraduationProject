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
        "grid cursor-pointer select-none grid-cols-[5.5rem_minmax(0,1fr)_4.25rem] items-start gap-2 rounded-md border px-3 py-2 text-sm transition hover:bg-muted/30",
        mark === "keep" && "border-emerald-300 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30",
        mark === "remove" && "border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/30",
        !mark && "border-border",
        isHighlighted && "ring-2 ring-primary/60",
      )}
    >
      <div className="whitespace-nowrap pt-0.5 font-mono text-[11px] text-muted-foreground">
        {formatTime(line.startSec)} - {formatTime(line.endSec)}
      </div>
      <p className="line-clamp-2 min-w-0 leading-5" title={line.text}>{line.text}</p>
      <div className="flex shrink-0 items-center justify-end gap-1">
        <button
          type="button"
          aria-label="Đánh dấu giữ"
          title="Đánh dấu giữ"
          onMouseDown={(event) => {
            event.stopPropagation();
          }}
          onClick={(event) => {
            event.stopPropagation();
            onMark("keep");
          }}
          className={cn(
            "flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border transition hover:border-emerald-400 hover:bg-emerald-50",
            mark === "keep"
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-border text-muted-foreground",
          )}
        >
          <Check className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          aria-label="Đánh dấu bỏ"
          title="Đánh dấu bỏ"
          onMouseDown={(event) => {
            event.stopPropagation();
          }}
          onClick={(event) => {
            event.stopPropagation();
            onMark("remove");
          }}
          className={cn(
            "flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border transition hover:border-red-400 hover:bg-red-50",
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
