import { X, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SubtitleLine } from "@/features/upload/types";

function formatTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const mm = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const ss = (total % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}

interface HighlightEditRowProps {
  line: SubtitleLine;
  displayStart: number;
  displayEnd: number;
  isMarked: boolean;
  onToggle: () => void;
}

export default function HighlightEditRow({
  line,
  displayStart,
  displayEnd,
  isMarked,
  onToggle,
}: HighlightEditRowProps) {
  const actionLabel = isMarked ? "Giữ lại đoạn này" : "Bỏ đoạn này khỏi highlight";
  const Icon = isMarked ? RotateCcw : X;

  return (
    <div
      data-subtitle-index={line.index}
      className={cn(
        "grid select-none grid-cols-[minmax(0,1fr)_2.5rem] gap-x-3 gap-y-1 rounded-lg border px-3 py-2.5 text-sm transition sm:grid-cols-[5.25rem_minmax(0,1fr)_2.5rem]",
        isMarked
          ? "border-red-200 bg-red-50/90 text-red-950 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-100"
          : "border-border bg-background hover:bg-muted/20",
      )}
    >
      <div className="col-start-1 row-start-1 whitespace-nowrap pt-0.5 font-mono text-[11px] text-muted-foreground sm:col-auto sm:row-auto">
        {formatTime(displayStart)} - {formatTime(displayEnd)}
      </div>

      <p
        className={cn(
          "col-start-1 row-start-2 line-clamp-2 min-w-0 leading-5 sm:col-auto sm:row-auto",
          isMarked && "text-muted-foreground line-through decoration-red-500/70",
        )}
        title={line.text}
      >
        {line.text}
      </p>

      <button
        type="button"
        aria-label={actionLabel}
        title={actionLabel}
        onClick={onToggle}
        className={cn(
          "col-start-2 row-span-2 row-start-1 flex h-9 w-9 cursor-pointer items-center justify-center justify-self-end rounded-full border transition sm:row-span-1 sm:h-8 sm:w-8",
          isMarked
            ? "border-red-500 bg-red-500 text-white hover:bg-red-600"
            : "border-border bg-background text-muted-foreground hover:border-red-300 hover:bg-red-50 hover:text-red-600",
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}