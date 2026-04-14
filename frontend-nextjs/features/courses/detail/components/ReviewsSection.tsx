"use client";

import { useState } from "react";
import { Star, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { getInitials } from "../../utils";
import type { Review, RatingSummary } from "../../types";

interface Props {
  ratingSummary: RatingSummary;
  reviews: Review[];
}

const PAGE_SIZE = 3;

export function ReviewsSection({ ratingSummary, reviews }: Props) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visible = reviews.slice(0, visibleCount);
  const hasMore = visibleCount < reviews.length;

  const stars = Array.from({ length: 5 }, (_, i) => i + 1);

  return (
    <section>
      <h2 className="mb-5 text-xl font-bold">Đánh giá học viên</h2>

      {/* Rating summary */}
      <div className="mb-6 flex flex-col gap-6 rounded-xl border border-border/60 bg-muted/20 p-6 sm:flex-row sm:items-center">
        {/* Big number + stars */}
        <div className="flex shrink-0 flex-col items-center gap-1">
          <span className="text-6xl font-black text-primary leading-none">
            {ratingSummary.average.toFixed(1)}
          </span>
          <div className="flex gap-0.5">
            {stars.map((i) => (
              <Star
                key={i}
                className={cn(
                  "h-4 w-4",
                  i <= Math.round(ratingSummary.average)
                    ? "fill-primary text-primary"
                    : "text-muted-foreground/30",
                )}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            {ratingSummary.total.toLocaleString("vi-VN")} đánh giá
          </span>
        </div>

        <Separator orientation="vertical" className="hidden h-24 sm:block" />
        <Separator className="sm:hidden" />

        {/* Bars */}
        <div className="flex-1 space-y-2">
          {([5, 4, 3, 2, 1] as const).map((star) => {
            const count = ratingSummary.breakdown[star];
            const pct = ratingSummary.total > 0 ? (count / ratingSummary.total) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-3">
                <span className="w-3 shrink-0 text-right text-xs text-muted-foreground">
                  {star}
                </span>
                <Star className="h-3 w-3 shrink-0 fill-primary text-primary" />
                <Progress
                  value={pct}
                  className="h-2 flex-1 bg-border/60"
                />
                <span className="w-10 shrink-0 text-right text-xs text-muted-foreground">
                  {Math.round(pct)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Review list */}
      <div className="divide-y divide-border/40">
        {visible.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      {hasMore && (
        <div className="mt-6 flex justify-center">
          <Button
            variant="outline"
            onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
            className="w-52"
          >
            Xem thêm đánh giá
          </Button>
        </div>
      )}
    </section>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const user = review.user;
  const fullName = user ? `${user.firstName} ${user.lastName}` : "Học viên";
  const initials = user ? getInitials(user.firstName, user.lastName) : "HV";
  const date = new Date(review.createdAt).toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const stars = Array.from({ length: 5 }, (_, i) => i + 1);

  return (
    <div className="flex gap-4 py-5">
      <Avatar className="h-10 w-10 shrink-0">
        {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={fullName} />}
        <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">{fullName}</span>
          <div className="flex gap-0.5">
            {stars.map((i) => (
              <Star
                key={i}
                className={cn(
                  "h-3.5 w-3.5",
                  i <= review.rating ? "fill-primary text-primary" : "text-muted-foreground/30",
                )}
              />
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{date}</p>
        <p className="text-sm leading-relaxed text-foreground">{review.comment}</p>
        <button className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
          <ThumbsUp className="h-3.5 w-3.5" />
          Hữu ích
        </button>
      </div>
    </div>
  );
}
