import {
  PlayCircle,
  FileText,
  HelpCircle,
  PenLine,
  CheckCircle,
  Lock,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDuration, totalLessonsDuration } from "../../utils";
import type { Lesson, LessonContentType } from "../../types";

interface Props {
  courseId: number;
  lessons: Lesson[];
  /** IDs of lessons the user has completed */
  completedLessonIds?: number[];
  isEnrolled: boolean;
}

const CONTENT_ICON: Record<LessonContentType, React.ElementType> = {
  video: PlayCircle,
  text: FileText,
  quiz: HelpCircle,
  assignment: PenLine,
};

export function CourseContentAccordion({
  courseId,
  lessons,
  completedLessonIds = [],
  isEnrolled,
}: Props) {
  const router = useRouter();
  const totalDuration = totalLessonsDuration(lessons);

  const handleLessonClick = (lesson: Lesson) => {
    const isLocked = !isEnrolled && !lesson.isFree;
    if (isLocked) {
      toast.info("Bạn cần đăng ký khoá học để xem bài học này.");
      return;
    }
    router.push(`/courses/${courseId}/learn?lessonId=${lesson.id}`);
  };

  return (
    <section>
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <h2 className="text-xl font-bold">Nội dung khoá học</h2>
        <p className="text-sm text-muted-foreground">
          {lessons.length} bài học&nbsp;•&nbsp;{formatDuration(totalDuration)}
        </p>
      </div>

      {/* Flat lesson list */}
      <div className="overflow-hidden rounded-xl border border-border/60">
        {lessons.map((lesson, idx) => {
          const Icon = CONTENT_ICON[lesson.contentType];
          const isCompleted = completedLessonIds.includes(lesson.id);
          const isLocked = !isEnrolled && !lesson.isFree;

          return (
            <div
              key={lesson.id}
              onClick={() => handleLessonClick(lesson)}
              className={cn(
                "flex items-center gap-3 px-5 py-3.5 transition-colors cursor-pointer",
                idx !== 0 && "border-t border-border/40",
                isLocked ? "hover:bg-muted/10 opacity-70" : "hover:bg-muted/20",
                isCompleted && "bg-muted/10",
              )}
            >
              {/* Order number */}
              <span className="w-5 shrink-0 text-center text-xs text-muted-foreground/60">
                {lesson.order}
              </span>

              {/* Content type icon or lock */}
              {isLocked ? (
                <Lock className="h-4 w-4 shrink-0 text-muted-foreground/50" />
              ) : (
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}

              {/* Title */}
              <span
                className={cn(
                  "flex-1 text-sm",
                  isCompleted && "text-muted-foreground line-through",
                  isLocked && "text-muted-foreground",
                )}
              >
                {lesson.title}
              </span>

              {/* Free preview badge */}
              {lesson.isFree && !isEnrolled && (
                <span className="rounded-full border border-primary/40 px-2 py-0.5 text-[11px] font-medium text-primary">
                  Xem thử
                </span>
              )}

              {/* Duration */}
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatDuration(lesson.duration)}
              </span>

              {/* Status icon */}
              {isCompleted && (
                <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
