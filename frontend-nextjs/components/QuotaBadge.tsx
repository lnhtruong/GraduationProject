"use client";

import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useQuota, formatResetAt } from "@/features/_shared/quota";

/** Rút gọn lỗi axios thành một dòng để hiện trong tooltip lúc dev. */
function describeError(error: unknown): string {
  const err = error as
    | { response?: { status?: number; data?: unknown }; message?: string }
    | undefined;
  const status = err?.response?.status;
  if (status === 404) {
    return "404 — inference_service chưa có GET /quota (cần restart service).";
  }
  if (status === 401) {
    return "401 — token hết hạn hoặc chưa đăng nhập.";
  }
  if (status === 503) {
    return "503 — gateway không tới được inference_service.";
  }
  if (status) return `${status} — ${JSON.stringify(err?.response?.data)}`;
  return err?.message ?? "Không rõ lỗi";
}

/**
 * Số quota AI còn lại trong cửa sổ 24h. Chỉ render cho người dùng đã đăng nhập —
 * `GET /mascot_colab/quota` yêu cầu token.
 *
 * Khi lỗi: production ẩn hẳn (không làm phiền người dùng), dev hiện badge mờ
 * kèm lý do trong tooltip để không phải mò DevTools.
 */
export function QuotaBadge({ className }: { className?: string }) {
  const { data, isLoading, isError, error } = useQuota();

  const base = cn(
    "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-border/70 px-2.5 text-xs font-semibold sm:h-10 sm:px-3",
    className,
  );

  if (isError) {
    if (process.env.NODE_ENV === "production") return null;
    return (
      <span
        title={`Quota không tải được: ${describeError(error)}`}
        className={cn(base, "border-dashed text-muted-foreground/60")}
      >
        <Zap className="h-3.5 w-3.5" />
        <span className="tabular-nums">!</span>
      </span>
    );
  }

  if (isLoading || !data) {
    return (
      <span
        aria-hidden="true"
        className={cn(base, "animate-pulse text-muted-foreground/60")}
      >
        <Zap className="h-3.5 w-3.5" />
        <span className="tabular-nums">–/–</span>
      </span>
    );
  }

  const exhausted = data.remaining === 0;
  const resetAt = formatResetAt(data.resetAt);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          aria-label={`Còn ${data.remaining} trên ${data.limit} quota AI`}
          className={cn(
            base,
            exhausted
              ? "border-destructive/40 bg-destructive/5 text-destructive"
              : "text-muted-foreground",
          )}
        >
          <Zap className={cn("h-3.5 w-3.5", !exhausted && "text-primary")} />
          <span className="tabular-nums">
            {data.remaining}/{data.limit}
          </span>
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={6}>
        Còn {data.remaining}/{data.limit} quota AI
        {resetAt ? ` · reset lúc ${resetAt}` : ""}
      </TooltipContent>
    </Tooltip>
  );
}
