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
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  HelpCircle,
  ExternalLink,
  Play,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { CourseStatusBadge } from "../CourseStatusBadge";
import {
  useApproveCourse,
  useRejectCourse,
  useCourseLessons,
  useInstructorUser,
} from "../../api/admin-courses.hooks";
import type { Course } from "@/features/courses/types";
import type { Lesson } from "@/features/lessons/types";
import { useState } from "react";

const LEVEL_LABELS: Record<string, string> = {
  beginner: "Sơ cấp",
  intermediate: "Trung cấp",
  advanced: "Cao cấp",
};

const LANGUAGE_LABELS: Record<string, string> = {
  vi: "Tiếng Việt",
  en: "English",
};

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatPrice(price: unknown): string {
  const n = Number(price);
  if (!isFinite(n) || isNaN(n)) return "—";
  if (n <= 0) return "Miễn phí";
  return `${n.toLocaleString("vi-VN")}đ`;
}

function formatDuration(raw?: number | string | null): string | null {
  if (raw == null) return null;
  if (typeof raw === "number") {
    if (raw <= 0) return null;
    const h = Math.floor(raw / 3600);
    const m = Math.floor((raw % 3600) / 60);
    const s = Math.round(raw % 60);
    if (h > 0) return `${h}g${m > 0 ? ` ${m}p` : ""}`;
    if (m > 0) return `${m}p${s > 0 ? ` ${s}s` : ""}`;
    return `${s}s`;
  }
  const match = String(raw).match(/^(\d+):(\d{2}):(\d{2})/);
  if (!match) return null;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const s = parseInt(match[3], 10);
  if (h === 0 && m === 0 && s === 0) return null;
  if (h > 0) return `${h}g${m > 0 ? ` ${m}p` : ""}`;
  if (m > 0) return `${m}p${s > 0 ? ` ${s}s` : ""}`;
  return `${s}s`;
}

// ── Lesson helpers ────────────────────────────────────────────────────────────

function hasVideo(lesson: Lesson): boolean {
  return lesson.contentType === "video" && lesson.videoId != null;
}

// Trả về URL hợp lệ từ lesson.video.url (được join từ bảng videos).
// null nếu video chưa có hoặc URL chưa sẵn sàng (đang processing).
function getVideoUrl(lesson: Lesson): string | null {
  const url = lesson.video?.url;
  if (typeof url !== "string" || !url.trim()) return null;
  return url.trim();
}

function getVideoThumbnail(lesson: Lesson): string | null {
  const thumb = lesson.video?.thumbnail;
  if (typeof thumb !== "string" || !thumb.trim()) return null;
  return thumb.trim();
}

