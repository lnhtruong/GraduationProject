"use client";

import { useMemo, useState } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { NewsfeedItem } from "../types";
import type { NewsfeedOptionBoxContentType } from "../store/newsfeed-ui.store";
import { useNewsfeedFeedDetailStats } from "../api/newsfeed.hooks";
import { NewsfeedCommentsPanel } from "./NewsfeedCommentsPanel";
import { NewsfeedCoursePanel } from "./NewsfeedCoursePanel";

type CommentSortOrder = "newest" | "oldest";

interface NewsfeedOptionBoxProps {
  isOpen: boolean;
  contentType: NewsfeedOptionBoxContentType;
  video: NewsfeedItem | null;
  viewerName: string;
  onClose: () => void;
}

export function NewsfeedOptionBox({
  isOpen,
  contentType,
  video,
  viewerName,
  onClose,
}: NewsfeedOptionBoxProps) {
  const [sortOrder, setSortOrder] = useState<CommentSortOrder>("newest");
  const feedStatsQuery = useNewsfeedFeedDetailStats(
    video?.feedId ?? null,
    isOpen && contentType === "comments" && Boolean(video),
  );

  const commentCount = feedStatsQuery.data?.stats.comments ?? video?.stats.comments ?? 0;
  const commentCountLabel = useMemo(() => commentCount.toLocaleString("vi-VN"), [commentCount]);

  return (
    <aside
      className={cn(
        "fixed top-16 z-40 h-[calc(100vh-64px)] w-full border-l border-border/70 bg-background/95 backdrop-blur transition-transform duration-300",
        "right-0 md:right-[72px] md:w-[520px] lg:w-[560px]",
        isOpen ? "translate-x-0" : "translate-x-full",
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
          {contentType === "comments" ? (
            <div className="flex items-center gap-3">
              <p className="text-sm font-semibold">
                Bình luận <span className="font-normal text-muted-foreground">{commentCountLabel}</span>
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSortOrder((current) => (current === "newest" ? "oldest" : "newest"))}
                className="h-8 gap-2 rounded-full border border-border/60 bg-background/80 px-3 text-xs hover:bg-accent"
              >
                <Filter className="h-3.5 w-3.5" />
                {sortOrder === "newest" ? "Mới nhất" : "Cũ nhất"}
              </Button>
            </div>
          ) : (
            <p className="text-sm font-semibold">Thông tin khóa học</p>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-10 w-10 rounded-full border border-border/70 bg-background/90 hover:bg-accent"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-hidden">
          {contentType === "comments" ? (
            <NewsfeedCommentsPanel video={video} viewerName={viewerName} sortOrder={sortOrder} />
          ) : video ? (
            <div className="h-full p-5">
              <NewsfeedCoursePanel video={video} />
            </div>
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
              Chọn một video để xem chi tiết.
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
