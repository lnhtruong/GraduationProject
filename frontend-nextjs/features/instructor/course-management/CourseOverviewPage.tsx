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
  Send,
  Rocket,
  ShieldAlert,
  Play,
  FileText,
  XCircle,
  Coins,
  MoreVertical,
  ClipboardCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ManagementPageShell } from "./components/ManagementPageShell";
import {
  useDeleteLesson,
  useInstructorCourseById,
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
import { cn } from "@/lib/utils";

interface Props {
  courseId: number;
}

export default function CourseOverviewPage({ courseId }: Props) {
  const LESSONS_PER_PAGE = 10;
  type LessonStatusFilter = "all" | "active" | "blocked";

  const toSeconds = (duration?: number | string | null) => {
    if (typeof duration === "number" && Number.isFinite(duration)) {
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
  const lessons = course?.lessons;
  const lessonsLoading = courseLoading;
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

  function getStatusBadge(status: string) {
    const config: Record<string, { label: string; className: string }> = {
      publish: {
        label: "Đã xuất bản",
        className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-500/20",
      },
      draft: { 
        label: "Bản nháp", 
        className: "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800",
      },
      pending: {
        label: "Chờ duyệt",
        className: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-500/20",
      },
      approved: {
        label: "Đã duyệt",
        className: "bg-sky-500/10 text-sky-600 border-sky-500/20 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-500/20",
      },
      rejected: {
        label: "Từ chối",
        className: "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-500/20",
      },
    };
    
    const norm = String(status).toLowerCase();
    const item = config[norm] ?? { label: status, className: "bg-muted text-muted-foreground" };
    return (
      <Badge variant="outline" className={cn("text-xs font-semibold px-2.5 py-0.5 rounded-md", item.className)}>
        {item.label}
      </Badge>
    );
  }

  function getLessonStatusBadge(status: string) {
    const norm = String(status).toLowerCase();
    if (norm === "active") {
      return (
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-medium px-2 py-0.2 rounded-md">
          Đang hoạt động
        </Badge>
      );
    }
    if (norm === "blocked") {
      return (
        <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/20 text-[10px] font-medium px-2 py-0.2 rounded-md">
          Tạm khóa
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-zinc-100 text-zinc-600 border-zinc-200 text-[10px] font-medium px-2 py-0.2 rounded-md">
        {status}
      </Badge>
    );
  }

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

  // Create clean metadata & actions bar for the top header description
  const headerDescription = (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 pt-0.5">
      {getStatusBadge(course.status)}
      {Array.isArray(course.categories) && course.categories.map((category) => (
        <span key={category} className="text-xs text-primary font-bold hover:underline cursor-pointer">
          #{category}
        </span>
      ))}
    </div>
  );

  return (
    <ManagementPageShell
      title={course.name}
      description={headerDescription}
      breadcrumbs={[
        { label: "Quản lý khóa học", href: "/instructor/courses" },
        { label: course.name },
      ]}
      noCard={true}
      thumbnailUrl={course.thumbnailUrl}
      action={
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Main course operation workflow button */}
          {course.status === "draft" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 px-3.5 rounded-xl shadow-xs cursor-pointer flex-1 sm:flex-initial justify-center"
              disabled={submitForReviewMutation.isPending}
              onClick={() => {
                void handleCourseStatusAction();
              }}
            >
              <ClipboardCheck className="mr-1.5 h-3.5 w-3.5 text-primary" />
              {submitForReviewMutation.isPending ? "Đang gửi..." : "Gửi duyệt"}
            </Button>
          )}
          {course.status === "pending" && (
            <Button type="button" size="sm" variant="outline" className="h-9 px-3.5 rounded-xl shadow-xs cursor-not-allowed opacity-75 flex-1 sm:flex-initial justify-center" disabled>
              <ShieldAlert className="mr-1.5 h-3.5 w-3.5 text-amber-500" />
              Chờ duyệt
            </Button>
          )}
          {course.status === "approved" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 px-3.5 rounded-xl shadow-xs cursor-pointer border-emerald-500/30 hover:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 flex-1 sm:flex-initial justify-center"
              disabled={publishCourseMutation.isPending}
              onClick={() => {
                void handleCourseStatusAction();
              }}
            >
              <Rocket className="mr-1.5 h-3.5 w-3.5" />
              {publishCourseMutation.isPending ? "Đang chạy..." : "Xuất bản"}
            </Button>
          )}

          <Button asChild size="sm" className="h-9 px-3.5 rounded-xl shadow-xs hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer flex-1 sm:flex-initial justify-center">
            <Link href={`/instructor/courses/${course.id}/edit`}>
              <PencilLine className="mr-1.5 h-3.5 w-3.5" />
              Sửa khóa học
            </Link>
          </Button>

          {/* Three-dots menu for extra teaching tools */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-xl shadow-xs cursor-pointer hover:bg-muted/80 text-muted-foreground hover:text-foreground shrink-0 border-border/60 justify-center items-center"
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Công cụ dạy học</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl border border-border/50 bg-popover p-1 shadow-md">
              <DropdownMenuLabel className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                Công cụ dạy học
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border/40" />
              <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-2.5 py-2 text-sm focus:bg-accent focus:text-accent-foreground text-foreground">
                <Link href={`/instructor/courses/${course.id}/qa`} className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <span>Diễn đàn Hỏi & Đáp (Q&A)</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-2.5 py-2 text-sm focus:bg-accent focus:text-accent-foreground text-foreground">
                <Link href={`/instructor/courses/${course.id}/feed`} className="flex items-center gap-2">
                  <Clapperboard className="h-4 w-4 text-primary" />
                  <span>Bản tin khóa học (Feed)</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      }
    >
      <div className="mt-1">
        {/* SECTION 2: Unified Content Area (Description & Lessons list inside a single card) */}
        <Card className="border-border/50 bg-linear-to-br from-background via-card to-primary/5 shadow-xs rounded-2xl overflow-hidden">
          
          {/* Card syllabus title header */}
          <div className="relative border-b border-border/40 px-5 py-3.5 bg-card/40 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-primary">
                Chi tiết học trình
              </p>
              <h2 className="mt-0.5 text-base font-bold text-foreground">
                Giới thiệu khóa học và các bài giảng vận hành
              </h2>
            </div>

            {/* Metadata (Lessons, Duration, Price) in main card header */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border/50 bg-muted/40 text-muted-foreground font-semibold">
                <BookOpen className="h-3.5 w-3.5 text-primary" />
                <span>{lessonCount} bài học ({readyLessons} hoạt động)</span>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border/50 bg-muted/40 text-muted-foreground font-semibold">
                <Clock3 className="h-3.5 w-3.5 text-primary" />
                <span>{formatDuration(avgLessonSeconds) || "0 phút"}</span>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border/50 bg-muted/40 text-muted-foreground font-semibold">
                <Coins className="h-3.5 w-3.5 text-primary" />
                <span>{course.price === 0 ? "Miễn phí" : formatPrice(course.price)}</span>
              </div>
            </div>
          </div>

          <CardContent className="p-5 sm:p-6 space-y-6">
            

            {/* Sub-section: Course description */}
            <div className="space-y-3 pb-6 border-b border-border/30">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-primary" />
                Giới thiệu khóa học
              </h3>
              <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed pl-5.5">
                <div
                  className="course-overview-description"
                  dangerouslySetInnerHTML={{
                    __html:
                      course.description?.trim() ||
                      "<p className='italic opacity-60'>Chưa có mô tả chi tiết cho khóa học này.</p>",
                  }}
                />
              </div>
            </div>

             {/* Sub-section: Curriculum & Lessons management */}
            <div className="space-y-4 pt-1">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-primary" />
                  Bài giảng của khóa học
                </h3>
                <Button asChild size="sm" className="h-8 sm:h-8.5 rounded-xl shadow-xs cursor-pointer text-xs">
                  <Link href={`/instructor/courses/${course.id}/lessons/new`}>
                    <CirclePlus className="mr-1 sm:mr-1.5 h-3.5 sm:h-4 w-3.5 sm:w-4" />
                    Thêm bài học
                  </Link>
                </Button>
              </div>

              {/* Toolbar */}
              <div className="flex flex-row gap-2 rounded-xl border border-border/40 bg-muted/10 p-2 sm:p-3 items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Tìm bài học..."
                    className="pl-9 h-9.5 border-border/80 rounded-xl bg-background text-xs sm:text-sm"
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="hidden sm:inline-flex items-center gap-1 text-xs text-muted-foreground font-medium">
                    <Filter className="h-3 w-3" />
                    Lọc:
                  </span>
                  <Select
                    value={statusFilter}
                    onValueChange={(value) => {
                      setStatusFilter(value as LessonStatusFilter);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger size="sm" className="w-28 sm:w-36 bg-background rounded-xl h-9 text-xs sm:text-sm">
                      <SelectValue placeholder="Trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="active">Đang hoạt động</SelectItem>
                      <SelectItem value="blocked">Tạm khóa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Lessons Grid list */}
              <div className="space-y-3 pt-1">
                {lessonsLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-20 w-full rounded-xl" />
                    <Skeleton className="h-20 w-full rounded-xl" />
                  </div>
                ) : paginatedLessons.length ? (
                  paginatedLessons.map((lesson, index) => {
                    const isLessonActive = String(lesson.status).toLowerCase() === "active";
                    
                    return (
                      <div
                        key={lesson.id}
                        className={cn(
                          "rounded-xl border border-border/50 bg-background/60 hover:bg-muted/10 p-3.5 sm:p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between transition-all duration-200 border-l-4",
                          isLessonActive ? "border-l-emerald-500" : "border-l-rose-500"
                        )}
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary" className="text-[10px] font-bold px-1.5 py-0 rounded-md">
                              Bài {(safeCurrentPage - 1) * LESSONS_PER_PAGE + index + 1}
                            </Badge>
                            {getLessonStatusBadge(lesson.status)}
                            {lesson.contentType === "video" ? (
                              <Badge variant="outline" className="text-[10px] font-medium px-1.5 py-0 rounded-md flex items-center gap-1 opacity-70">
                                <Play className="h-2.5 w-2.5" />
                                Video
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] font-medium px-1.5 py-0 rounded-md flex items-center gap-1 opacity-70">
                                <FileText className="h-2.5 w-2.5" />
                                Tài liệu
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground font-semibold">
                              {formatDuration(toSeconds(lesson.duration))}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-foreground leading-snug truncate">
                            {lesson.title}
                          </h4>
                          {lesson.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {lesson.description}
                            </p>
                          )}
                        </div>
                        
                        {/* Lesson Action buttons */}
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <Button asChild size="sm" variant="outline" className="h-8 rounded-lg text-xs cursor-pointer">
                            <Link
                              href={`/instructor/courses/${course.id}/lessons/${lesson.id}/edit`}
                            >
                              Chỉnh sửa
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-lg cursor-pointer"
                            onClick={() => {
                              void handleDeleteLesson(lesson.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-dashed border-border/50 bg-muted/5 px-6 py-10 text-center flex flex-col items-center justify-center gap-2">
                    <div className="rounded-full bg-muted p-3 text-muted-foreground/60">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-bold text-foreground mt-1">Chưa có bài học nào</p>
                    <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
                      {search || statusFilter !== "all" 
                        ? "Không tìm thấy bài học nào phù hợp với bộ lọc hoặc từ khóa tìm kiếm hiện tại."
                        : "Khóa học này hiện chưa được thiết lập bài giảng. Nhấn nút Thêm bài học để bắt đầu xây dựng giáo trình."}
                    </p>
                  </div>
                )}
              </div>

              {/* Syllabus Pagination */}
              {filteredLessons.length > LESSONS_PER_PAGE && (
                <div className="flex flex-col gap-3 rounded-xl border border-border/40 bg-muted/10 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between mt-2">
                  <p className="text-xs text-muted-foreground">
                    Hiển thị {(safeCurrentPage - 1) * LESSONS_PER_PAGE + 1} -{" "}
                    {Math.min(
                      safeCurrentPage * LESSONS_PER_PAGE,
                      filteredLessons.length,
                    )}{" "}
                    / {filteredLessons.length} bài học
                  </p>
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 rounded-lg cursor-pointer"
                      disabled={safeCurrentPage === 1}
                      onClick={() =>
                        setCurrentPage(Math.max(1, safeCurrentPage - 1))
                      }
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs font-semibold text-muted-foreground min-w-[50px] text-center">
                      Trang {safeCurrentPage}/{totalPages}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 rounded-lg cursor-pointer"
                      disabled={safeCurrentPage === totalPages}
                      onClick={() =>
                        setCurrentPage(Math.min(totalPages, safeCurrentPage + 1))
                      }
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

            </div>
          </CardContent>
        </Card>
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
