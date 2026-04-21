"use client";

import {
  Check,
  X,
  DollarSign,
  Clock,
  Globe,
  BarChart2,
  Tag,
  Loader2,
  Video,
  FileText,
  BookOpen,
  AlertCircle,
  User,
} from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { CourseStatusBadge } from "../CourseStatusBadge";
import {
  useApproveCourse,
  useRejectCourse,
  useCourseLessons,
  useInstructorUser,
} from "../../api/admin-courses.hooks";
import type { Course } from "@/features/courses/types";
import type { Lesson } from "@/features/lessons/types";

const LEVEL_LABELS: Record<string, string> = {
  beginner: "Sơ cấp",
  intermediate: "Trung cấp",
  advanced: "Cao cấp",
};

const LANGUAGE_LABELS: Record<string, string> = {
  vi: "Tiếng Việt",
  en: "English",
};

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatPrice(price: number) {
  return price === 0 ? "Miễn phí" : `${price.toLocaleString("vi-VN")}đ`;
}

function formatDurationMins(mins?: number) {
  if (!mins || mins <= 0) return null;
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h > 0) return `${h}g${m > 0 ? ` ${m}p` : ""}`;
  return `${m}p`;
}

// ── Lesson list ──────────────────────────────────────────────────────────────

function LessonTypeIcon({ type }: { type: Lesson["contentType"] }) {
  return type === "video"
    ? <Video className="h-3.5 w-3.5 shrink-0 text-primary/70" />
    : <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />;
}

