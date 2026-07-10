"use client";

import { useCallback, useMemo, useState } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { NewsfeedItem } from "../types";
import type { NewsfeedOptionBoxContentType } from "../store/newsfeed-ui.store";
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
  const [syncedCommentState, setSyncedCommentState] = useState<{
    feedId: number | null;
    count: number;
  } | null>(null);
  const sourceCommentCount = video?.stats.comments ?? 0;
  const syncedCommentCount =
    syncedCommentState?.feedId === (video?.feedId ?? null)
      ? syncedCommentState.count
      : null;
  const commentCount =
    syncedCommentCount === null
      ? sourceCommentCount
      : Math.max(sourceCommentCount, syncedCommentCount);
  const commentCountLabel = useMemo(() => commentCount.toLocaleString("vi-VN"), [commentCount]);
  const handleCommentCountChange = useCallback(
    (count: number) => {
      setSyncedCommentState({ feedId: video?.feedId ?? null, count });
    },
    [video?.feedId],
  );

  return (
    <aside
      className={cn(
        "fixed bottom-0 right-0 z-40 h-[82vh] max-h-[calc(100vh-64px)] w-full rounded-t-3xl border-l border-border/70 bg-background/95 backdrop-blur transition-transform duration-300",
        "md:top-16 md:bottom-auto md:right-[72px] md:h-[calc(100vh-64px)] md:w-[380px] md:rounded-none lg:w-[450px] xl:w-[520px]",
        isOpen ? "translate-y-0 md:translate-x-0" : "translate-y-full md:translate-y-0 md:translate-x-full",
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
            <NewsfeedCommentsPanel
              video={video}
              viewerName={viewerName}
              sortOrder={sortOrder}
              onCommentCountChange={handleCommentCountChange}
            />
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
