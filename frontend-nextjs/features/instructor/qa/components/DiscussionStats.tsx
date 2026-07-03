import { BookOpen, CheckCircle2, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DiscussionStatus } from "../types";

interface DiscussionStatsProps {
  totalCount: number;
  unansweredCount: number;
  answeredCount: number;
  status: DiscussionStatus | undefined;
  onStatusChange: (status: DiscussionStatus | undefined) => void;
}

export function DiscussionStats({
  totalCount,
  unansweredCount,
  answeredCount,
  status,
  onStatusChange,
}: DiscussionStatsProps) {
  const items = [
    {
      key: "all" as const,
      label: "Tổng",
      labelFull: "Tổng thảo luận",
      icon: BookOpen,
      value: totalCount,
      isActive: !status,
      activeClass:
        "border-amber-500 bg-amber-500/10 dark:border-amber-500/50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 shadow-sm ring-1 ring-amber-500/15",
    },
    {
      key: "unanswered" as const,
      label: "Chưa trả lời",
      labelFull: "Chưa phản hồi",
      icon: HelpCircle,
      value: unansweredCount,
      isActive: status === "unanswered",
      activeClass:
        "border-orange-500 bg-orange-500/10 dark:border-orange-500/50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 shadow-sm ring-1 ring-orange-500/15",
    },
    {
      key: "answered" as const,
      label: "Đã trả lời",
      labelFull: "Đã phản hồi",
      icon: CheckCircle2,
      value: answeredCount,
      isActive: status === "answered",
      activeClass:
        "border-emerald-500 bg-emerald-500/10 dark:border-emerald-500/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 shadow-sm ring-1 ring-emerald-500/15",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 pt-0.5">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.key}
            onClick={() => onStatusChange(item.key === "all" ? undefined : item.key)}
            className={cn(
              "rounded-xl border p-2.5 text-left transition-all duration-200 cursor-pointer select-none",
              item.isActive
                ? item.activeClass
                : "border-zinc-200 dark:border-zinc-800/80 bg-background dark:bg-zinc-950/40 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/60",
            )}
          >
            {/* Number + icon on same row */}
            <div className="flex items-center justify-between gap-1">
              <span className={cn(
                "text-lg sm:text-xl font-bold leading-none",
                item.isActive ? "" : "text-zinc-800 dark:text-zinc-200",
              )}>
                {item.value}
              </span>
              <Icon className={cn(
                "h-3.5 w-3.5 shrink-0",
                item.isActive ? "" : "text-zinc-400 dark:text-zinc-500",
              )} />
            </div>
            {/* Label below */}
            <p className="mt-1 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide leading-tight truncate">
              <span className="sm:hidden">{item.label}</span>
              <span className="hidden sm:inline">{item.labelFull}</span>
            </p>
          </button>
        );
      })}
    </div>
  );
}
