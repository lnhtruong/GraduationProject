"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Video,
  FileText,
  Award,
  Infinity,
  Smartphone,
  CheckCircle,
  ShoppingCart,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "../../utils";
import type { CourseDetail, Enrollment } from "../../types";

interface Props {
  course: CourseDetail;
  enrollment: Enrollment | null;
  isAuthenticated: boolean;
  onEnroll: () => void;
  onAddToCart?: () => void;
  isEnrolling?: boolean;
  isAddingToCart?: boolean;
  isInCart?: boolean;
  isInWishlist?: boolean;
  onToggleWishlist?: () => void;
  isTogglingWishlist?: boolean;
  hidePurchaseActions?: boolean;
}

const INCLUDES = [
  { icon: Video, label: (c: CourseDetail) => `${Math.round(c.duration / 3600)} giờ video theo yêu cầu` },
  { icon: FileText, label: (c: CourseDetail) => `${c.totalLessons} bài học` },
  { icon: Award, label: () => "Chứng chỉ hoàn thành", cond: (c: CourseDetail) => c.hasCertificate },
  { icon: Infinity, label: () => "Truy cập trọn đời" },
  { icon: Smartphone, label: () => "Học trên di động & desktop" },
];

export function CourseStickySidebar({ course, enrollment, isAuthenticated, onEnroll, onAddToCart, isEnrolling, isAddingToCart, isInCart, isInWishlist, onToggleWishlist, isTogglingWishlist, hidePurchaseActions = false }: Props) {
  const isFree = course.price === 0;
  const isEnrolled = enrollment !== null;
  const isCompleted = enrollment?.status === "completed";

  return (
    <div data-course-enroll-cta className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-[0_8px_40px_rgba(0,0,0,0.13)]">
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-zinc-900">
        {course.thumbnailUrl ? (
          <Image src={course.thumbnailUrl} alt={course.name} fill sizes="(max-width: 1024px) 100vw, 384px" className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-primary/20 via-primary/8 to-accent/10" />
        )}
      </div>

      <div className="space-y-4 p-5">
        {/* Price */}
        {!isEnrolled && !hidePurchaseActions && (
          <div className="flex flex-wrap items-baseline gap-2">
            {isFree ? (
              <span className="text-2xl font-extrabold text-foreground">Miễn phí</span>
            ) : (
              <span className="text-2xl font-extrabold text-foreground">
                {formatPrice(course.price)}
              </span>
            )}
          </div>
        )}

        {/* Enrolled state header */}
        {isEnrolled && (
          <div className="flex items-center gap-2 rounded-lg border border-green-500/25 bg-green-500/8 px-3 py-2">
            <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />
            <span className="text-sm font-medium text-green-600 dark:text-green-400">
              {isCompleted ? "Đã hoàn thành khoá học" : "Đang học khoá học này"}
            </span>
          </div>
        )}

        {/* CTA button */}
        {hidePurchaseActions ? (
          <div className="rounded-lg border border-border/70 bg-muted/35 px-3 py-2 text-sm text-muted-foreground">
            Tài khoản quản trị chỉ xem và duyệt nội dung, không thực hiện mua hoặc thêm khóa học vào giỏ hàng.
          </div>
        ) : (
          <EnrollButton
            course={course}
            enrollment={enrollment}
            isAuthenticated={isAuthenticated}
            onEnroll={onEnroll}
            onAddToCart={onAddToCart}
            isEnrolling={isEnrolling}
            isAddingToCart={isAddingToCart}
            isInCart={isInCart}
            isInWishlist={isInWishlist}
            onToggleWishlist={onToggleWishlist}
            isTogglingWishlist={isTogglingWishlist}
          />
        )}

        {/* Guarantee */}
        {/* {!isEnrolled && (
          <p className="flex items-center justify-center gap-1 text-center text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            Đảm bảo hoàn tiền 30 ngày
          </p>
        )} */}

        {/* Progress (enrolled) */}
        {isEnrolled && enrollment && (
          <div className="space-y-1.5">
            <Progress value={enrollment.progress} className="h-2" />
            <p className="text-right text-xs text-muted-foreground">
              {enrollment.progress}% hoàn thành
            </p>
          </div>
        )}

        <Separator />

        {/* Course includes */}
        <div className="space-y-2.5">
          <p className="text-sm font-semibold">Khoá học bao gồm:</p>
          <ul className="space-y-2">
            {INCLUDES.map(({ icon: Icon, label, cond }) => {
              if (cond && !cond(course)) return null;
              return (
                <li key={label(course)} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{label(course)}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// EnrollButton — 5 states
// ---------------------------------------------------------------------------
function EnrollButton({
  course,
  enrollment,
  isAuthenticated,
  onEnroll,
  onAddToCart,
  isEnrolling,
  isAddingToCart,
  isInCart,
  isInWishlist,
  onToggleWishlist,
  isTogglingWishlist,
}: {
  course: CourseDetail;
  enrollment: Enrollment | null;
  isAuthenticated: boolean;
  onEnroll: () => void;
  onAddToCart?: () => void;
  isEnrolling?: boolean;
  isAddingToCart?: boolean;
  isInCart?: boolean;
  isInWishlist?: boolean;
  onToggleWishlist?: () => void;
  isTogglingWishlist?: boolean;
}) {
  if (!isAuthenticated) {
    return (
      <Button
        size="lg"
        variant="outline"
        className="w-full border-border bg-background text-foreground hover:!bg-muted hover:!text-foreground"
        asChild
      >
        <Link href={`/signin?returnUrl=/courses/${course.id}`}>
          Đăng nhập để đăng ký
        </Link>
      </Button>
    );
  }

  if (!enrollment) {
    if (course.price === 0) {
      return (
        <div className="space-y-2">
          <Button
            size="lg"
            className="w-full shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30"
            onClick={onEnroll}
            disabled={isEnrolling}
          >
            {isEnrolling ? "Đang đăng ký..." : "Đăng ký miễn phí"}
          </Button>
          {onToggleWishlist && (
            <WishlistToggleButton
              isInWishlist={!!isInWishlist}
              onToggle={onToggleWishlist}
              isPending={!!isTogglingWishlist}
            />
          )}
        </div>
      );
    }
    return (
      <div className="space-y-2">
        <Button
          size="lg"
          className="w-full bg-primary text-primary-foreground shadow-md shadow-primary/25 hover:bg-primary/90 hover:text-primary-foreground"
          onClick={onEnroll}
          disabled={isEnrolling}
        >
          {isEnrolling ? "Đang xử lý..." : `Mua ngay — ${formatPrice(course.price)}`}
        </Button>
        {onAddToCart && (
          isInCart ? (
            <Button
              size="lg"
              variant="outline"
              className="w-full border-green-500/50 bg-green-500/8 text-green-700 hover:!bg-green-500/15 hover:!text-green-700 dark:text-green-400 dark:hover:!text-green-300"
              asChild
            >
              <Link href="/cart">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Đã có trong giỏ hàng
              </Link>
            </Button>
          ) : (
            <Button
              size="lg"
              variant="outline"
              className="w-full border-border bg-background text-foreground hover:!bg-muted hover:!text-foreground"
              onClick={onAddToCart}
              disabled={isAddingToCart}
            >
              {isAddingToCart ? "Đang thêm..." : "Thêm vào giỏ hàng"}
            </Button>
          )
        )}
        {onToggleWishlist && (
          <WishlistToggleButton
            isInWishlist={!!isInWishlist}
            onToggle={onToggleWishlist}
            isPending={!!isTogglingWishlist}
          />
        )}
      </div>
    );
  }

  if (enrollment.status === "completed") {
    return (
      <Button size="lg" className="w-full shadow-sm hover:text-primary-foreground" asChild>
        <Link href={`/courses/${course.id}/learn`}>Xem lại khoá học</Link>
      </Button>
    );
  }

  return (
    <Button
      size="lg"
      className="w-full shadow-sm hover:text-primary-foreground"
      asChild
    >
      <Link
        href={`/courses/${course.id}/learn${enrollment.lastLessonId ? `?lesson=${enrollment.lastLessonId}` : ""}`}
      >
        Tiếp tục học
      </Link>
    </Button>
  );
}

// ---------------------------------------------------------------------------
// WishlistToggleButton — full-width, dùng trong sidebar
// ---------------------------------------------------------------------------
function WishlistToggleButton({
  isInWishlist,
  onToggle,
  isPending,
}: {
  isInWishlist: boolean;
  onToggle: () => void;
  isPending: boolean;
}) {
  return (
    <Button
      size="lg"
      variant="outline"
      className="w-full gap-2 border-border bg-background text-foreground hover:!bg-muted hover:!text-foreground"
      onClick={onToggle}
      disabled={isPending}
    >
      <Heart
        className={
          isInWishlist
            ? "h-4 w-4 fill-red-500 text-red-500"
            : "h-4 w-4 fill-none text-muted-foreground"
        }
      />
      {isPending
        ? "Đang cập nhật..."
        : isInWishlist
          ? "Đã lưu khóa học"
          : "Lưu khóa học"}
    </Button>
  );
}
