"use client";

import Link from "next/link";
import {
  Trash2,
  FolderKanban,
  ClipboardCheck,
  Rocket,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  InstructorCourse,
  CourseStatus,
} from "../../course-management/types";

interface Props {
  course: InstructorCourse;
  onDelete: (id: number) => void;
  onSubmitForReview?: (id: number) => void;
  onPublishCourse?: (id: number) => void;
  workflowLoading?: boolean;
}

const LANGUAGE_LABELS: Record<string, string> = {
  vi: "Tiếng Việt",
  en: "Tiếng Anh",
  vietnamese: "Tiếng Việt",
  english: "Tiếng Anh",
};

const LEVEL_LABELS: Record<string, string> = {
  beginner: "Sơ cấp",
  intermediate: "Trung cấp",
  advanced: "Cao cấp",
};

function getLanguageLabel(language: string) {
  return LANGUAGE_LABELS[language.toLowerCase()] ?? language;
}

function getLevelLabel(level: string) {
  return LEVEL_LABELS[level.toLowerCase()] ?? level;
}

function formatCourseDuration(duration: string | number | null | undefined) {
  if (duration === null || duration === undefined || duration === "") {
    return "0 phút";
  }

  let totalSeconds = 0;
  if (typeof duration === "number") {
    totalSeconds = Number.isFinite(duration) ? Math.max(0, duration) : 0;
  } else {
    const normalized = duration.trim();
    if (/^\d+(\.\d+)?$/.test(normalized)) {
      totalSeconds = Number(normalized);
    } else {
      const parts = normalized.split(":");
      if (parts.length >= 2) {
        const hours = Number(parts[0]);
        const minutes = Number(parts[1]);
        const seconds = Number(parts[2]?.split(".")[0] ?? 0);
        if ([hours, minutes, seconds].every(Number.isFinite)) {
          totalSeconds = hours * 3600 + minutes * 60 + seconds;
        }
      }
    }
  }

  const safeSeconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);

  if (hours > 0 && minutes > 0) return `${hours} giờ ${minutes} phút`;
  if (hours > 0) return `${hours} giờ`;
  if (minutes > 0) return `${minutes} phút`;
  return "0 phút";
}

function StatusBadge({ status }: { status: CourseStatus }) {
  const config: Record<CourseStatus, { label: string; className: string }> = {
    publish: {
      label: "Đã xuất bản",
      className:
        "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-500/20",
    },
    draft: { 
      label: "Bản nháp", 
      className: "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800" 
    },
    pending: {
      label: "Chờ duyệt",
      className:
        "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-500/20",
    },
    approved: {
      label: "Đã duyệt",
      className:
        "bg-sky-500/10 text-sky-600 border-sky-500/20 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-500/20",
    },
    rejected: {
      label: "Từ chối",
      className: "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-500/20",
    },
    banned: {
      label: "Bị cấm",
      className: "bg-red-600 text-white border-red-700"
    },
  };
  const { label, className } =
    config[status] ??
    {
      label: status ?? "Unknown",
      className: "bg-muted text-muted-foreground",
    };
  return (
    <Badge variant="outline" className={cn("text-[10px] font-bold rounded-full px-2.5 py-0.5", className)}>
      {label}
    </Badge>
  );
}

