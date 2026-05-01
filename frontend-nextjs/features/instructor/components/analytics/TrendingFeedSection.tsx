"use client";

import { Flame } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { TrendingFeedItem } from "../../analytics/types";

function RankBadge({ rank }: { rank: number }) {
  const styles: Record<number, string> = {
    1: "bg-amber-400/20 text-amber-500 border border-amber-400/40",
    2: "bg-slate-300/20 text-slate-500 border border-slate-300/40 dark:text-slate-400",
    3: "bg-orange-400/20 text-orange-600 border border-orange-400/40 dark:text-orange-400",
  };
  return (
    <span
      className={cn(
        "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
        styles[rank] ?? "bg-muted text-muted-foreground",
      )}
    >
      #{rank}
    </span>
  );
}

interface Props {
  items: TrendingFeedItem[];
  isLoading: boolean;
}

export function TrendingFeedSection({ items, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <Flame className="h-8 w-8 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">Chưa có dữ liệu trending</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/40">
      {items.map((item) => (
        <div key={item.feedId} className="flex items-center gap-4 px-5 py-3.5">
          <RankBadge rank={item.rank} />

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{item.title}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.course.name}</p>
          </div>

          <div className="flex shrink-0 items-center gap-4 text-xs text-muted-foreground">
            <span className="tabular-nums">
              <span className="mr-1 font-medium text-foreground">{item.stats.views.toLocaleString("vi-VN")}</span>
              lượt xem
            </span>
            <span className="tabular-nums">
              <span className="mr-1 font-medium text-foreground">{item.stats.likes.toLocaleString("vi-VN")}</span>
              likes
            </span>
            <span className="tabular-nums">
              <span className="mr-1 font-medium text-foreground">{item.stats.completionRate.toFixed(1)}%</span>
              HT
            </span>
          </div>

          <div className="shrink-0 text-right">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
              <Flame className="h-3 w-3" />
              {item.stats.score.toFixed(0)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
