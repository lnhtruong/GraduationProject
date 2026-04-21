"use client";

import { useState, useEffect } from "react";
import { Star, ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { getInitials } from "../../utils";
import { WriteReviewForm, type ReviewSubmitPayload } from "./WriteReviewForm";
import {
  useFeedbackList,
  useCheckUserReview,
  useToggleReaction,
} from "../../api/feedback.hooks";
import type { FeedbackItem, FeedbackReactionType } from "../../types";

interface Props {
  courseId: number;
  isEnrolled: boolean;
  currentUserId?: number;
}

export function ReviewsSection({ courseId, isEnrolled, currentUserId }: Props) {
  const [page, setPage] = useState(1);
  const [allItems, setAllItems] = useState<FeedbackItem[]>([]);

  const { data, isLoading, isError } = useFeedbackList(courseId, page, currentUserId);

  // Check if current user has reviewed — only when logged in
  const {
    data: checkData,
    isLoading: isCheckLoading,
  } = useCheckUserReview(courseId, !!currentUserId);

  const hasReviewed = !!checkData?.checked;
  const ownReview = checkData?.data ?? null;

  useEffect(() => {
    if (!data?.items) return;
    const incoming = data.items;
    // Filter out the own review from list — it'll be pinned at top
    const others = ownReview
      ? incoming.filter((i) => i.id !== ownReview.id)
      : incoming;
    setAllItems((prev) => (page === 1 ? others : [...prev, ...others]));
  }, [data, page, ownReview]);

  const handleReviewSuccess = (_payload: ReviewSubmitPayload) => {
    // Real data arrives via query invalidation triggered by useCreateFeedback
    setAllItems((prev) => prev.filter((i) => i.userId !== currentUserId));
  };

  const summary = data?.summary;
  const pagination = data?.pagination;
  const hasMore = !!pagination && page < pagination.totalPages;
  const stars = Array.from({ length: 5 }, (_, i) => i + 1);

  const checkedReview = !isCheckLoading;

  return (
    <section>
      <h2 className="mb-5 text-xl font-bold">Đánh giá học viên</h2>

      {isEnrolled && checkedReview && !hasReviewed && (
        <WriteReviewForm courseId={courseId} onSuccess={handleReviewSuccess} />
      )}

      {/* Rating summary */}
      {isLoading && !summary ? (
        <div className="mb-6 h-36 animate-pulse rounded-xl bg-muted/30" />
      ) : (
        <div className="mb-6 flex flex-col gap-6 rounded-xl border border-border/60 bg-muted/20 p-6 sm:flex-row sm:items-center">
          <div className="flex shrink-0 flex-col items-center gap-1">
            <span className="text-6xl font-black leading-none text-primary">
              {(summary?.averageRating ?? 0).toFixed(1)}
            </span>
            <div className="flex gap-0.5">
              {stars.map((i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-4 w-4",
                    i <= Math.round(summary?.averageRating ?? 0)
                      ? "fill-primary text-primary"
                      : "text-muted-foreground/30",
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              {(summary?.totalReviews ?? 0).toLocaleString("vi-VN")} đánh giá
            </span>
          </div>

          <Separator orientation="vertical" className="hidden h-24 sm:block" />
          <Separator className="sm:hidden" />

          <div className="flex-1 space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const dist = summary?.distribution.find((d) => d.rating === star);
              const pct = dist?.percentage ?? 0;
              return (
                <div key={star} className="flex items-center gap-3">
                  <span className="w-3 shrink-0 text-right text-xs text-muted-foreground">
                    {star}
                  </span>
                  <Star className="h-3 w-3 shrink-0 fill-primary text-primary" />
                  <Progress value={pct} className="h-2 flex-1 bg-border/60" />
                  <span className="w-10 shrink-0 text-right text-xs text-muted-foreground">
                    {Math.round(pct)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pinned own review */}
      {ownReview && (
        <div className="mb-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-primary/70">
            Đánh giá của bạn
          </p>
          <ReviewCard
            item={ownReview}
            isOwn
            currentUserId={currentUserId}
            courseId={courseId}
          />
        </div>
      )}

      {/* Review list */}
      {isLoading && allItems.length === 0 ? (
        <ReviewSkeleton />
      ) : isError ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Không thể tải đánh giá. Vui lòng thử lại.
        </p>
      ) : allItems.length === 0 && !ownReview ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá!
        </p>
      ) : (
        <div className="divide-y divide-border/40">
          {allItems.map((item) => (
            <ReviewCard
              key={item.id}
              item={item}
              isOwn={false}
              currentUserId={currentUserId}
              courseId={courseId}
            />
          ))}
        </div>
      )}

      {hasMore && (
        <div className="mt-6 flex justify-center">
          <Button
            variant="outline"
            onClick={() => setPage((p) => p + 1)}
            disabled={isLoading}
            className="w-52"
          >
            {isLoading ? "Đang tải..." : "Xem thêm đánh giá"}
          </Button>
        </div>
      )}
    </section>
  );
}

interface ReviewCardProps {
  item: FeedbackItem;
  isOwn: boolean;
  currentUserId?: number;
  courseId: number;
}

function ReviewCard({ item, isOwn, currentUserId, courseId }: ReviewCardProps) {
  const fullName = item.user
    ? `${item.user.firstName} ${item.user.lastName}`.trim()
    : "Học viên";
  const initials = item.user
    ? getInitials(item.user.firstName, item.user.lastName)
    : "HV";
  const date = new Date(item.created_at).toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const stars = Array.from({ length: 5 }, (_, i) => i + 1);

  const reaction = item.reactionSummary;
  const currentReaction = reaction?.currentUserReactionType ?? null;
  const helpfulCount =
    reaction?.byType.find((r) => r.reactionType === "help_ful")?.count ?? 0;
  const dislikeCount =
    reaction?.byType.find((r) => r.reactionType === "dislike")?.count ?? 0;

  const { mutate: toggleReaction, isPending } = useToggleReaction(courseId);

  const handleReaction = (type: FeedbackReactionType) => {
    if (!currentUserId) return;
    toggleReaction({
      feedbackId: item.id,
      reactionType: type,
      currentReaction,
    });
  };

  return (
    <div className={cn("flex gap-4 py-5", isOwn && "rounded-lg bg-primary/5 px-3")}>
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">{fullName}</span>
          {isOwn && (
            <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs text-primary">
              Của bạn
            </span>
          )}
          <div className="flex gap-0.5">
            {stars.map((i) => (
              <Star
                key={i}
                className={cn(
                  "h-3.5 w-3.5",
                  i <= item.rating
                    ? "fill-primary text-primary"
                    : "text-muted-foreground/30",
                )}
              />
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{date}</p>
        <p className="text-sm leading-relaxed text-foreground">{item.reviewText}</p>

        {/* Reaction buttons — hidden on own review */}
        {!isOwn && (
          <div className="flex items-center gap-3 pt-1">
            <span className="text-xs text-muted-foreground">Đánh giá hữu ích?</span>
            <button
              onClick={() => handleReaction("help_ful")}
              disabled={isPending || !currentUserId}
              className={cn(
                "flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors",
                currentReaction === "help_ful"
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                !currentUserId && "cursor-default opacity-50",
              )}
              title={!currentUserId ? "Đăng nhập để đánh giá" : undefined}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
              <span>Có ích</span>
              {helpfulCount > 0 && (
                <span className="font-medium">({helpfulCount})</span>
              )}
            </button>
            <button
              onClick={() => handleReaction("dislike")}
              disabled={isPending || !currentUserId}
              className={cn(
                "flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors",
                currentReaction === "dislike"
                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                !currentUserId && "cursor-default opacity-50",
              )}
              title={!currentUserId ? "Đăng nhập để đánh giá" : undefined}
            >
              <ThumbsDown className="h-3.5 w-3.5" />
              <span>Không</span>
              {dislikeCount > 0 && (
                <span className="font-medium">({dislikeCount})</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewSkeleton() {
  return (
    <div className="divide-y divide-border/40">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex animate-pulse gap-4 py-5">
          <div className="h-10 w-10 shrink-0 rounded-full bg-muted/40" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-4 w-32 rounded bg-muted/40" />
            <div className="h-3 w-24 rounded bg-muted/40" />
            <div className="h-4 w-full rounded bg-muted/40" />
            <div className="h-4 w-3/4 rounded bg-muted/40" />
          </div>
        </div>
      ))}
    </div>
  );
}
