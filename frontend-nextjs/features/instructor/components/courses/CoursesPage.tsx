"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  BookOpen,
  CirclePlus,
  FileClock,
  Search,
  CheckCircle2,
  XCircle,
  Send,
  Rocket,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CourseManageCard } from "./CourseManageCard";
import {
  useDeleteCourse,
  useInstructorCourses,
  usePublishCourse,
  useSubmitCourseForReview,
} from "../../course-management/api/course-management.hooks";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { ROLES } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";

type StatusFilter =
  | "all"
  | "publish"
  | "draft"
  | "pending"
  | "approved"
  | "rejected";

const PAGE_SIZE = 4;

function getWorkflowErrorMessage(error: unknown, fallback: string) {
  const responseMessage = (error as {
    response?: { data?: { message?: unknown } };
  }).response?.data?.message;

  if (typeof responseMessage === "string" && responseMessage.trim()) {
    return responseMessage;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

export default function CoursesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read initial states from URL query parameters
  const urlStatus = (searchParams.get("status") as StatusFilter) || "all";
  const urlSearch = searchParams.get("search") || "";
  const urlPage = parseInt(searchParams.get("page") || "1", 10);

  // State for search, active status filter, and pagination
  const [search, setSearch] = useState(urlSearch);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(urlStatus);
  const [page, setPage] = useState(urlPage);
  const [activeWorkflowCourseId, setActiveWorkflowCourseId] = useState<
    number | null
  >(null);

  // Sync state if URL changes externally (e.g. browser back/forward buttons)
  useEffect(() => {
    setSearch(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    setStatusFilter(urlStatus);
  }, [urlStatus]);

  useEffect(() => {
    setPage(urlPage);
  }, [urlPage]);

  // Debounced search term for server-side filtering
  const debouncedSearch = useDebounce(search, 350);

  // Sync debounced search to URL query parameter & reset page parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const currentSearch = params.get("search") || "";
    if (currentSearch !== debouncedSearch) {
      if (debouncedSearch) {
        params.set("search", debouncedSearch);
      } else {
        params.delete("search");
      }
      params.delete("page"); // Reset page on filter changes
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [debouncedSearch, pathname, router]);

  // Update status filter state and sync to URL query parameter (resets page)
  const handleStatusFilterChange = (newStatus: StatusFilter) => {
    setStatusFilter(newStatus);
    const params = new URLSearchParams(window.location.search);
    const currentStatus = params.get("status") || "all";
    if (currentStatus !== newStatus) {
      if (newStatus === "all") {
        params.delete("status");
      } else {
        params.set("status", newStatus);
      }
      params.delete("page"); // Reset page on status changes
      router.replace(`${pathname}?${params.toString()}`);
    }
  };

  // Handle page change & sync to URL query parameter
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    const params = new URLSearchParams(window.location.search);
    if (newPage <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(newPage));
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  // 1. STATS QUERY: Fetch all courses to calculate statistics counts (cached, runs once)
  // Backend returns all instructor courses (including rejected ones) when status parameter is omitted.
  const { data: statsCourses } = useInstructorCourses({}, true);

  const stats = useMemo(() => {
    const list = statsCourses ?? [];
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
  }, [statsCourses]);

  // 2. FILTERED LIST QUERY: Server-side query with debounced search & status filter
  const { data: listCourses, isLoading: listLoading } = useInstructorCourses(
    {
      status: statusFilter === "all" ? undefined : statusFilter,
      search: debouncedSearch || undefined,
    },
    true
  );

  const filteredCourses = listCourses ?? [];

  // Pagination helper calculations
  const totalItems = filteredCourses.length;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE) || 1;

  // Correct page if it falls out of range due to filters change
  useEffect(() => {
    if (page > totalPages) {
      handlePageChange(totalPages);
    }
  }, [page, totalPages]);

  const displayedCourses = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return filteredCourses.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredCourses, page]);

  const deleteCourseMutation = useDeleteCourse();
  const submitCourseForReviewMutation = useSubmitCourseForReview();
  const publishCourseMutation = usePublishCourse();

  const handleDelete = async (id: number) => {
    setActiveWorkflowCourseId(id);
    try {
      await deleteCourseMutation.mutateAsync(id);
      toast.success("Đã xóa khóa học");
    } catch (error) {
      toast.error(getWorkflowErrorMessage(error, "Xóa khóa học thất bại"));
    } finally {
      setActiveWorkflowCourseId(null);
    }
  };

  const handleSubmitForReview = async (id: number) => {
    setActiveWorkflowCourseId(id);
    try {
      await submitCourseForReviewMutation.mutateAsync(id);
      toast.success("Đã gửi duyệt khóa học");
    } catch (error) {
      toast.error(getWorkflowErrorMessage(error, "Gửi duyệt khóa học thất bại"));
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
      toast.error(getWorkflowErrorMessage(error, "Publish khóa học thất bại"));
    } finally {
      setActiveWorkflowCourseId(null);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header section with compact design */}
      <Card className="border-border/50 bg-card shadow-xs rounded-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-primary/5 blur-2xl" />
        <CardContent className="space-y-5 p-5 sm:p-6 relative">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Quản lý khóa học
              </h1>
              <p className="max-w-xl text-xs text-muted-foreground leading-relaxed">
                Tổ chức và vận hành toàn bộ khóa học của bạn trong một workspace gọn, rõ và dễ mở rộng.
              </p>
            </div>
            <Button asChild size="sm" className="h-9 px-4 rounded-xl shadow-xs hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer">
              <Link href="/instructor/courses/new">
                <CirclePlus className="mr-1.5 h-4 w-4" />
                Tạo khóa học
              </Link>
            </Button>
          </div>

          {/* Interactive Statistics Metrics Panel (acts as filter tab) */}
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 pt-1">
            {(["all", "draft", "pending", "approved", "publish", "rejected"] as const).map((key) => {
              const isActive = statusFilter === key;
              const config = {
                all: {
                  label: "Tổng số",
                  icon: BookOpen,
                  value: stats.total,
                  activeClass: "border-amber-500 bg-amber-500/10 dark:border-amber-500/50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 shadow-sm scale-[1.02] ring-1 ring-amber-500/20",
                },
                draft: {
                  label: "Bản nháp",
                  icon: FileText,
                  value: stats.draft,
                  activeClass: "border-zinc-400 bg-zinc-500/10 dark:border-zinc-500/50 dark:bg-zinc-900/30 text-zinc-700 dark:text-zinc-300 shadow-sm scale-[1.02] ring-1 ring-zinc-500/20",
                },
                pending: {
                  label: "Chờ duyệt",
                  icon: Send,
                  value: stats.pending,
                  activeClass: "border-orange-500 bg-orange-500/10 dark:border-orange-500/50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 shadow-sm scale-[1.02] ring-1 ring-orange-500/20",
                },
                approved: {
                  label: "Đã duyệt",
                  icon: CheckCircle2,
                  value: stats.approved,
                  activeClass: "border-sky-500 bg-sky-500/10 dark:border-sky-500/50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-400 shadow-sm scale-[1.02] ring-1 ring-sky-500/20",
                },
                publish: {
                  label: "Đã xuất bản",
                  icon: Rocket,
                  value: stats.published,
                  activeClass: "border-emerald-500 bg-emerald-500/10 dark:border-emerald-500/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 shadow-sm scale-[1.02] ring-1 ring-emerald-500/20",
                },
                rejected: {
                  label: "Từ chối",
                  icon: XCircle,
                  value: stats.rejected,
                  activeClass: "border-rose-500 bg-rose-500/10 dark:border-rose-500/50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 shadow-sm scale-[1.02] ring-1 ring-rose-500/20",
                },
              }[key];

              const Icon = config.icon;

              return (
                <button
                  key={key}
                  onClick={() => handleStatusFilterChange(key)}
                  className={cn(
                    "rounded-xl border p-3 flex flex-col justify-between min-h-[76px] text-left transition-all duration-200 cursor-pointer select-none",
                    isActive
                      ? config.activeClass
                      : "border-zinc-200 dark:border-zinc-800/80 bg-background dark:bg-zinc-950/40 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[9px] font-bold uppercase tracking-wider">
                      {config.label}
                    </span>
                    <Icon className={cn("h-3.5 w-3.5", isActive ? "" : "text-zinc-400 dark:text-zinc-500")} />
                  </div>
                  <p
                    className={cn(
                      "mt-1 text-2xl font-bold leading-none",
                      isActive ? "" : "text-zinc-800 dark:text-zinc-200"
                    )}
                  >
                    {config.value}
                  </p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Filter and Search Section */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border/50 bg-card p-3 sm:p-3.5 shadow-xs">
        <div className="relative w-full">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo tên khóa học, mô tả hoặc danh mục..."
            className="pl-9 h-10 border-border/80 focus-visible:ring-1 focus-visible:ring-primary/20 rounded-xl"
          />
        </div>
      </div>

      {/* Course List Wrapper */}
      <section className="relative overflow-hidden rounded-2xl border border-border/50 bg-linear-to-br from-background via-card to-primary/5 shadow-xs">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-16 top-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute right-0 top-24 h-32 w-32 rounded-full bg-amber-400/10 blur-3xl" />
        </div>

        {/* Section Header */}
        <div className="relative border-b border-border/40 px-5 py-3.5 bg-card/40">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-primary">
                Danh sách khóa học
              </p>
              <h2 className="mt-0.5 text-base font-bold text-foreground">
                Các khóa học đang vận hành
              </h2>
            </div>
          </div>
        </div>

        {/* List Content */}
        <div className="relative p-4 sm:p-5">
          {listLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-2xl border border-border/50 bg-background/80 shadow-xs"
                >
                  <Skeleton className="h-36 w-full" />
                  <div className="space-y-3 p-4">
                    <Skeleton className="h-4.5 w-3/4" />
                    <Skeleton className="h-3.5 w-full" />
                    <Skeleton className="h-3.5 w-2/3" />
                    <Skeleton className="mt-3.5 h-8 w-full rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : !stats.total ? (
            <Card className="border-dashed border-border bg-background/80 shadow-xs rounded-2xl">
              <CardContent className="flex min-h-80 flex-col items-center justify-center space-y-4 p-6 text-center">
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-primary">
                  <BookOpen className="h-8 w-8" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-xl font-bold">
                    Bạn chưa có khóa học nào
                  </h3>
                  <p className="max-w-md text-xs text-muted-foreground leading-relaxed">
                    Hiện chưa có dữ liệu khóa học để quản lý. Bắt đầu bằng cách tạo khóa học đầu tiên của bạn để chia sẻ kiến thức với cộng đồng.
                  </p>
                </div>
                <Button asChild size="sm" className="rounded-xl cursor-pointer">
                  <Link href="/instructor/courses/new">
                    <CirclePlus className="mr-1.5 h-4 w-4" />
                    Tạo khóa học đầu tiên
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : !filteredCourses.length ? (
            <Card className="border-border bg-background/80 shadow-xs rounded-2xl">
              <CardContent className="flex min-h-60 flex-col items-center justify-center space-y-3 p-6 text-center">
                <div className="rounded-full bg-muted p-3 text-muted-foreground">
                  <FileClock className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-foreground text-sm">Không có khóa học phù hợp bộ lọc</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Nhấp vào các thẻ thống kê phía trên để đổi bộ lọc hoặc xóa từ khóa tìm kiếm.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg cursor-pointer"
                  onClick={() => {
                    setSearch("");
                    handleStatusFilterChange("all");
                  }}
                >
                  Xóa bộ lọc
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {displayedCourses.map((course) => (
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

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-border/40 mt-5 pt-4">
                  <span className="text-xs text-muted-foreground">
                    Hiển thị {Math.min((page - 1) * PAGE_SIZE + 1, totalItems)}–{Math.min(page * PAGE_SIZE, totalItems)} / {totalItems} khóa học
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-lg cursor-pointer"
                      disabled={page <= 1}
                      onClick={() => handlePageChange(page - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="min-w-[60px] text-center text-xs font-semibold text-muted-foreground">
                      Trang {page} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-lg cursor-pointer"
                      disabled={page >= totalPages}
                      onClick={() => handlePageChange(page + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
