"use client";

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

interface Props {
  feeds: FeedStatItem[];
  isLoading: boolean;
}

export function FeedStatsSection({ feeds, isLoading }: Props) {
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
    <Table>
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
          <TableRow key={item.feedId} className="border-border/40">
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
  );
}
