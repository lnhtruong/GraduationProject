"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  BookOpen,
  Layers3,
  PencilLine,
  Clapperboard,
  Clock3,
  BadgeCheck,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ManagementPageShell } from "./components/ManagementPageShell";
import {
  useInstructorCourseById,
  useLessonsByCourseId,
} from "./api/course-management.hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Props {
  courseId: number;
}

export default function CourseOverviewPage({ courseId }: Props) {
  const LESSONS_PER_PAGE = 10;
  const { data: course, isLoading: courseLoading } =
    useInstructorCourseById(courseId);
  const { data: lessons, isLoading: lessonsLoading } =
    useLessonsByCourseId(courseId);
  const [currentPage, setCurrentPage] = useState(1);

  const lessonCount = lessons?.length ?? 0;
  const readyLessons = (lessons ?? []).filter(
    (lesson) => String(lesson.status).toLowerCase() === "active",
  ).length;
  const totalLessonMinutes = (lessons ?? []).reduce(
    (sum, lesson) => sum + Number(lesson.duration ?? 0),
    0,
  );
  const avgLessonMinutes =
    lessonCount > 0 ? Math.round(totalLessonMinutes / lessonCount) : 0;

  const totalPages = Math.max(1, Math.ceil(lessonCount / LESSONS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedLessons = useMemo(() => {
    const start = (safeCurrentPage - 1) * LESSONS_PER_PAGE;
    const end = start + LESSONS_PER_PAGE;
    return (lessons ?? []).slice(start, end);
  }, [lessons, safeCurrentPage]);

  if (courseLoading) {
    return (
      <ManagementPageShell
        title="Đang tải khóa học..."
        description="Lấy dữ liệu khóa học và danh sách bài học từ backend."
        breadcrumbs={[
          { label: "Quản lý khóa học", href: "/instructor/courses" },
          { label: "Chi tiết khóa học" },
        ]}
      >
        <div className="space-y-4 p-4 sm:p-5">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </ManagementPageShell>
    );
  }

  if (!course) {
    return (
      <ManagementPageShell
        title="Không tìm thấy khóa học"
        description="Khóa học bạn đang truy cập không tồn tại hoặc đã bị xóa."
        breadcrumbs={[
          { label: "Quản lý khóa học", href: "/instructor/courses" },
          { label: "Chi tiết khóa học" },
        ]}
      >
        <div className="p-4 text-sm text-muted-foreground sm:p-5">
          Quay lại danh sách khóa học để chọn khóa học khác.
        </div>
      </ManagementPageShell>
    );
  }

  return (
    <ManagementPageShell
      title={course.name}
      description={course.description}
      breadcrumbs={[
        { label: "Quản lý khóa học", href: "/instructor/courses" },
        { label: course.name },
      ]}
      action={
        <div className="grid w-full gap-2 sm:flex sm:w-auto sm:flex-wrap">
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href={`/instructor/courses/${course.id}/edit`}>
              <PencilLine className="mr-2 h-4 w-4" />
              Sửa khóa học
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href={`/instructor/courses/${course.id}/feed`}>
              <Clapperboard className="mr-2 h-4 w-4" />
              Quản lý feed
            </Link>
          </Button>
          <Button asChild className="w-full sm:w-auto">
            <Link href={`/instructor/courses/${course.id}/lessons`}>
              <Layers3 className="mr-2 h-4 w-4" />
              Quản lý bài học
            </Link>
          </Button>
        </div>
      }
    >
      <div className="space-y-5 p-3 sm:space-y-5 sm:p-4 lg:p-5">
        <div className="grid gap-4 lg:grid-cols-12">
          <Card className="border-border/60 bg-linear-to-br from-background via-background to-muted/20 lg:col-span-12">
            <CardContent className="space-y-5 p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Course Snapshot
                  </p>
                  <h2 className="mt-1 text-xl font-semibold">{course.name}</h2>
                </div>
                <Badge variant="outline" className="text-xs">
                  {String(course.status).toUpperCase()}
                </Badge>
              </div>

              <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
                {course.description}
              </p>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  {
                    label: "Bài học",
                    value: lessonCount,
                    icon: BookOpen,
                  },
                  {
                    label: "Đang active",
                    value: readyLessons,
                    icon: BadgeCheck,
                  },
                  {
                    label: "TB / bài",
                    value: `${avgLessonMinutes} phút`,
                    icon: Clock3,
                  },
                  {
                    label: "Giá bán",
                    value: `${course.price.toLocaleString("vi-VN")}đ`,
                    icon: ArrowUpRight,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-border/60 bg-background p-3"
                  >
                    <div className="mb-2 inline-flex rounded-lg bg-primary/10 p-1.5 text-primary">
                      <item.icon className="h-3.5 w-3.5" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="text-base font-semibold">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {course.categories.length ? (
                  course.categories.map((category) => (
                    <Badge
                      key={category}
                      variant="secondary"
                      className="text-[11px]"
                    >
                      {category}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="outline" className="text-[11px]">
                    Chưa có danh mục
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Lesson Stream</h2>
                <p className="text-sm text-muted-foreground">
                  Danh sách bài học theo luồng biên tập. Vào trang bài học để
                  tạo hoạt động.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {lessonsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-24 w-full rounded-2xl" />
                  <Skeleton className="h-24 w-full rounded-2xl" />
                </div>
              ) : lessons?.length ? (
                paginatedLessons.map((lesson, index) => (
                  <div
                    key={lesson.id}
                    className="rounded-2xl border border-border/60 bg-background p-3 transition-colors hover:border-primary/30 sm:p-4"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[11px]">
                            Bài{" "}
                            {(safeCurrentPage - 1) * LESSONS_PER_PAGE +
                              index +
                              1}
                          </Badge>
                          <Badge variant="secondary" className="text-[11px]">
                            {lesson.status}
                          </Badge>
                          <span className="text-sm font-medium">
                            {lesson.title}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {lesson.description ?? "Chưa có mô tả"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {lesson.duration ?? 0} phút • {lesson.contentType}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link
                            href={`/instructor/courses/${course.id}/lessons/${lesson.id}/edit`}
                          >
                            Sửa bài học
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
                  Chưa có bài học nào trong khóa học này.
                </div>
              )}
            </div>

            {lessonCount > LESSONS_PER_PAGE ? (
              <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-background px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
                <p className="text-sm text-muted-foreground">
                  Hiển thị {(safeCurrentPage - 1) * LESSONS_PER_PAGE + 1} -{" "}
                  {Math.min(safeCurrentPage * LESSONS_PER_PAGE, lessonCount)} /{" "}
                  {lessonCount} bài học
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={safeCurrentPage === 1}
                    onClick={() =>
                      setCurrentPage(Math.max(1, safeCurrentPage - 1))
                    }
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Trước
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Trang {safeCurrentPage}/{totalPages}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={safeCurrentPage === totalPages}
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, safeCurrentPage + 1))
                    }
                  >
                    Sau
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          <div className={cn("space-y-4")}>
            <Card className="border-border/60 bg-muted/10">
              <CardContent className="space-y-3 p-4 sm:p-5">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Thông tin khóa học
                </p>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-medium">Ngôn ngữ:</span>{" "}
                    {course.language}
                  </p>
                  <p>
                    <span className="font-medium">Cấp độ:</span> {course.level}
                  </p>
                  <p>
                    <span className="font-medium">Giá:</span>{" "}
                    {course.price.toLocaleString("vi-VN")}đ
                  </p>
                  <p>
                    <span className="font-medium">Mô tả:</span>{" "}
                    {course.description}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-background">
              <CardContent className="space-y-4 p-4 sm:p-5">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Insights nhanh
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border/60 p-3">
                    <p className="text-xs text-muted-foreground">
                      Tổng bài học
                    </p>
                    <p className="text-lg font-semibold">{lessonCount}</p>
                  </div>
                  <div className="rounded-xl border border-border/60 p-3">
                    <p className="text-xs text-muted-foreground">Đã publish</p>
                    <p className="text-lg font-semibold">{readyLessons}</p>
                  </div>
                  <div className="rounded-xl border border-border/60 p-3">
                    <p className="text-xs text-muted-foreground">Ngôn ngữ</p>
                    <p className="text-lg font-semibold">{course.language}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Gợi ý: vào từng bài học để tạo activity (quiz hoặc bài tập)
                  theo đúng luồng nội dung.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-primary/5">
              <CardContent className="space-y-3 p-4 sm:p-5">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Hành động nhanh
                </p>
                <Button asChild className="w-full">
                  <Link href={`/instructor/courses/${course.id}/edit`}>
                    Chỉnh sửa thông tin khóa học
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/instructor/courses/${course.id}/lessons`}>
                    Đi đến danh sách bài học
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/instructor/courses/${course.id}/feed`}>
                    Đi đến quản lý feed
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ManagementPageShell>
  );
}
