import { cn } from "@/lib/utils";

interface KeepDurationMeterProps {
  keepDurationSec: number;
  targetMaxSec: number;
}

function formatDuration(seconds: number): string {
  return `${Math.round(seconds)}s`;
}

export default function KeepDurationMeter({
  keepDurationSec,
  targetMaxSec,
}: KeepDurationMeterProps) {
  const exceeded = keepDurationSec > targetMaxSec;
  const ratio = targetMaxSec > 0 ? Math.min(1, keepDurationSec / targetMaxSec) : 0;

  return (
    <div
      className={cn(
        "rounded-md border p-3 text-sm",
        exceeded
          ? "border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/30"
          : "border-border",
      )}
    >
      <div className="flex items-center justify-between">
        <span className={cn("font-medium", exceeded && "text-red-600 dark:text-red-400")}>
          Tổng thời lượng đoạn ưu tiên
        </span>
        <span className={cn("font-mono", exceeded && "text-red-600 dark:text-red-400")}>
          {formatDuration(keepDurationSec)} / {formatDuration(targetMaxSec)}
        </span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full transition-all",
            exceeded ? "bg-red-500" : "bg-primary",
          )}
          style={{ width: `${Math.max(4, ratio * 100)}%` }}
        />
      </div>
      {exceeded && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">
          Đã vượt thời lượng cho phép. Vui lòng bỏ bớt đoạn ưu tiên trước khi tạo highlight.
        </p>
      )}
    </div>
  );
}
