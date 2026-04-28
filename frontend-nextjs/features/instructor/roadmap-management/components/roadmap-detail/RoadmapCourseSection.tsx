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
import { Plus } from "lucide-react";
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
    <Card className="border-border/40 shadow-sm">
      <CardContent className="space-y-6 p-4 sm:p-5">
        <div>
          <h3 className="text-base font-semibold">
            Khóa học ({roadmapCourses.length})
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Kéo thả bằng icon chấm để sắp xếp thứ tự mượt theo thời gian thực.
          </p>
        </div>

        <div className="space-y-6">
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
                <div className="space-y-4">
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
            <div className="rounded-lg border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
              <p className="font-medium">Chưa có khóa học nào</p>
              <p className="mt-1 text-xs">
                Thêm khóa học để bắt đầu xây dựng lộ trình
              </p>
            </div>
          )}
        </div>

        <div className="mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onOpenAddCourse}
            className="w-full border-2 border-dashed border-border/60 py-6 text-muted-foreground hover:border-primary hover:bg-primary/5 hover:text-primary"
          >
            <Plus className="mr-2 h-5 w-5" />
            Thêm khóa học vào lộ trình này
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
