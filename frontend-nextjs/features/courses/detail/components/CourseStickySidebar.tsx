"use client";

import Link from "next/link";
import {
  Play,
  Video,
  FileText,
  Award,
  Infinity,
  Smartphone,
  Timer,
  Lock,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { formatPrice, daysUntil } from "../../utils";
import type { CourseDetail, Enrollment } from "../../types";

interface Props {
  course: CourseDetail;
  enrollment: Enrollment | null;
  isAuthenticated: boolean;
  onEnroll: () => void;
  onAddToCart?: () => void;
  isEnrolling?: boolean;
  isAddingToCart?: boolean;
}

const INCLUDES = [
  { icon: Video, label: (c: CourseDetail) => `${Math.round(c.duration / 3600)} giờ video theo yêu cầu` },
  { icon: FileText, label: (c: CourseDetail) => `${c.totalLessons} bài học` },
  { icon: Award, label: () => "Chứng chỉ hoàn thành", cond: (c: CourseDetail) => c.hasCertificate },
  { icon: Infinity, label: () => "Truy cập trọn đời" },
  { icon: Smartphone, label: () => "Học trên di động & desktop" },
];

export function CourseStickySidebar({ course, enrollment, isAuthenticated, onEnroll, onAddToCart, isEnrolling, isAddingToCart }: Props) {
  const discountDays = course.discountEndAt ? daysUntil(course.discountEndAt) : null;
  const isFree = course.price === 0;
  const isEnrolled = enrollment !== null;
  const isCompleted = enrollment?.status === "completed";

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-[0_8px_40px_rgba(0,0,0,0.13)]">
      {/* Thumbnail / preview */}
      <div className="group relative aspect-video cursor-pointer overflow-hidden bg-zinc-900">
        {course.thumbnailUrl ? (
          <img
            src={course.thumbnailUrl}
            alt={course.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/50" />
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors group-hover:bg-black/20">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-lg transition-all group-hover:scale-110 group-hover:bg-white">
            <Play className="ml-1 h-6 w-6 fill-zinc-900 text-zinc-900" />
          </div>
        </div>
        {/* "Xem trước" label */}
        <span className="absolute bottom-3 left-0 right-0 text-center text-xs font-medium text-white/80">
          Xem video giới thiệu khoá học
        </span>
      </div>

      <div className="space-y-4 p-5">
        {/* Price */}
        {!isEnrolled && (
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-baseline gap-2">
              {isFree ? (
                <span className="text-2xl font-extrabold text-foreground">Miễn phí</span>
              ) : (
                <>
                  <span className="text-2xl font-extrabold text-foreground">
                    {formatPrice(course.price)}
                  </span>
                  {course.originalPrice && course.originalPrice > course.price && (
                    <span className="text-sm text-muted-foreground line-through">
                      {formatPrice(course.originalPrice)}
                    </span>
                  )}
                  {course.originalPrice && (
                    <span className="rounded-full bg-destructive px-2 py-0.5 text-[11px] font-bold text-white">
                      Giảm{" "}
                      {Math.round((1 - course.price / course.originalPrice) * 100)}%
                    </span>
                  )}
                </>
              )}
            </div>
            {discountDays !== null && (
              <p className="flex items-center gap-1.5 text-xs text-destructive">
                <Timer className="h-3.5 w-3.5" />
                Còn {discountDays} ngày với giá này
              </p>
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
        <EnrollButton
          course={course}
          enrollment={enrollment}
          isAuthenticated={isAuthenticated}
          onEnroll={onEnroll}
          onAddToCart={onAddToCart}
          isEnrolling={isEnrolling}
          isAddingToCart={isAddingToCart}
        />

        {/* Guarantee */}
        {!isEnrolled && (
          <p className="flex items-center justify-center gap-1 text-center text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            Đảm bảo hoàn tiền 30 ngày
          </p>
        )}

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
}: {
  course: CourseDetail;
  enrollment: Enrollment | null;
  isAuthenticated: boolean;
  onEnroll: () => void;
  onAddToCart?: () => void;
  isEnrolling?: boolean;
  isAddingToCart?: boolean;
}) {
  if (!isAuthenticated) {
    return (
      <Button size="lg" variant="outline" className="w-full" asChild>
        <Link href={`/signin?returnUrl=/courses/${course.id}`}>
          Đăng nhập để đăng ký
        </Link>
      </Button>
    );
  }

  if (!enrollment) {
    if (course.price === 0) {
      return (
        <Button
          size="lg"
          className="w-full shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30"
          onClick={onEnroll}
          disabled={isEnrolling}
        >
          {isEnrolling ? "Đang đăng ký..." : "Đăng ký miễn phí"}
        </Button>
      );
    }
    return (
      <div className="space-y-2">
        <Button
          size="lg"
          className="w-full bg-accent text-accent-foreground shadow-md shadow-accent/25 hover:bg-accent/90"
          onClick={onEnroll}
          disabled={isEnrolling}
        >
          {isEnrolling ? "Đang xử lý..." : `Mua ngay — ${formatPrice(course.price)}`}
        </Button>
        {onAddToCart && (
          <Button
            size="lg"
            variant="outline"
            className="w-full"
            onClick={onAddToCart}
            disabled={isAddingToCart}
          >
            {isAddingToCart ? "Đang thêm..." : "Thêm vào giỏ hàng"}
          </Button>
        )}
      </div>
    );
  }

  if (enrollment.status === "completed") {
    return (
      <Button size="lg" variant="outline" className="w-full border-primary/40 text-primary hover:bg-primary/5" asChild>
        <Link href={`/courses/${course.id}/learn`}>Xem lại khoá học</Link>
      </Button>
    );
  }

  return (
    <Button
      size="lg"
      variant="outline"
      className="w-full border-primary/40 text-primary hover:bg-primary/5"
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
