"use client";

import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useInstructorCourses } from "@/features/instructor/course-management/api/course-management.hooks";
import { ManagementPageShell } from "@/features/instructor/course-management/components/ManagementPageShell";
import { cn } from "@/lib/utils";
import {
  useAddRoadmapCourse,
  useCreateRoadmap,
} from "./api/roadmap-management.hooks";
import { AddRoadmapCourseDialog } from "./components/roadmap-detail/RoadmapDialogs";
import { RoadmapCourseSection } from "./components/roadmap-detail/RoadmapCourseSection";
import type { InstructorRoadmapCourse } from "./types";

const roadmapFormSchema = z.object({
  name: z.string().trim().min(1, "Tên lộ trình không được để trống"),
  description: z.string().trim().optional(),
});

type RoadmapFormValues = z.infer<typeof roadmapFormSchema>;

export default function RoadmapCreate() {
  const router = useRouter();
  const { user } = useAuth();
  const createRoadmapMutation = useCreateRoadmap();
  const addRoadmapCourseMutation = useAddRoadmapCourse();
  const { data: courses = [], isLoading: coursesLoading } =
    useInstructorCourses({ page: 1, limit: 100 });
  const [courseSearch, setCourseSearch] = useState("");
  const [addCourseOpen, setAddCourseOpen] = useState(false);
  const [roadmapCourses, setRoadmapCourses] = useState<
    InstructorRoadmapCourse[]
  >([]);
  const [activeDragCourseId, setActiveDragCourseId] = useState<string | null>(
    null,
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RoadmapFormValues>({
    resolver: zodResolver(roadmapFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const normalizeOrder = (items: InstructorRoadmapCourse[]) =>
    items.map((item, index) => ({
      ...item,
      orderIndex: index + 1,
    }));

  const availableCourses = useMemo(() => {
    const selectedCourseIds = new Set(
      roadmapCourses.map((item) => item.courseId).filter(Boolean),
    );
    const normalizedSearch = courseSearch.trim().toLowerCase();

    return courses.filter((course) => {
      if (selectedCourseIds.has(course.id)) return false;
      if (!normalizedSearch) return true;

      const haystack = [
        course.name,
        course.description,
        ...(course.categories ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [courseSearch, courses, roadmapCourses]);

  const activeDragCourseItem = roadmapCourses.find(
    (item) => item.id.toString() === activeDragCourseId,
  );

  const handleAddCourse = (courseId: number) => {
    const course = courses.find((item) => item.id === courseId);

    setRoadmapCourses((current) =>
      normalizeOrder([
        ...current,
        {
          id: -(Date.now() + current.length),
          roadmapId: null,
          courseId,
          orderIndex: current.length + 1,
          status: "null",
          course,
        },
      ]),
    );
    setCourseSearch("");
    setAddCourseOpen(false);
  };

  const handleRemoveCourse = (courseId: number) => {
    setRoadmapCourses((current) =>
      normalizeOrder(current.filter((item) => item.courseId !== courseId)),
    );
  };

  const handleMoveCourse = (index: number, direction: -1 | 1) => {
    setRoadmapCourses((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) return current;

      return normalizeOrder(arrayMove(current, index, nextIndex));
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragCourseId(event.active.id.toString());
  };

  const handleDragCancel = () => {
    setActiveDragCourseId(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragCourseId(null);

    if (!over || active.id === over.id) return;

    setRoadmapCourses((current) => {
      const oldIndex = current.findIndex(
        (item) => item.id.toString() === active.id.toString(),
      );
      const newIndex = current.findIndex(
        (item) => item.id.toString() === over.id.toString(),
      );

      if (oldIndex === -1 || newIndex === -1) return current;
      return normalizeOrder(arrayMove(current, oldIndex, newIndex));
    });
  };

  const onSubmit = async (values: RoadmapFormValues) => {
    const created = await createRoadmapMutation.mutateAsync({
      userId: user?.id,
      name: values.name.trim(),
      description: values.description?.trim() || undefined,
    });

    for (const [index, item] of roadmapCourses.entries()) {
      if (!item.courseId) continue;

      await addRoadmapCourseMutation.mutateAsync({
        roadmapId: created.id,
        data: {
          courseId: item.courseId,
          orderIndex: index + 1,
          status: "null",
        },
      });
    }

    toast.success("Đã tạo lộ trình");
    router.push("/instructor/roadmaps");
    router.refresh();
  };

  const isSubmitting =
    createRoadmapMutation.isPending || addRoadmapCourseMutation.isPending;

  return (
    <ManagementPageShell
      noCard
      title="Tạo lộ trình mới"
      description="Đặt thông tin và chọn khóa học theo đúng thứ tự học."
      breadcrumbs={[
        { label: "Lộ trình", href: "/instructor/roadmaps" },
        { label: "Tạo mới" },
      ]}
      action={
        <Button
          type="submit"
          form="create-roadmap-form"
          disabled={isSubmitting}
          className="h-11 rounded-xl px-5"
        >
          {isSubmitting ? "Đang tạo..." : "Tạo lộ trình"}
        </Button>
      }
    >
      <div className="space-y-5">
        <form
          id="create-roadmap-form"
          className="space-y-5"
          onSubmit={(event) => void handleSubmit(onSubmit)(event)}
        >
          <Card className="rounded-2xl border-border/60 shadow-sm">
            <CardContent className="space-y-5 p-5 sm:p-6">
              <div className="grid gap-2">
                <Label className="text-sm font-medium">
                  Tên lộ trình <span className="text-destructive">*</span>
                </Label>
                <Input
                  {...register("name")}
                  placeholder="VD: Backend JavaScript cho người mới"
                  className={cn(
                    errors.name &&
                      "border-destructive focus-visible:ring-destructive",
                  )}
                />
                {errors.name && (
                  <p className="mt-0.5 text-xs text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label className="text-sm font-medium">Mô tả</Label>
                <Textarea
                  {...register("description")}
                  placeholder="Mục tiêu học, trình độ phù hợp, kết quả sau khi hoàn thành..."
                  className="min-h-28"
                />
              </div>
            </CardContent>
          </Card>

          <RoadmapCourseSection
            roadmapCourses={roadmapCourses}
            activeDragCourseItem={activeDragCourseItem}
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragCancel={handleDragCancel}
            onDragEnd={handleDragEnd}
            onMoveCourse={handleMoveCourse}
            onRemoveCourse={handleRemoveCourse}
            onOpenAddCourse={() => setAddCourseOpen(true)}
          />
        </form>
      </div>

      <AddRoadmapCourseDialog
        open={addCourseOpen}
        search={courseSearch}
        coursesLoading={coursesLoading}
        availableCourses={availableCourses}
        onOpenChange={setAddCourseOpen}
        onSearchChange={setCourseSearch}
        onAddCourse={handleAddCourse}
      />
    </ManagementPageShell>
  );
}
