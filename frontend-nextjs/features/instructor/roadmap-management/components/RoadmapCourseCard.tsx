import Image from "next/image";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  ImageIcon,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { InstructorRoadmapCourse } from "../types";

interface SortableRoadmapCourseCardProps {
  courseItem: InstructorRoadmapCourse;
  index: number;
  total: number;
  onMoveCourse: (index: number, direction: -1 | 1) => void;
  onRemoveCourse: (courseId: number) => void;
}

interface RoadmapCourseDragOverlayProps {
  courseItem: InstructorRoadmapCourse;
}

function stripHtml(value?: string | null) {
  if (!value) return "";
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function CourseThumbnail({
  courseItem,
}: {
  courseItem: InstructorRoadmapCourse;
}) {
  const thumbnail = courseItem.course?.thumbnailUrl;
  const title = courseItem.course?.name ?? "Khóa học";

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border/60 bg-muted sm:w-36">
      {thumbnail ? (
        <Image
          src={thumbnail}
          alt={title}
          fill
          sizes="144px"
          className="object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
          <ImageIcon className="h-5 w-5" />
        </div>
      )}
    </div>
  );
}

export function RoadmapCourseDragOverlay({
  courseItem,
}: RoadmapCourseDragOverlayProps) {
  return (
    <div className="w-[min(860px,calc(100vw-2rem))] rounded-2xl border border-primary/50 bg-card p-3 shadow-xl">
      <div className="flex gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground">
          {courseItem.orderIndex ?? 1}
        </div>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-1 font-semibold">
            {courseItem.course?.name ?? "Khóa học chưa liên kết"}
          </p>
          <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
            {stripHtml(courseItem.course?.description) || "Chưa có mô tả"}
          </p>
        </div>
      </div>
    </div>
  );
}

export function SortableRoadmapCourseCard({
  courseItem,
  index,
  total,
  onMoveCourse,
  onRemoveCourse,
}: SortableRoadmapCourseCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: courseItem.id.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.55 : 1,
  };

  const courseTitle = courseItem.course?.name ?? "Khóa học chưa liên kết";
  const courseDescription =
    stripHtml(courseItem.course?.description) || "Chưa có mô tả";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-2xl border border-border/60 bg-card p-3 shadow-sm transition",
        isDragging
          ? "border-primary/50 shadow-md"
          : "hover:border-primary/35 hover:shadow-md",
      )}
    >
      <div className="grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
        <div className="flex items-start gap-3 sm:items-center">
          <button
            type="button"
            className="mt-1 grid h-10 w-10 shrink-0 cursor-grab place-items-center rounded-xl border border-border/60 bg-background text-muted-foreground transition hover:text-foreground active:cursor-grabbing sm:mt-0"
            title="Giữ và kéo để sắp xếp"
            aria-label="Giữ và kéo để sắp xếp"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">
            {courseItem.orderIndex ?? index + 1}
          </div>
        </div>

        <div className="grid min-w-0 gap-3 sm:grid-cols-[9rem_minmax(0,1fr)] sm:items-center">
          <CourseThumbnail courseItem={courseItem} />
          <div className="min-w-0 space-y-1">
            <p className="line-clamp-2 font-semibold leading-snug">
              {courseTitle}
            </p>
            <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
              {courseDescription}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-1">
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-9 w-9 rounded-xl"
            disabled={index === 0}
            onClick={() => onMoveCourse(index, -1)}
            aria-label="Di chuyển lên"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-9 w-9 rounded-xl"
            disabled={index === total - 1}
            onClick={() => onMoveCourse(index, 1)}
            aria-label="Di chuyển xuống"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-9 w-9 rounded-xl border-destructive/35 text-destructive hover:bg-destructive/10"
            onClick={() =>
              courseItem.courseId
                ? onRemoveCourse(courseItem.courseId)
                : undefined
            }
            aria-label="Xóa khóa học khỏi lộ trình"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
