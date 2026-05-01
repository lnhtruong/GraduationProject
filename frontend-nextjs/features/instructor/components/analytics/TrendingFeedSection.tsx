"use client";

import { Flame, Eye, Heart } from "lucide-react";
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
        "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
        styles[rank] ?? "bg-muted text-muted-foreground",
      )}
    >
      #{rank}
    </span>
  );
}

function ScoreBadge({ score }: { score: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
      <Flame className="h-3 w-3" />
      {score.toFixed(0)}
    </span>
  );
}

function TopCard({ item }: { item: TrendingFeedItem }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-amber-400/30 bg-gradient-to-br from-amber-50/60 via-background to-background p-5 dark:from-amber-950/20">
      <div className="absolute right-4 top-4 opacity-10">
        <Flame className="h-16 w-16 text-amber-500" />
      </div>
      <div className="mb-3 flex items-start justify-between gap-3">
        <RankBadge rank={item.rank} />
        <ScoreBadge score={item.stats.score} />
      </div>
      <p className="mb-1 line-clamp-2 text-base font-semibold leading-snug">{item.title}</p>
      <p className="mb-4 text-xs text-muted-foreground">{item.course.name}</p>
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1 tabular-nums">
          <Eye className="h-3.5 w-3.5" />
          <span className="font-medium text-foreground">{item.stats.views.toLocaleString("vi-VN")}</span>
          lượt xem
        </span>
        <span className="inline-flex items-center gap-1 tabular-nums">
          <Heart className="h-3.5 w-3.5" />
          <span className="font-medium text-foreground">{item.stats.likes.toLocaleString("vi-VN")}</span>
          likes
        </span>
        <span className="tabular-nums">
          <span className="font-medium text-emerald-600 dark:text-emerald-400">{item.stats.completionRate.toFixed(1)}%</span>
          <span className="ml-1">hoàn thành</span>
        </span>
      </div>
    </div>
  );
}

function RegularCard({ item }: { item: TrendingFeedItem }) {
  return (
    <div className="flex flex-col rounded-xl border border-border/60 bg-card p-4">
      <div className="mb-2 flex items-start justify-between gap-2">
        <RankBadge rank={item.rank} />
        <ScoreBadge score={item.stats.score} />
      </div>
      <p className="mb-0.5 line-clamp-2 text-sm font-medium leading-snug">{item.title}</p>
      <p className="mb-3 text-xs text-muted-foreground">{item.course.name}</p>
      <div className="mt-auto flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1 tabular-nums">
          <Eye className="h-3 w-3" />
          <span className="font-medium text-foreground">{item.stats.views.toLocaleString("vi-VN")}</span>
        </span>
        <span className="inline-flex items-center gap-1 tabular-nums">
          <Heart className="h-3 w-3" />
          <span className="font-medium text-foreground">{item.stats.likes.toLocaleString("vi-VN")}</span>
        </span>
        <span className="tabular-nums">
          <span className="font-medium text-emerald-600 dark:text-emerald-400">{item.stats.completionRate.toFixed(1)}%</span>
        </span>
      </div>
    </div>
  );
}

interface Props {
  items: TrendingFeedItem[];
  isLoading: boolean;
}

export function TrendingFeedSection({ items, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-3 p-5">
        <Skeleton className="h-36 w-full rounded-xl" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
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

  const [top, ...rest] = items;

  return (
    <div className="space-y-3 p-5">
      {top && <TopCard item={top} />}
      {rest.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {rest.map((item) => (
            <RegularCard key={item.feedId} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
