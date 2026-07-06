import Link from "next/link";
import {
  ChevronRight,
  Globe,
  BarChart2,
  Clock,
  RefreshCw,
  Star,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDuration, formatMonthYear } from "../../utils";
import type { CourseDetail } from "../../types";

interface Props {
  course: CourseDetail;
  isEnrolled: boolean;
}

const LEVEL_LABELS: Record<string, string> = {
  Beginner: "Sơ cấp",
  Intermediate: "Trung cấp",
  Advanced: "Nâng cao",
};

export function CourseHeroSection({ course, isEnrolled }: Props) {
  const stars = Array.from({ length: 5 }, (_, i) => i + 1);

  return (
    <section className="relative overflow-hidden bg-linear-to-br from-[#1a1400] via-[#2a1f00] to-[#1c1206] text-white">
      {/* primary amber glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_-10%,oklch(0.7664_0.1585_68_/_0.22),transparent)]" />
      {/* subtle warm shimmer bottom */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-primary/40 to-transparent" />

      <div className="container relative mx-auto max-w-7xl px-4 py-10 lg:px-8 lg:py-14">
        <div className="space-y-4 lg:max-w-[calc(100%-368px)]">
          {/* Breadcrumb */}
          <nav className="flex flex-wrap items-center gap-1 text-xs text-slate-400">
            <Link href="/" className="transition-colors hover:text-white">
              Trang chủ
            </Link>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <Link href="/courses/search" className="transition-colors hover:text-white">
              Khóa học
            </Link>
            {course.categories[0] && (
              <>
                <ChevronRight className="h-3 w-3 shrink-0" />
                <Link
                  href={`/courses/search?categoryId=${course.categories[0].id}`}
                  className="transition-colors hover:text-white"
                >
                  {course.categories[0].name}
                </Link>
              </>
            )}
          </nav>

          {/* Title */}
          <h1 className="text-2xl font-bold leading-tight text-white lg:text-[2.1rem]">
            {course.name}
          </h1>

          {/* Rating row */}
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-bold text-primary">
              {course.ratingSummary.average.toFixed(1)}
            </span>
            <div className="flex items-center gap-0.5">
              {stars.map((i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-4 w-4",
                    i <= Math.round(course.ratingSummary.average)
                      ? "fill-primary text-primary"
                      : "text-slate-600",
                  )}
                />
              ))}
            </div>
            <span className="text-slate-400">
              ({course.ratingSummary.total.toLocaleString("vi-VN")} đánh giá)
            </span>
            {course.totalStudents > 0 && (
              <>
                <span className="text-slate-600">•</span>
                <span className="flex items-center gap-1 text-slate-400">
                  <Users className="h-3.5 w-3.5" />
                  {course.totalStudents.toLocaleString("vi-VN")} học viên
                </span>
              </>
            )}
            {isEnrolled && (
              <span className="inline-flex items-center gap-1 rounded-full border border-green-500/30 bg-green-500/15 px-2.5 py-0.5 text-xs text-green-400">
                ✓ Đã đăng ký
              </span>
            )}
          </div>

          {/* Instructor */}
          <p className="text-sm text-slate-400">
            Tạo bởi{" "}
            <a
              href="#instructor"
              className="text-primary underline transition-colors hover:text-primary/80"
            >
              {course.instructor.firstName} {course.instructor.lastName}
            </a>
          </p>

          {/* Meta row */}
          <div className="flex flex-wrap gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" />
              {course.language}
            </span>
            <span className="flex items-center gap-1.5">
              <BarChart2 className="h-3.5 w-3.5" />
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[11px]",
                  course.level === "Beginner" &&
                    "border-primary/30 bg-primary/10 text-primary",
                  course.level === "Intermediate" &&
                    "border-orange-400/30 bg-orange-400/10 text-orange-400",
                  course.level === "Advanced" &&
                    "border-destructive/30 bg-destructive/10 text-destructive",
                )}
              >
                {LEVEL_LABELS[course.level]}
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {formatDuration(course.duration)}
            </span>
            <span className="flex items-center gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" />
              Cập nhật {formatMonthYear(course.lastUpdatedAt)}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