function VideoPreviewInline({
  videoUrl,
  thumbnailUrl,
  title,
}: {
  videoUrl: string;
  thumbnailUrl: string | null;
  title: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Thumbnail nhỏ inline — click để mở Dialog */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative h-[27px] w-12 shrink-0 overflow-hidden rounded border border-border/60 bg-muted transition-opacity hover:opacity-90"
        aria-label={`Xem video: ${title}`}
      >
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={title}
            fill
            className="object-cover"
            sizes="48px"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Video className="h-3.5 w-3.5 text-muted-foreground/50" />
          </div>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 transition-opacity group-hover:opacity-100">
          <Play className="h-3 w-3 translate-x-px text-white drop-shadow" />
        </span>
      </button>

      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
        <Check className="h-3 w-3" />
        Có video
      </span>

      {/* Dialog player — chỉ mount khi mở */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-2xl">
          <DialogHeader className="border-b border-border/60 px-4 py-3 pr-12">
            <DialogTitle className="flex items-center gap-2 text-sm font-medium">
              <span className="line-clamp-1 flex-1">{title}</span>
              <a
                href={videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Mở video gốc"
                onClick={(e) => e.stopPropagation()}
                className="shrink-0 text-muted-foreground/60 hover:text-primary transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </DialogTitle>
          </DialogHeader>
          <div className="aspect-video w-full bg-black">
            {open && (
              <video
                src={videoUrl}
                controls
                autoPlay
                className="h-full w-full object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function LessonTypeIcon({
  type,
  missingVideo,
}: {
  type: string;
  missingVideo?: boolean;
}) {
  if (type === "video") {
    return missingVideo ? (
      <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
    ) : (
      <Video className="h-3.5 w-3.5 shrink-0 text-primary/70" />
    );
  }
  if (type === "text") {
    return <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />;
  }
  // Unknown content type from backend
  return <HelpCircle className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />;
}

// ── Lesson list ───────────────────────────────────────────────────────────────

const LESSON_PAGE_SIZE = 10;

function LessonList({ courseId }: { courseId: number }) {
  const { data: lessons, isLoading, isError, refetch } = useCourseLessons(courseId);
  const [page, setPage] = useState(1);

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
      <div className="flex flex-col items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-3">
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Không thể tải danh sách bài học
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-xs text-destructive hover:bg-destructive/10"
          onClick={() => refetch()}
        >
          <RefreshCw className="h-3 w-3" />
          Thử lại
        </Button>
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

  const videoLessons = lessons.filter((l) => l.contentType === "video");
  const missingVideoCount = videoLessons.filter((l) => !hasVideo(l)).length;
  const totalPages = Math.ceil(lessons.length / LESSON_PAGE_SIZE);
  const paged = lessons.slice((page - 1) * LESSON_PAGE_SIZE, page * LESSON_PAGE_SIZE);

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
          <BookOpen className="h-3 w-3" />
          {lessons.length} bài học
        </span>
        {videoLessons.length > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
            <Video className="h-3 w-3" />
            {videoLessons.length} video
          </span>
        )}
        {missingVideoCount > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-600 dark:bg-amber-950/30 dark:text-amber-400">
            <AlertCircle className="h-3 w-3" />
            {missingVideoCount} chưa có video
          </span>
        )}
      </div>

      {/* List */}
      <div className="divide-y divide-border/50 rounded-xl border border-border/60 bg-muted/10">
        {paged.map((lesson, index) => {
          const globalIndex = (page - 1) * LESSON_PAGE_SIZE + index;
          const dur = formatDuration(lesson.duration);
          const videoLinked = hasVideo(lesson);
          const videoUrl = getVideoUrl(lesson);
          const videoThumbnail = getVideoThumbnail(lesson);
          const isMissingVideo = lesson.contentType === "video" && !videoLinked;

          return (
            <div
              key={lesson.id}
              className={cn(
                "flex flex-col gap-1 px-3 py-2.5",
                isMissingVideo && "bg-amber-50/40 dark:bg-amber-950/10",
              )}
            >
              <div className="flex items-center gap-3">
                <span className="w-5 shrink-0 text-center text-xs text-muted-foreground/50">
                  {globalIndex + 1}
                </span>
                <LessonTypeIcon type={lesson.contentType} missingVideo={isMissingVideo} />
                <span className="min-w-0 flex-1 truncate text-sm">
                  {lesson.title || (
                    <span className="italic text-muted-foreground/50">(Không có tiêu đề)</span>
                  )}
                </span>
                {dur && (
                  <span className="shrink-0 text-xs text-muted-foreground">{dur}</span>
                )}
              </div>

              {/* Video status row */}
              {lesson.contentType === "video" && (
                <div className="ml-8 flex items-center gap-1.5">
                  {videoUrl ? (
                    <VideoPreviewInline
                      videoUrl={videoUrl}
                      thumbnailUrl={videoThumbnail}
                      title={lesson.title}
                    />
                  ) : videoLinked ? (
                    // videoId có nhưng video.url chưa sẵn sàng (đang processing)
                    <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Đang xử lý video...
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                      Chưa có video
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Lesson pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-muted-foreground">
            {(page - 1) * LESSON_PAGE_SIZE + 1}–
            {Math.min(page * LESSON_PAGE_SIZE, lessons.length)} / {lessons.length}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="min-w-[3rem] text-center text-xs text-muted-foreground">
              {page}/{totalPages}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Instructor info ───────────────────────────────────────────────────────────

function InstructorInfo({ userId }: { userId: number }) {
  const isValidUserId = Number.isInteger(userId) && userId > 0;
  const { data: instructor, isLoading, isError } = useInstructorUser(
    isValidUserId ? userId : null,
  );

  if (!isValidUserId) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
        Không xác định được giảng viên (ID không hợp lệ)
      </div>
    );
  }

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

  if (isError) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <AlertCircle className="h-4 w-4 shrink-0 text-destructive/70" />
        Không thể tải thông tin giảng viên
        <span className="text-xs opacity-60">(ID #{userId})</span>
      </div>
    );
  }

  const fullName =
    instructor
      ? [instructor.firstName, instructor.lastName].filter(Boolean).join(" ").trim() ||
        instructor.email ||
        `ID #${userId}`
      : `ID #${userId}`;
  const initials = instructor?.firstName?.[0]?.toUpperCase() ?? "?";
  const avatar = instructor?.avatarUrl;

  return (
    <div className="flex items-center gap-2.5">
      <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-primary/15">
        {avatar ? (
          <Image src={avatar} alt={fullName} fill className="object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-xs font-bold text-primary">
            {initials}
          </span>
        )}
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

// ── Main ──────────────────────────────────────────────────────────────────────

interface Props {
  course: Course | null;
  open: boolean;
  onClose: () => void;
  onReviewed?: () => void;
}

export function AdminCourseReviewModal({ course, open, onClose, onReviewed }: Props) {
  const approve = useApproveCourse();
  const reject = useRejectCourse();

  // Fetch lessons here too (React Query deduplicates — no extra API call)
  // to show a warning in the footer when there are missing video URLs.
  const { data: lessons } = useCourseLessons(course?.id ?? null);
  const missingVideoCount = (lessons ?? []).filter(
    (l) => l.contentType === "video" && !hasVideo(l),
  ).length;

  const isPending = course?.status === "pending";
  const isBusy = approve.isPending || reject.isPending;

  const handleApprove = async () => {
    if (!course) return;
    try {
      await approve.mutateAsync(course.id);
      toast.success(`Đã duyệt: "${course.name || `ID #${course.id}`}"`);
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
      toast.success(`Đã từ chối: "${course.name || `ID #${course.id}`}"`);
      onReviewed?.();
      onClose();
    } catch {
      toast.error("Từ chối thất bại. Vui lòng thử lại.");
    }
  };

  const level = course?.level;
  const levelLabel =
    level ? (LEVEL_LABELS[level.toLowerCase()] ?? level) : null;

  const language = course?.language;
  const languageLabel =
    language ? (LANGUAGE_LABELS[language] ?? language) : null;

  const categories = course?.categories ?? [];
  const duration = formatDuration(course?.duration);

  return (
    <Sheet
      open={open}
      // Prevent accidental close while a mutation is in flight
      onOpenChange={(v) => !v && !isBusy && onClose()}
    >
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-lg"
      >
        {/* Top stripe */}
        <div className="h-1 shrink-0 bg-linear-to-r from-primary/80 via-amber-400/80 to-primary/20" />

        {/* Scrollable content */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="p-6">
            {course ? (
              <>
                {/* Header */}
                <SheetHeader className="mb-5 space-y-0 text-left">
                  <div className="flex items-start justify-between gap-3">
                    <SheetTitle className="line-clamp-2 text-base leading-snug">
                      {course.name || (
                        <span className="italic text-muted-foreground/60">
                          (Không có tiêu đề)
                        </span>
                      )}
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
                  {levelLabel && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background px-3 py-1 text-xs text-muted-foreground">
                      <BarChart2 className="h-3 w-3" />
                      {levelLabel}
                    </span>
                  )}
                  {languageLabel && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background px-3 py-1 text-xs text-muted-foreground">
                      <Globe className="h-3 w-3" />
                      {languageLabel}
                    </span>
                  )}
                  {duration && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background px-3 py-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {duration}
                    </span>
                  )}
                </div>

                {/* Danh mục */}
                {categories.length > 0 && (
                  <div className="mb-5 flex flex-wrap items-center gap-1.5">
                    <Tag className="h-3 w-3 shrink-0 text-muted-foreground" />
                    {categories.map((cat) => (
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
            ) : (
              // Sheet opened but no course passed — show neutral state
              <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                Không có dữ liệu khóa học
              </div>
            )}
          </div>
        </div>

        {/* Action footer — always visible */}
        <div className="shrink-0 border-t border-border/60 bg-background p-4">
          {course && isPending ? (
            <div className="space-y-2">
              {/* Warning when approving a course with missing video URLs */}
              {missingVideoCount > 0 && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-700 dark:border-amber-700/40 dark:bg-amber-950/30 dark:text-amber-400">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>
                    <strong>{missingVideoCount} bài học video</strong> chưa có URL.
                    Bạn vẫn có thể duyệt, nhưng học viên sẽ không xem được nội dung này.
                  </span>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2 border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive"
                  onClick={handleReject}
                  disabled={isBusy}
                >
                  {reject.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <X className="h-3.5 w-3.5" />
                  )}
                  Từ chối
                </Button>
                <Button
                  className="flex-1 gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={handleApprove}
                  disabled={isBusy}
                >
                  {approve.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  Chấp nhận
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" className="w-full" onClick={onClose} disabled={isBusy}>
              Đóng
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
