import {
  DndContext,
  DragOverlay,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { BookOpenCheck, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  RoadmapCourseDragOverlay,
  SortableRoadmapCourseCard,
} from "../RoadmapCourseCard";
import type { InstructorRoadmapCourse } from "../../types";

interface RoadmapCourseSectionProps {
  roadmapCourses: InstructorRoadmapCourse[];
  activeDragCourseItem?: InstructorRoadmapCourse;
  sensors: ReturnType<typeof import("@dnd-kit/core").useSensors>;
  onDragStart: (event: DragStartEvent) => void;
  onDragCancel: () => void;
  onDragEnd: (event: DragEndEvent) => void;
  onMoveCourse: (index: number, direction: -1 | 1) => void;
  onRemoveCourse: (courseId: number) => void;
  onOpenAddCourse: () => void;
}

export function RoadmapCourseSection({
  roadmapCourses,
  activeDragCourseItem,
  sensors,
  onDragStart,
  onDragCancel,
  onDragEnd,
  onMoveCourse,
  onRemoveCourse,
  onOpenAddCourse,
}: RoadmapCourseSectionProps) {
  return (
    <Card className="rounded-2xl border-border/60 shadow-sm">
      <CardContent className="space-y-5 p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <BookOpenCheck className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold">
                Khóa học trong lộ trình
              </h2>
              <p className="text-sm text-muted-foreground">
                Sắp xếp bằng kéo thả hoặc nút lên xuống.
              </p>
            </div>
          </div>
          <Button
            type="button"
            onClick={onOpenAddCourse}
            className="h-11 w-full rounded-xl px-4 sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Thêm khóa học
          </Button>
        </div>

        {roadmapCourses.length ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={onDragStart}
            onDragCancel={onDragCancel}
            onDragEnd={onDragEnd}
          >
            <SortableContext
              items={roadmapCourses.map(
                (item) => item.id.toString() as UniqueIdentifier,
              )}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {roadmapCourses.map((item, index) => (
                  <SortableRoadmapCourseCard
                    key={item.id}
                    courseItem={item}
                    index={index}
                    total={roadmapCourses.length}
                    onMoveCourse={onMoveCourse}
                    onRemoveCourse={onRemoveCourse}
                  />
                ))}
              </div>
            </SortableContext>
            <DragOverlay>
              {activeDragCourseItem ? (
                <RoadmapCourseDragOverlay courseItem={activeDragCourseItem} />
              ) : null}
            </DragOverlay>
          </DndContext>
        ) : (
          <div className="grid min-h-48 place-items-center rounded-2xl border border-dashed border-border/70 bg-muted/20 p-8 text-center">
            <div>
            <p className="text-base font-semibold">Chưa có khóa học</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Thêm khóa học đầu tiên để bắt đầu xây dựng lộ trình.
            </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
