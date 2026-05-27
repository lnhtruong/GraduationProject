"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, CirclePlus, Filter, FileClock, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CourseManageCard } from "./CourseManageCard";
import {
  useDeleteCourse,
  useInstructorCourses,
  usePublishCourse,
  useSubmitCourseForReview,
} from "../../course-management/api/course-management.hooks";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { ROLES } from "@/lib/roles";

type StatusFilter =
  | "all"
  | "publish"
  | "draft"
  | "pending"
  | "approved"
  | "rejected";

export default function CoursesPage() {
  const { user } = useAuth();
  const { data: courses, isLoading } = useInstructorCourses({}, true);
  const { data: rejectedCourses, isLoading: rejectedLoading } =
    useInstructorCourses(
      {
        status: "rejected",
      },
      true,
    );
  const deleteCourseMutation = useDeleteCourse();
  const submitCourseForReviewMutation = useSubmitCourseForReview();
  const publishCourseMutation = usePublishCourse();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [activeWorkflowCourseId, setActiveWorkflowCourseId] = useState<
    number | null
  >(null);

  const handleDelete = async (id: number) => {
    await deleteCourseMutation.mutateAsync(id);
    toast.success("Đã xóa khóa học");
  };

  const handleSubmitForReview = async (id: number) => {
    setActiveWorkflowCourseId(id);
    try {
      await submitCourseForReviewMutation.mutateAsync(id);
      toast.success("Đã gửi duyệt khóa học");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gửi duyệt khóa học thất bại";
      toast.error(message);
    } finally {
      setActiveWorkflowCourseId(null);
    }
  };

  const handlePublishCourse = async (id: number) => {
    setActiveWorkflowCourseId(id);
    try {
      await publishCourseMutation.mutateAsync(id);
      toast.success("Đã publish khóa học");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Publish khóa học thất bại";
      toast.error(message);
    } finally {
      setActiveWorkflowCourseId(null);
    }
  };

  const mergedCourses = useMemo(() => {
    const list = [...(courses ?? []), ...(rejectedCourses ?? [])];
    const unique = new Map<number, (typeof list)[number]>();

    for (const item of list) {
      unique.set(item.id, item);
    }

    return Array.from(unique.values());
  }, [courses, rejectedCourses]);

  const stats = useMemo(() => {
    const list = mergedCourses;
    const published = list.filter(
      (course) => course.status === "publish",
    ).length;
    const draft = list.filter((course) => course.status === "draft").length;
    const pending = list.filter((course) => course.status === "pending").length;
    const approved = list.filter(
      (course) => course.status === "approved",
    ).length;
    const rejected = list.filter(
      (course) => course.status === "rejected",
    ).length;
    return {
      total: list.length,
      published,
      draft,
      pending,
      approved,
      rejected,
    };
  }, [mergedCourses]);

  const filteredCourses = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return mergedCourses.filter((course) => {
      const name = String(course.name ?? "").toLowerCase();
      const description = String(course.description ?? "").toLowerCase();
      const categories = Array.isArray(course.categories)
        ? course.categories
        : [];

      const bySearch =
        !keyword ||
        name.includes(keyword) ||
        description.includes(keyword) ||
        categories.some((category) =>
          String(category ?? "")
            .toLowerCase()
            .includes(keyword),
        );

      const byStatus = statusFilter === "all" || course.status === statusFilter;
      return bySearch && byStatus;
    });
  }, [mergedCourses, search, statusFilter]);

  return (
    <div className="space-y-4 sm:space-y-5">
      <Card className="border-border/60 shadow-sm">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight sm:text-[2rem]">
                Quản lý khóa học
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Tổ chức và vận hành toàn bộ khóa học của bạn trong một workspace
                gọn, rõ và dễ mở rộng.
              </p>
            </div>
            <Button asChild className="shadow-sm">
              <Link href="/instructor/courses/new">
                <CirclePlus className="mr-2 h-4 w-4" />
                Tạo khóa học
              </Link>
            </Button>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-2.5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Tổng khóa học
              </p>
              <p className="mt-0.5 text-xl font-semibold">{stats.total}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-2.5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Published
              </p>
              <p className="mt-0.5 text-xl font-semibold text-emerald-600">
                {stats.published}
              </p>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-2.5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Pending
              </p>
              <p className="mt-0.5 text-xl font-semibold text-amber-600">
                {stats.pending}
              </p>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-2.5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Draft
              </p>
              <p className="mt-0.5 text-xl font-semibold">{stats.draft}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-2.5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Approved
              </p>
              <p className="mt-0.5 text-xl font-semibold text-blue-600">
                {stats.approved}
              </p>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-2.5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Rejected
              </p>
              <p className="mt-0.5 text-xl font-semibold text-rose-600">
                {stats.rejected}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-background p-3 sm:p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo tên, mô tả hoặc danh mục..."
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            Lọc:
          </span>
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as StatusFilter)}
          >
            <SelectTrigger size="sm" className="w-44 bg-background">
              <SelectValue placeholder="Chọn trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="publish">Published</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-linear-to-br from-background via-card to-primary/5 shadow-sm">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-16 top-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute right-0 top-24 h-32 w-32 rounded-full bg-amber-400/10 blur-3xl" />
        </div>

        <div className="relative border-b border-border/60 px-4 py-3.5 sm:px-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Danh sách khóa học
              </p>
              <h2 className="mt-1 text-lg font-semibold">
                Các khóa học đang vận hành
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Hiển thị {filteredCourses.length} / {stats.total} khóa học
            </p>
          </div>
        </div>

        <div className="relative p-4 sm:p-5">
          {isLoading || rejectedLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-2xl border border-border/60 bg-background/80 shadow-sm"
                >
                  <Skeleton className="h-24 w-full" />
                  <div className="space-y-2 p-4">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                    <Skeleton className="mt-3 h-8 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : !courses?.length ? (
            <Card className="border-dashed border-border/60 bg-background/80 shadow-sm">
              <CardContent className="flex min-h-96 flex-col items-center justify-center space-y-5 p-7 text-center">
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-primary">
                  <BookOpen className="h-9 w-9" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-semibold">
                    Bạn chưa có khóa học nào
                  </h3>
                  <p className="max-w-xl text-sm text-muted-foreground">
                    Hiện chưa có dữ liệu khóa học để quản lý. Bắt đầu bằng cách
                    tạo khóa học đầu tiên của bạn.
                  </p>
                </div>
                <Button asChild>
                  <Link href="/instructor/courses/new">
                    <CirclePlus className="mr-2 h-4 w-4" />
                    Tạo khóa học đầu tiên
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : !filteredCourses.length ? (
            <Card className="border-border/60 bg-background/80 shadow-sm">
              <CardContent className="flex min-h-64 flex-col items-center justify-center space-y-3 p-6 text-center">
                <div className="rounded-full bg-muted p-3 text-muted-foreground">
                  <FileClock className="h-5 w-5" />
                </div>
                <p className="font-medium">Không có khóa học phù hợp bộ lọc</p>
                <p className="text-sm text-muted-foreground">
                  Thử đổi từ khóa tìm kiếm hoặc chọn trạng thái khác.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                  }}
                >
                  Xóa bộ lọc
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Hiển thị{" "}
                  <span className="font-medium text-foreground">
                    {filteredCourses.length}
                  </span>{" "}
                  khóa học
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredCourses.map((course) => (
                  <CourseManageCard
                    key={course.id}
                    course={course}
                    onSubmitForReview={
                      user?.role === ROLES.LECTURER
                        ? (courseId) => {
                            void handleSubmitForReview(courseId);
                          }
                        : undefined
                    }
                    onPublishCourse={
                      user?.role === ROLES.ADMIN
                        ? (courseId) => {
                            void handlePublishCourse(courseId);
                          }
                        : undefined
                    }
                    workflowLoading={activeWorkflowCourseId === course.id}
                    onDelete={(courseId) => {
                      void handleDelete(courseId);
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