export function CourseManageCard({
  course,
  onDelete,
  onSubmitForReview,
  onPublishCourse,
  workflowLoading = false,
}: Props) {
  const canSubmitForReview =
    course.status === "draft" && Boolean(onSubmitForReview);
  const canPublishCourse =
    course.status === "approved" && Boolean(onPublishCourse);

  return (
    <div className="group flex flex-col overflow-hidden rounded-3xl border border-border/50 bg-card shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_16px_36px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_16px_36px_rgba(0,0,0,0.25)]">
      {/* Aspect ratio cover image container */}
      <div className="relative aspect-video w-full overflow-hidden border-b border-border/40 bg-muted/40 flex items-center justify-center">
        {course.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.thumbnailUrl}
            alt={course.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
              const fallback = (e.target as HTMLElement).nextElementSibling;
              if (fallback) fallback.classList.remove("hidden");
            }}
          />
        ) : null}
        
        {/* Fallback layout */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-amber-500/5 flex flex-col items-center justify-center text-muted-foreground transition-transform duration-500 group-hover:scale-105",
          course.thumbnailUrl ? "hidden" : ""
        )}>
          <GraduationCap className="h-10 w-10 text-primary/40 stroke-[1.5] mb-2" />
          <span className="text-[10px] font-semibold tracking-wider uppercase opacity-60">StudyLoop Course</span>
        </div>

        {/* Absolute status badge at top-right */}
        <div className="absolute right-3 top-3 z-10 backdrop-blur-md rounded-full shadow-sm">
          <StatusBadge status={course.status} />
        </div>

        {/* Absolute action buttons at top-left */}
        <div className="absolute left-3 top-3 z-10 flex gap-1.5">
          {canSubmitForReview && (
            <Button
              size="sm"
              className="h-8 rounded-full border border-primary/20 px-3 gap-1 text-[11px] font-bold shadow-md transition-all duration-200 cursor-pointer hover:bg-primary/90"
              onClick={() => onSubmitForReview?.(course.id)}
              disabled={workflowLoading}
            >
              <ClipboardCheck className="h-3.5 w-3.5" />
              Gửi xét duyệt
            </Button>
          )}
          {canPublishCourse && (
            <Button
              size="sm"
              className="h-8 rounded-full px-3 gap-1 text-[11px] font-bold shadow-md transition-all duration-200 cursor-pointer"
              onClick={() => onPublishCourse?.(course.id)}
              disabled={workflowLoading}
            >
              <Rocket className="h-3.5 w-3.5" />
              Xuất bản
            </Button>
          )}
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Course metadata card content */}
      <div className="flex flex-1 flex-col p-3.5">
        {/* Category badges */}
        <div className="mb-2.5 flex flex-wrap gap-1 min-h-[18px]">
          {course.categories.length > 0 ? (
            course.categories.slice(0, 2).map((category) => (
              <Badge key={category} variant="secondary" className="text-[9px] font-medium px-1.5 py-0.1 border border-border/20 rounded-md">
                {category}
              </Badge>
            ))
          ) : (
            <Badge variant="outline" className="text-[9px] font-medium px-1.5 py-0.1 opacity-50 rounded-md border-dashed">
              Chưa phân loại
            </Badge>
          )}
        </div>

        {/* Title area (Locked to exactly 2 lines height) */}
        <div className="mb-1 min-h-[32px]">
          <h3 className="line-clamp-2 text-xs font-bold text-foreground leading-snug group-hover:text-primary transition-colors" title={course.name}>
            {course.name}
          </h3>
        </div>

        {/* Inline metadata details (Udemy style) */}
        <div className="text-[11px] text-muted-foreground flex flex-wrap items-center gap-1.5 mb-2 font-medium">
          <span>{formatCourseDuration(course.duration)}</span>
          <span className="text-muted-foreground/40">•</span>
          <span>{getLevelLabel(course.level)}</span>
          <span className="text-muted-foreground/40">•</span>
          <span>{getLanguageLabel(course.language)}</span>
        </div>

        {/* Prominent Price Display */}
        <div className="mb-3 font-bold text-sm text-primary">
          {course.price > 0 ? `${course.price.toLocaleString("vi-VN")}đ` : "Miễn phí"}
        </div>

        {/* Action Button Row */}
        <div className="mt-auto flex items-center gap-1.5">
          <Button size="sm" className="flex-1 h-8 rounded-lg gap-1 text-xs font-bold shadow-xs transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] cursor-pointer" asChild>
            <Link href={`/instructor/courses/${course.id}`}>
              <FolderKanban className="h-3.5 w-3.5" />
              Quản lý
            </Link>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 w-8 rounded-lg border-destructive/20 hover:border-destructive/40 p-0 text-destructive hover:bg-destructive/5 hover:text-destructive active:scale-[0.96] transition-all cursor-pointer"
            onClick={() => onDelete(course.id)}
            disabled={workflowLoading}
            aria-label="Xóa khóa học"
            title="Xóa khóa học"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
