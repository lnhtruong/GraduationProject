"use client";

import { useState, useEffect } from "react";
import { Star, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { getInitials } from "../../utils";
import { WriteReviewForm, type ReviewSubmitPayload } from "./WriteReviewForm";
import { useFeedbackList } from "../../api/feedback.hooks";
import type { FeedbackItem } from "../../types";

interface Props {
  courseId: number;
  isEnrolled: boolean;
  currentUserId?: number;
}

export function ReviewsSection({ courseId, isEnrolled, currentUserId }: Props) {
  const [page, setPage] = useState(1);
  const [allItems, setAllItems] = useState<FeedbackItem[]>([]);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [checkedReview, setCheckedReview] = useState(false); // trang đầu đã load xong chưa

  const { data, isLoading, isError } = useFeedbackList(courseId, page, currentUserId);

  useEffect(() => {
    if (!data?.items) return;
    const incoming = data.items;
    setAllItems((prev) => (page === 1 ? incoming : [...prev, ...incoming]));
    if (page === 1) {
      // Sau khi trang đầu load: kiểm tra user đã review chưa
      // BE trả toàn bộ items khi gọi kèm userId, nếu có item của user → đã review
      if (currentUserId && incoming.some((i) => i.userId === currentUserId)) {
        setHasReviewed(true);
      }
      setCheckedReview(true);
    }
  }, [data, page, currentUserId]);

  const handleReviewSuccess = ({ rating, reviewText }: ReviewSubmitPayload) => {
    const optimistic: FeedbackItem = {
      id: Date.now(),
      courseId,
      userId: currentUserId ?? 0,
      rating,
      reviewText,
      isVisible: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user: { id: currentUserId ?? 0, firstName: "Bạn", lastName: "" },
    };
    setAllItems((prev) => [optimistic, ...prev]);
    setHasReviewed(true);
  };

  const summary = data?.summary;
  const pagination = data?.pagination;
  const hasMore = !!pagination && page < pagination.totalPages;
  const stars = Array.from({ length: 5 }, (_, i) => i + 1);

  return (
    <section>
      <h2 className="mb-5 text-xl font-bold">Đánh giá học viên</h2>

      {/* Điều kiện: đã enroll (bypass tạm) + trang đầu đã load + chưa review */}
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

      {/* Review list */}
      {isLoading && allItems.length === 0 ? (
        <ReviewSkeleton />
      ) : isError ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Không thể tải đánh giá. Vui lòng thử lại.
        </p>
      ) : allItems.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá!
        </p>
      ) : (
        <div className="divide-y divide-border/40">
          {allItems.map((item) => (
            <ReviewCard
              key={item.id}
              item={item}
              isOwn={currentUserId === item.userId}
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

function ReviewCard({ item, isOwn }: { item: FeedbackItem; isOwn: boolean }) {
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
        <button className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
          <ThumbsUp className="h-3.5 w-3.5" />
          Hữu ích
        </button>
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