function LessonList({ courseId }: { courseId: number }) {
  const { data: lessons, isLoading, isError } = useCourseLessons(courseId);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
        <AlertCircle className="h-4 w-4 shrink-0" />
        Không thể tải danh sách bài học
      </div>
    );
  }

  if (!lessons || lessons.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-3 text-sm text-destructive">
        <AlertCircle className="h-4 w-4 shrink-0" />
        Chưa có bài học nào — cần lưu ý khi duyệt
      </div>
    );
  }

  const videoCount = lessons.filter((l) => l.contentType === "video").length;
  const textCount = lessons.filter((l) => l.contentType === "text").length;

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
          <BookOpen className="h-3 w-3" />
          {lessons.length} bài học
        </span>
        {videoCount > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
            <Video className="h-3 w-3" />
            {videoCount} video
          </span>
        )}
        {textCount > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            <FileText className="h-3 w-3" />
            {textCount} tài liệu
          </span>
        )}
      </div>

      {/* List */}
      <div className="divide-y divide-border/50 rounded-xl border border-border/60 bg-muted/10">
        {lessons.map((lesson, index) => (
          <div key={lesson.id} className="flex items-center gap-3 px-3 py-2.5">
            <span className="w-5 shrink-0 text-center text-xs text-muted-foreground/50">
              {index + 1}
            </span>
            <LessonTypeIcon type={lesson.contentType} />
            <span className="min-w-0 flex-1 truncate text-sm">{lesson.title}</span>
            {lesson.duration != null && lesson.duration > 0 && (
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatDurationMins(lesson.duration)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Instructor info ──────────────────────────────────────────────────────────

function InstructorInfo({ userId }: { userId: number }) {
  const { data: instructor, isLoading } = useInstructorUser(userId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3 w-36" />
        </div>
      </div>
    );
  }

  const fullName =
    instructor
      ? [instructor.firstName, instructor.lastName].filter(Boolean).join(" ").trim() ||
        instructor.email
      : `ID #${userId}`;
  const initials = instructor?.firstName?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
        {initials}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium leading-tight">{fullName}</p>
        {instructor?.email && (
          <p className="truncate text-xs text-muted-foreground">{instructor.email}</p>
        )}
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

interface Props {
  course: Course | null;
  open: boolean;
  onClose: () => void;
  onReviewed?: () => void;
}

export function AdminCourseReviewModal({ course, open, onClose, onReviewed }: Props) {
  const approve = useApproveCourse();
  const reject = useRejectCourse();

  const isPending = course?.status === "pending";
  const isBusy = approve.isPending || reject.isPending;

  const handleApprove = async () => {
    if (!course) return;
    try {
      await approve.mutateAsync(course.id);
      toast.success(`Đã duyệt: "${course.name}"`);
      onReviewed?.();
      onClose();
    } catch {
      toast.error("Duyệt thất bại. Vui lòng thử lại.");
    }
  };

  const handleReject = async () => {
    if (!course) return;
    try {
      await reject.mutateAsync(course.id);
      toast.success(`Đã từ chối: "${course.name}"`);
      onReviewed?.();
      onClose();
    } catch {
      toast.error("Từ chối thất bại. Vui lòng thử lại.");
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-lg"
      >
        {/* Top stripe */}
        <div className="h-1 shrink-0 bg-linear-to-r from-primary/80 via-amber-400/80 to-primary/20" />

        {/* Scrollable content */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="p-6">
            {course && (
              <>
                {/* Header */}
                <SheetHeader className="mb-5 space-y-0 text-left">
                  <div className="flex items-start justify-between gap-3">
                    <SheetTitle className="line-clamp-2 text-base leading-snug">
                      {course.name}
                    </SheetTitle>
                    <CourseStatusBadge status={course.status} />
                  </div>
                  <SheetDescription className="mt-1.5 text-xs text-muted-foreground">
                    Gửi lúc {formatDate(course.created_at)} · ID #{course.id}
                  </SheetDescription>
                </SheetHeader>

                {/* Giảng viên */}
                <div className="mb-4 rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
                  <p className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <User className="h-3 w-3" />
                    Giảng viên
                  </p>
                  <InstructorInfo userId={course.userId} />
                </div>

                {/* Mô tả */}
                {course.description && (
                  <p className="mb-4 rounded-xl bg-muted/30 px-4 py-3 text-sm leading-relaxed text-foreground/80">
                    {course.description}
                  </p>
                )}

                {/* Meta pills */}
                <div className="mb-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background px-3 py-1 text-xs font-semibold">
                    <DollarSign className="h-3 w-3 text-primary" />
                    {formatPrice(course.price)}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background px-3 py-1 text-xs text-muted-foreground">
                    <BarChart2 className="h-3 w-3" />
                    {LEVEL_LABELS[course.level.toLowerCase()] ?? course.level}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background px-3 py-1 text-xs text-muted-foreground">
                    <Globe className="h-3 w-3" />
                    {LANGUAGE_LABELS[course.language] ?? course.language}
                  </span>
                  {course.duration && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background px-3 py-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {course.duration}
                    </span>
                  )}
                </div>

                {/* Danh mục */}
                {course.categories.length > 0 && (
                  <div className="mb-5 flex flex-wrap items-center gap-1.5">
                    <Tag className="h-3 w-3 shrink-0 text-muted-foreground" />
                    {course.categories.map((cat) => (
                      <Badge key={cat} variant="secondary" className="text-xs">
                        {cat}
                      </Badge>
                    ))}
                  </div>
                )}

                <Separator className="mb-5" />

                {/* Nội dung khóa học */}
                <div>
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Nội dung khóa học
                  </p>
                  <LessonList courseId={course.id} />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Action footer — always visible */}
        {course && (
          <div className="shrink-0 border-t border-border/60 bg-background p-4">
            {isPending ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2 border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive"
                  onClick={handleReject}
                  disabled={isBusy}
                >
                  {reject.isPending
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <X className="h-3.5 w-3.5" />}
                  Từ chối
                </Button>
                <Button
                  className="flex-1 gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={handleApprove}
                  disabled={isBusy}
                >
                  {approve.isPending
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Check className="h-3.5 w-3.5" />}
                  Chấp nhận
                </Button>
              </div>
            ) : (
              <Button variant="outline" className="w-full" onClick={onClose}>
                Đóng
              </Button>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
