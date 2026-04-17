import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronUp, GripVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export function RoadmapCourseDragOverlay({
  courseItem,
}: RoadmapCourseDragOverlayProps) {
  return (
    <div className="relative flex w-[min(840px,calc(100vw-2rem))] items-start gap-4 rounded-xl">
      <div className="flex shrink-0 flex-col items-center">
        <div className="grid h-11 w-11 place-items-center rounded-full border-2 border-primary/70 bg-background text-sm font-bold text-primary shadow-sm">
          {courseItem.orderIndex ?? 1}
        </div>
      </div>

      <div className="flex-1 rounded-xl border border-primary/50 bg-primary/5 p-3 shadow-lg">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex min-w-0 gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border/40 bg-muted/30 text-muted-foreground/70">
              <GripVertical className="h-4 w-4" />
            </div>

            <div className="grid h-20 w-32 shrink-0 place-items-center overflow-hidden rounded-md border border-border/40 bg-linear-to-br from-primary/15 via-primary/5 to-transparent text-xs font-semibold text-primary/80">
              {(courseItem.course?.name ?? "Khóa học")
                .slice(0, 2)
                .toUpperCase()}
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <p className="line-clamp-2 text-sm font-semibold leading-snug">
                {courseItem.course?.name ?? "Khóa học chưa liên kết"}
              </p>
              <p className="line-clamp-2 text-xs text-muted-foreground">
                {courseItem.course?.description || "Chưa có mô tả"}
              </p>
            </div>
          </div>
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
    opacity: isDragging ? 0.45 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group relative flex items-start gap-4 rounded-xl ${
        isDragging
          ? "ring-2 ring-primary/35 cursor-grabbing"
          : "cursor-grab active:cursor-grabbing"
      }`}
    >
      <div className="flex shrink-0 flex-col items-center">
        <div className="grid h-11 w-11 place-items-center rounded-full border-2 border-primary/70 bg-background text-sm font-bold text-primary shadow-sm transition group-hover:scale-105">
          {courseItem.orderIndex ?? index + 1}
        </div>
        {index < total - 1 ? (
          <div className="my-1 h-20 w-px bg-border/70 transition group-hover:bg-primary/40" />
        ) : null}
      </div>

      <div
        className={`flex-1 rounded-xl border bg-card p-3 shadow-sm transition ${
          isDragging
            ? "border-primary/50 bg-primary/5 shadow-md"
            : "border-border/40 group-hover:shadow-md"
        }`}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex min-w-0 gap-3">
            <div
              className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border/40 bg-muted/30 text-muted-foreground/70 hover:text-foreground"
              title="Giữ và kéo để sắp xếp"
            >
              <GripVertical className="h-4 w-4" />
            </div>

            <div className="grid h-20 w-32 shrink-0 place-items-center overflow-hidden rounded-md border border-border/40 bg-linear-to-br from-primary/15 via-primary/5 to-transparent text-xs font-semibold text-primary/80">
              {(courseItem.course?.name ?? "Khóa học")
                .slice(0, 2)
                .toUpperCase()}
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <p className="line-clamp-2 text-sm font-semibold leading-snug">
                {courseItem.course?.name ?? "Khóa học chưa liên kết"}
              </p>
              <p className="line-clamp-2 text-xs text-muted-foreground">
                {courseItem.course?.description || "Chưa có mô tả"}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              disabled={index === 0}
              onClick={() => onMoveCourse(index, -1)}
              title="Di chuyển lên"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              disabled={index === total - 1}
              onClick={() => onMoveCourse(index, 1)}
              title="Di chuyển xuống"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-destructive"
              onClick={() =>
                courseItem.courseId
                  ? onRemoveCourse(courseItem.courseId)
                  : undefined
              }
              title="Xóa khóa học"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
