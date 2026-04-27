"use client";

import { useState } from "react";
import { Star, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCreateFeedback } from "../../api/feedback.hooks";

export interface ReviewSubmitPayload {
  rating: number;
  reviewText: string;
}

interface Props {
  courseId: number;
  onSuccess?: (payload: ReviewSubmitPayload) => void;
}

export function WriteReviewForm({ courseId, onSuccess }: Props) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const { mutate, isPending } = useCreateFeedback(courseId);

  const handleSubmit = () => {
    if (rating < 1 || !reviewText.trim()) return;
    setApiError(null);
    mutate(
      { courseId, rating, reviewText: reviewText.trim() },
      {
        onSuccess: () => {
          setSubmitted(true);
          onSuccess?.({ rating, reviewText: reviewText.trim() });
        },
        onError: (err: unknown) => {
          const msg =
            (err as { response?: { data?: { message?: string } } })?.response
              ?.data?.message ?? "Gửi đánh giá thất bại. Vui lòng thử lại.";
          setApiError(msg);
        },
      },
    );
  };

  if (submitted) {
    return (
      <div className="mb-6 flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/10 p-6">
        <CheckCircle className="h-5 w-5 shrink-0 text-green-400" />
        <div>
          <p className="font-semibold text-green-400">Cảm ơn bạn đã đánh giá!</p>
          <p className="text-sm text-muted-foreground">
            Đánh giá của bạn sẽ giúp các học viên khác tìm được khóa học phù hợp.
          </p>
        </div>
      </div>
    );
  }

  const activeStars = hovered || rating;
  const canSubmit = rating >= 1 && reviewText.trim().length > 0 && !isPending;

  const ratingLabels: Record<number, string> = {
    1: "Rất tệ",
    2: "Tệ",
    3: "Bình thường",
    4: "Tốt",
    5: "Tuyệt vời",
  };

  return (
    <div className="mb-6 rounded-xl border border-border/60 bg-muted/20 p-6">
      <h3 className="mb-4 text-lg font-bold">Viết đánh giá của bạn</h3>

      {/* Star selector */}
      <div className="mb-4">
        <p className="mb-2 text-sm text-muted-foreground">Đánh giá của bạn</p>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setRating(i)}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(0)}
              className="transition-transform hover:scale-110 focus:outline-none"
              aria-label={`${i} sao`}
            >
              <Star
                className={cn(
                  "h-8 w-8 transition-colors",
                  i <= activeStars
                    ? "fill-primary text-primary"
                    : "text-muted-foreground/30",
                )}
              />
            </button>
          ))}
          {activeStars > 0 && (
            <span className="ml-2 text-sm font-medium text-primary">
              {ratingLabels[activeStars]}
            </span>
          )}
        </div>
      </div>

      {/* Review text */}
      <div className="mb-4">
        <p className="mb-2 text-sm text-muted-foreground">Nhận xét của bạn</p>
        <textarea
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="Chia sẻ trải nghiệm học tập của bạn về khóa học này..."
          rows={4}
          maxLength={65535}
          className={cn(
            "w-full resize-none rounded-lg border border-border bg-background p-3 text-sm",
            "placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30",
            "transition-colors",
          )}
        />
      </div>

      {/* Error */}
      {apiError && (
        <p className="mb-3 text-sm text-destructive">{apiError}</p>
      )}

      {/* Submit */}
      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={!canSubmit} className="min-w-32">
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang gửi...
            </>
          ) : (
            "Gửi đánh giá"
          )}
        </Button>
      </div>
    </div>
  );
}
