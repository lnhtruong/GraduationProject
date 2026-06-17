"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  BookOpen,
  PencilLine,
  Clapperboard,
  Clock3,
  BadgeCheck,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  MessageSquare,
  Search,
  Filter,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ManagementPageShell } from "./components/ManagementPageShell";
import {
  useDeleteLesson,
  useInstructorCourseById,
  useLessonsByCourseId,
  usePublishCourse,
  useSubmitCourseForReview,
} from "./api/course-management.hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDuration, formatPrice } from "@/features/courses/utils";
import { useAuth } from "@/features/auth/hooks/useAuth";

interface Props {
  courseId: number;
}

export default function CourseOverviewPage({ courseId }: Props) {
  const LESSONS_PER_PAGE = 10;
  type LessonStatusFilter = "all" | "active" | "blocked";

  const toSeconds = (duration?: number | string | null) => {
    if (typeof duration === "number" && Number.isFinite(duration)) {
      // Existing lesson forms store duration in minutes.
      return Math.max(0, Math.round(duration * 60));
    }

    if (typeof duration === "string") {
      const normalized = duration.trim();
      const parts = normalized.split(":");
      if (parts.length >= 2 && parts.length <= 3) {
        const [h = "0", m = "0", s = "0"] = parts;
        const parsedH = Number(h);
        const parsedM = Number(m);
        const parsedS = Number(s);
        if (
          Number.isFinite(parsedH) &&
          Number.isFinite(parsedM) &&
          Number.isFinite(parsedS)
        ) {
          return Math.max(0, parsedH * 3600 + parsedM * 60 + parsedS);
        }
      }

      const numeric = Number(normalized);
      if (Number.isFinite(numeric)) {
        return Math.max(0, Math.round(numeric * 60));
      }
    }

    return 0;
  };

  const { data: course, isLoading: courseLoading } =
    useInstructorCourseById(courseId);
  const { data: lessons, isLoading: lessonsLoading } =
    useLessonsByCourseId(courseId);
  const { user } = useAuth();
  const deleteLessonMutation = useDeleteLesson();
  const submitForReviewMutation = useSubmitCourseForReview();
  const publishCourseMutation = usePublishCourse();

  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LessonStatusFilter>("all");

  const lessonCount = lessons?.length ?? 0;
  const readyLessons = (lessons ?? []).filter(
    (lesson) => String(lesson.status).toLowerCase() === "active",
  ).length;
  const totalLessonMinutes = (lessons ?? []).reduce(
    (sum, lesson) => sum + toSeconds(lesson.duration),
    0,
  );
  const avgLessonSeconds =
    lessonCount > 0 ? Math.round(totalLessonMinutes / lessonCount) : 0;

  const filteredLessons = useMemo(() => {
    return (lessons ?? []).filter((lesson) => {
      const keyword = search.trim().toLowerCase();
      const bySearch =
        !keyword ||
        lesson.title.toLowerCase().includes(keyword) ||
        (lesson.description ?? "").toLowerCase().includes(keyword);

      const lessonStatus = String(lesson.status).toLowerCase();
      const byStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && lessonStatus === "active") ||
        (statusFilter === "blocked" && lessonStatus === "blocked");

      return bySearch && byStatus;
    });
  }, [lessons, search, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredLessons.length / LESSONS_PER_PAGE),
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedLessons = useMemo(() => {
    const start = (safeCurrentPage - 1) * LESSONS_PER_PAGE;
    const end = start + LESSONS_PER_PAGE;
    return filteredLessons.slice(start, end);
  }, [filteredLessons, safeCurrentPage]);

  const handleDeleteLesson = async (lessonId: number) => {
    await deleteLessonMutation.mutateAsync(lessonId);
    toast.success("Đã xóa bài học");
    setCurrentPage(1);
  };

  const isAdmin = user?.role === 1;

  const handleCourseStatusAction = async () => {
    if (!course) {
      return;
    }

    try {
      if (course.status === "draft") {
        await submitForReviewMutation.mutateAsync(course.id);
        toast.success("Đã gửi khóa học chờ duyệt");
        return;
      }

      if (course.status === "approved") {
        await publishCourseMutation.mutateAsync(course.id);
        toast.success("Đã publish khóa học");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Cập nhật trạng thái thất bại";
      toast.error(message);
    }
  };

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
      description="Theo dõi tổng quan khóa học và quản lý bài học ngay trong một màn hình."
      breadcrumbs={[
        { label: "Quản lý khóa học", href: "/instructor/courses" },
        { label: course.name },
      ]}
      action={
        <div className="grid w-full gap-2 sm:flex sm:w-auto sm:flex-wrap">
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href={`/instructor/courses/${course.id}/qa`}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Q&A
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href={`/instructor/courses/${course.id}/feed`}>
              <Clapperboard className="mr-2 h-4 w-4" />
              Quản lý feed
            </Link>
          </Button>
          <Button asChild className="w-full sm:w-auto">
            <Link href={`/instructor/courses/${course.id}/edit`}>
              <PencilLine className="mr-2 h-4 w-4" />
              Sửa khóa học
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
                    Tổng quan khóa học
                  </p>
                  <h2 className="mt-1 text-xl font-semibold">{course.name}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {String(course.status).toUpperCase()}
                  </Badge>
                  {course.status === "draft" && (
                    <Button
                      type="button"
                      size="sm"
                      disabled={submitForReviewMutation.isPending}
                      onClick={() => {
                        void handleCourseStatusAction();
                      }}
                    >
                      {submitForReviewMutation.isPending
                        ? "Đang gửi duyệt..."
                        : "Gửi duyệt khóa học"}
                    </Button>
                  )}
                  {course.status === "pending" && (
                    <Button type="button" size="sm" disabled>
                      Đang chờ admin duyệt
                    </Button>
                  )}
                  {course.status === "approved" && (
                    <Button
                      type="button"
                      size="sm"
                      disabled={publishCourseMutation.isPending}
                      onClick={() => {
                        void handleCourseStatusAction();
                      }}
                    >
                      {publishCourseMutation.isPending
                        ? "Đang publish..."
                        : "Publish khóa học"}
                    </Button>
                  )}
                </div>
              </div>

              <div className="max-w-3xl rounded-xl border border-border/60 bg-background/70 p-3">
                <div
                  className="course-overview-description prose prose-sm max-w-none text-muted-foreground prose-headings:text-foreground prose-a:text-primary"
                  dangerouslySetInnerHTML={{
                    __html:
                      course.description?.trim() ||
                      "<p>Chưa có mô tả cho khóa học này.</p>",
                  }}
                />
              </div>

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
                    label: "Trung bình / bài",
                    value: formatDuration(avgLessonSeconds),
                    icon: Clock3,
                  },
                  {
                    label: "Giá bán",
                    value: formatPrice(course.price),
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
                {Array.isArray(course.categories) &&
                course.categories.length ? (
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

        <div className="gap-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Danh sách bài học</h2>
                <p className="text-sm text-muted-foreground">
                  Quản lý toàn bộ bài học ngay tại đây: tìm kiếm, lọc, thêm, sửa
                  và xóa.
                </p>
              </div>
              <Button asChild className="hidden sm:inline-flex">
                <Link href={`/instructor/courses/${course.id}/lessons/new`}>
                  <CirclePlus className="mr-2 h-4 w-4" />
                  Thêm bài học
                </Link>
              </Button>
            </div>

            <Button asChild className="w-full sm:hidden">
              <Link href={`/instructor/courses/${course.id}/lessons/new`}>
                <CirclePlus className="mr-2 h-4 w-4" />
                Thêm bài học
              </Link>
            </Button>

            <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-background p-3 sm:p-4 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full md:max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Tìm bài học theo tên hoặc mô tả..."
                  className="pl-9"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Filter className="h-3.5 w-3.5" />
                  Lọc:
                </span>
                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value as LessonStatusFilter);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger size="sm" className="w-44 bg-background">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              {lessonsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-24 w-full rounded-2xl" />
                  <Skeleton className="h-24 w-full rounded-2xl" />
                </div>
              ) : paginatedLessons.length ? (
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
                            {String(lesson.status)}
                          </Badge>
                          <span className="text-sm font-medium">
                            {lesson.title}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {lesson.description ?? "Chưa có mô tả"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDuration(toSeconds(lesson.duration))} •{" "}
                          {lesson.contentType}
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
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => {
                            void handleDeleteLesson(lesson.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
                  Không có bài học nào phù hợp bộ lọc hiện tại.
                </div>
              )}
            </div>

            {filteredLessons.length > LESSONS_PER_PAGE ? (
              <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-background px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
                <p className="text-sm text-muted-foreground">
                  Hiển thị {(safeCurrentPage - 1) * LESSONS_PER_PAGE + 1} -{" "}
                  {Math.min(
                    safeCurrentPage * LESSONS_PER_PAGE,
                    filteredLessons.length,
                  )}{" "}
                  / {filteredLessons.length} bài học
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
        </div>
      </div>

      <style jsx global>{`
        .course-overview-description :where(h1, h2, h3, h4, h5, h6) {
          margin: 0.4rem 0;
          font-weight: 600;
          color: hsl(var(--foreground));
        }

        .course-overview-description :where(p, ul, ol, blockquote) {
          margin: 0.35rem 0;
        }

        .course-overview-description blockquote {
          border-left: 3px solid hsl(var(--primary));
          background: hsl(var(--muted) / 0.3);
          padding: 0.35rem 0.75rem;
          border-radius: 0.375rem;
        }

        .course-overview-description :where(ul, ol) {
          padding-left: 1rem;
        }

        .course-overview-description ul {
          list-style: disc;
        }

        .course-overview-description ol {
          list-style: decimal;
        }
      `}</style>
    </ManagementPageShell>
  );
}
