"use client";

import { useRouter } from "next/navigation";
import { Video } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import type { FeedStatItem } from "../../analytics/types";

function StatCell({ value }: { value: number }) {
  return (
    <TableCell className="tabular-nums text-sm text-muted-foreground">
      {value.toLocaleString("vi-VN")}
    </TableCell>
  );
}

function FeedMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-muted/60 px-3 py-2">
      <p className="text-[10px] font-medium uppercase text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}

interface Props {
  feeds: FeedStatItem[];
  isLoading: boolean;
}

export function FeedStatsSection({ feeds, isLoading }: Props) {
  const router = useRouter();
  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (feeds.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <Video className="h-8 w-8 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">Chưa có dữ liệu feed</p>
      </div>
    );
  }

  return (
    <>
      <div className="divide-y divide-border/50 lg:hidden">
        {feeds.map((item) => (
          <button
            key={item.feedId}
            type="button"
            className="block w-full px-4 py-4 text-left transition-colors hover:bg-primary/[0.03]"
            onClick={() =>
              router.push(`/instructor/courses/${item.course.id}/feed/${item.feedId}/edit`)
            }
          >
            <div className="mb-3">
              <p className="line-clamp-2 text-sm font-semibold">{item.title}</p>
              <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                {item.course.name}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <FeedMetric label="Lượt xem" value={item.stats.views.toLocaleString("vi-VN")} />
              <FeedMetric label="Likes" value={item.stats.likes.toLocaleString("vi-VN")} />
              <FeedMetric label="Comments" value={item.stats.comments.toLocaleString("vi-VN")} />
              <FeedMetric
                label="Engagement"
                value={`${item.stats.engagementRate.toFixed(1)}%`}
              />
            </div>

            <div className="mt-3 flex items-center justify-between rounded-lg border border-border/50 px-3 py-2 text-xs">
              <span className="text-muted-foreground">Hoàn thành</span>
              <span
                className={`font-semibold tabular-nums ${
                  item.stats.completionRate >= 50
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-muted-foreground"
                }`}
              >
                {item.stats.completionRate.toFixed(1)}%
              </span>
            </div>
          </button>
        ))}
      </div>

      <Table className="hidden min-w-[58rem] lg:table">
      <TableHeader>
        <TableRow className="bg-muted/20 hover:bg-muted/20">
          <TableHead className="pl-5 font-medium text-muted-foreground">Tên feed</TableHead>
          <TableHead className="font-medium text-muted-foreground">Khóa học</TableHead>
          <TableHead className="font-medium text-muted-foreground">Lượt xem</TableHead>
          <TableHead className="font-medium text-muted-foreground">Likes</TableHead>
          <TableHead className="font-medium text-muted-foreground">Saves</TableHead>
          <TableHead className="font-medium text-muted-foreground">Shares</TableHead>
          <TableHead className="font-medium text-muted-foreground">Comments</TableHead>
          <TableHead className="font-medium text-muted-foreground">Engagement</TableHead>
          <TableHead className="pr-5 font-medium text-muted-foreground">Hoàn thành</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {feeds.map((item) => (
          <TableRow
            key={item.feedId}
            className="cursor-pointer border-border/40 transition-colors hover:bg-primary/[0.03]"
            onClick={() => router.push(`/instructor/courses/${item.course.id}/feed/${item.feedId}/edit`)}
          >
            <TableCell className="py-3.5 pl-5">
              <p className="line-clamp-1 max-w-[180px] text-sm font-medium">{item.title}</p>
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {item.course.name}
            </TableCell>
            <StatCell value={item.stats.views} />
            <StatCell value={item.stats.likes} />
            <StatCell value={item.stats.saves} />
            <StatCell value={item.stats.shares} />
            <StatCell value={item.stats.comments} />
            <TableCell>
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                {item.stats.engagementRate.toFixed(1)}%
              </span>
            </TableCell>
            <TableCell className="pr-5">
              <span className={`text-xs font-medium tabular-nums ${
                item.stats.completionRate >= 50
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-muted-foreground"
              }`}>
                {item.stats.completionRate.toFixed(1)}%
              </span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      </Table>
    </>
  );
}
