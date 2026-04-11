"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { CourseManageCard } from "./CourseManageCard";
import { MOCK_INSTRUCTOR_COURSES } from "../../mock-data";
import type { InstructorCourse } from "../../types";

// TODO: Swap sang real API hooks:
//   const { data: courses, isLoading } = useInstructorCourses();
//   const { mutate: deleteCourse } = useDeleteCourse();

export default function CoursesPage() {
  // TODO: replace useState with useInstructorCourses() query
  const [courses, setCourses] = useState<InstructorCourse[]>(
    MOCK_INSTRUCTOR_COURSES,
  );
  const [isLoading] = useState(false);

  const handleDelete = (id: number) => {
    // TODO: call deleteCourse(id) mutation instead
    setCourses((prev) => prev.filter((c) => c.id !== id));
    toast.success("Đã xóa khóa học");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Quản lý khóa học</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tạo và quản lý khóa học của bạn
          </p>
        </div>
        <Button asChild>
          <Link href="/instructor/courses/new">
            <Plus className="mr-1.5 h-4 w-4" />
            Tạo khóa học mới
          </Link>
        </Button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-xl border border-border/60">
              <Skeleton className="aspect-video w-full" />
              <div className="space-y-2 p-4">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="mt-3 h-8 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card">
          <BookOpen className="mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="font-medium text-muted-foreground">Chưa có khóa học nào</p>
          <Button className="mt-4" asChild>
            <Link href="/instructor/courses/new">
              <Plus className="mr-1.5 h-4 w-4" />
              Tạo khóa học đầu tiên
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseManageCard
              key={course.id}
              course={course}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
