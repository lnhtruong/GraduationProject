"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CourseHeroSection } from "./components/CourseHeroSection";
import { CourseStickySidebar } from "./components/CourseStickySidebar";
import { CourseContentAccordion } from "./components/CourseContentAccordion";
import { InstructorSection } from "./components/InstructorSection";
import { ReviewsSection } from "./components/ReviewsSection";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { useAuthStore } from "@/store/auth";
import { useEnrollmentCheck } from "../api/enrollment.api";
import { useCourseDetail } from "../api/courseDetail.api";
import { useBuyNow } from "@/features/payment/api/payment.hooks";
import { useAddToCart, useIsInCart } from "@/features/cart/api/cart.hooks";
import { useIsInWishlist, useToggleWishlistMutation } from "@/features/wishlist/api/wishlist.hooks";

// ---------------------------------------------------------------------------
// Inline minor sections
// ---------------------------------------------------------------------------

function DescriptionSection({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const safeDescription = useMemo(() => sanitizeHtml(text), [text]);
  if (!text) return null;
  return (
    <section>
      <h2 className="mb-4 text-xl font-bold">Mô tả khoá học</h2>
      <div className="relative">
        <div
          className={`whitespace-pre-line text-sm leading-relaxed text-muted-foreground ${
            expanded ? "" : "line-clamp-5"
          }`}
          dangerouslySetInnerHTML={{ __html: safeDescription }}
        />
        {!expanded && (
          <div className="pointer-events-none absolute bottom-0 h-12 w-full bg-gradient-to-t from-background to-transparent" />
        )}
      </div>
      <button
        onClick={() => setExpanded((e) => !e)}
        className="mt-2 text-sm font-medium text-primary transition-colors hover:text-primary/80"
      >
        {expanded ? "Thu gọn ▲" : "Xem thêm ▼"}
      </button>
    </section>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0">
      <div className="bg-muted/30 px-4 py-16">
        <div className="container mx-auto max-w-7xl space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-5 w-1/3" />
        </div>
      </div>
      <div className="container mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="space-y-6">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-60 w-full" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main feature component
// ---------------------------------------------------------------------------

interface Props {
  courseId: number;
}

export default function CourseDetail({ courseId }: Props) {
  const { data: course, isLoading, isError } = useCourseDetail(courseId);
  const router = useRouter();

  const { user } = useAuthStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const { data: enrollment } = useEnrollmentCheck(courseId, user?.id);

  const buyNow = useBuyNow(courseId);
  const addToCart = useAddToCart();
  const isInCart = useIsInCart(courseId);
  const isInWishlist = useIsInWishlist(courseId);
  const toggleWishlist = useToggleWishlistMutation();

  if (isLoading) return <LoadingSkeleton />;

  if (isError || !course) {
    return (
      <div className="container mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-4 py-20 text-center">
        <div className="space-y-3">
          <h1 className="text-2xl font-bold">Không tìm thấy khoá học</h1>
          <p className="text-muted-foreground">
            Khoá học này không tồn tại hoặc đã bị xoá.
          </p>
        </div>
      </div>
    );
  }

  const isEnrolled = enrollment !== null && enrollment !== undefined;

  const handleEnroll = () => {
    if (!isAuthenticated) {
      router.push(`/signin?returnUrl=/courses/${courseId}`);
      return;
    }
    buyNow.mutate(undefined, {
      onError: () => toast.error("Không thể xử lý yêu cầu. Vui lòng thử lại."),
    });
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      router.push(`/signin?returnUrl=/courses/${courseId}`);
      return;
    }
    addToCart.mutate(courseId, {
      onSuccess: () => toast.success("Đã thêm vào giỏ hàng!"),
      onError: () => toast.error("Không thể thêm vào giỏ. Vui lòng thử lại."),
    });
  };

  const handleToggleWishlist = () => {
    if (!isAuthenticated) {
      router.push(`/signin?returnUrl=/courses/${courseId}`);
      return;
    }
    toggleWishlist.mutate(
      { courseId, currentlyInWishlist: isInWishlist },
      {
        onSuccess: () => {
          if (isInWishlist) {
            toast.success("Đã xóa khỏi danh sách lưu");
          } else {
            toast.success("Đã lưu khóa học", {
              description: "Xem tại Khóa học đã lưu",
              action: {
                label: "Xem ngay",
                onClick: () => router.push("/wishlist"),
              },
            });
          }
        },
        onError: () => toast.error("Không thể cập nhật danh sách lưu."),
      },
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero ────────────────────────────────────────── */}
      <CourseHeroSection course={course} isEnrolled={isEnrolled} />

      {/* ── Body ────────────────────────────────────────── */}
      <div className="container mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex gap-8">

          {/* ── Left content column ─────────────────────── */}
          <div className="min-w-0 flex-1 space-y-10 py-8">

            {/* Mobile: sidebar inline before main content */}
            <div className="lg:hidden">
              <CourseStickySidebar
                course={course}
                enrollment={enrollment ?? null}
                isAuthenticated={isAuthenticated}
                onEnroll={handleEnroll}
                onAddToCart={course.price > 0 ? handleAddToCart : undefined}
                isEnrolling={buyNow.isPending}
                isAddingToCart={addToCart.isPending}
                isInCart={isInCart}
                isInWishlist={isInWishlist}
                onToggleWishlist={handleToggleWishlist}
                isTogglingWishlist={toggleWishlist.isPending}
              />
            </div>

            <CourseContentAccordion
              courseId={courseId}
              lessons={course.lessons}
              isEnrolled={isEnrolled}
            />

            <DescriptionSection text={course.description} />

            <InstructorSection instructor={course.instructor} courseId={courseId} />

            <ReviewsSection
              courseId={courseId}
              isEnrolled={isEnrolled}
              currentUserId={user?.id}
            />
          </div>

          {/* ── Right sticky sidebar (desktop only) ─────── */}
          <div className="hidden w-80 shrink-0 lg:block lg:-mt-52">
            <div className="sticky top-24">
              <CourseStickySidebar
                course={course}
                enrollment={enrollment ?? null}
                isAuthenticated={isAuthenticated}
                onEnroll={handleEnroll}
                onAddToCart={course.price > 0 ? handleAddToCart : undefined}
                isEnrolling={buyNow.isPending}
                isAddingToCart={addToCart.isPending}
                isInCart={isInCart}
                isInWishlist={isInWishlist}
                onToggleWishlist={handleToggleWishlist}
                isTogglingWishlist={toggleWishlist.isPending}
              />
            </div>
          </div>

        </div>
      </div>

      {/* ── Mobile bottom CTA bar ───────────────────────── */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-border/60 bg-background/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-sm lg:hidden">
        {enrollment ? (
          <>
            <span className="text-sm font-medium text-primary">{enrollment.progress ?? 0}% hoàn thành</span>
            <Button size="lg" variant="outline" className="flex-1 border-primary/40 text-primary" asChild>
              <a href={`/courses/${course.id}/learn`}>Tiếp tục học</a>
            </Button>
          </>
        ) : (
          <>
            {course.price > 0 && (
              <span className="text-base font-bold text-foreground">
                {course.price.toLocaleString("vi-VN")}đ
              </span>
            )}
            <Button
              size="lg"
              className="flex-1 shadow-md shadow-primary/20"
              onClick={handleEnroll}
              disabled={buyNow.isPending}
            >
              {buyNow.isPending
                ? "Đang xử lý..."
                : course.price === 0 ? "Đăng ký miễn phí" : "Mua ngay"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
