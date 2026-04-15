"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  PencilLine,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CirclePlus,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ManagementPageShell } from "./components/ManagementPageShell";
import {
  useDeleteLesson,
  useInstructorCourseById,
  useLessonsByCourseId,
} from "./api/course-management.hooks";

interface Props {
  courseId: number;
}

export default function LessonListPage({ courseId }: Props) {
  const { data: course, isLoading: courseLoading } =
    useInstructorCourseById(courseId);
  const { data: lessons, isLoading } = useLessonsByCourseId(courseId);
  const deleteLessonMutation = useDeleteLesson();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "blocked"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const lessonCount = useMemo(() => lessons?.length ?? 0, [lessons]);
  const activeCount = useMemo(
    () =>
      (lessons ?? []).filter(
        (lesson) => String(lesson.status).toLowerCase() === "active",
      ).length,
    [lessons],
  );
  const blockedCount = useMemo(
    () =>
      (lessons ?? []).filter(
        (lesson) => String(lesson.status).toLowerCase() === "blocked",
      ).length,
    [lessons],
  );

  const filteredLessons = useMemo(() => {
    return (lessons ?? []).filter((lesson) => {
      const q = search.trim().toLowerCase();
      const bySearch =
        !q ||
        lesson.title.toLowerCase().includes(q) ||
        (lesson.description ?? "").toLowerCase().includes(q);

      const status = String(lesson.status).toLowerCase();
      const byStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && status === "active") ||
        (statusFilter === "blocked" && status === "blocked");

      return bySearch && byStatus;
    });
  }, [lessons, search, statusFilter]);

  const totalPages = Math.ceil(filteredLessons.length / itemsPerPage);
  const paginatedLessons = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredLessons.slice(start, end);
  }, [filteredLessons, currentPage, itemsPerPage]);

  if (courseLoading) {
    return (
      <ManagementPageShell
        title="Đang tải bài học"
        description="Lấy thông tin khóa học và bài học từ backend."
        breadcrumbs={[
          { label: "Quản lý khóa học", href: "/instructor/courses" },
          { label: "Bài học" },
        ]}
      >
        <div className="p-4 text-sm text-muted-foreground sm:p-5">
          Đang tải...
        </div>
      </ManagementPageShell>
    );
  }

  if (!course) {
    return (
      <ManagementPageShell
        title="Không tìm thấy khóa học"
        description="Vui lòng quay lại danh sách khóa học."
        breadcrumbs={[
          { label: "Quản lý khóa học", href: "/instructor/courses" },
          { label: "Bài học" },
        ]}
      >
        <div className="p-4 text-sm text-muted-foreground sm:p-5">
          Khóa học không hợp lệ.
        </div>
      </ManagementPageShell>
    );
  }

  const handleDelete = async (lessonId: number) => {
    await deleteLessonMutation.mutateAsync(lessonId);
    toast.success("Đã xóa bài học");
    setCurrentPage(1);
  };

  return (
    <ManagementPageShell
      title={`Bài học của ${course.name}`}
      description="CRUD bài học theo đúng thứ tự hiển thị trong khóa học. Từ đây có thể mở editor quiz của từng bài."
      breadcrumbs={[
        { label: "Quản lý khóa học", href: "/instructor/courses" },
        { label: course.name, href: `/instructor/courses/${course.id}` },
        { label: "Bài học" },
      ]}
      action={
        <Button asChild className="w-full sm:w-auto">
          <Link href={`/instructor/courses/${course.id}/lessons/new`}>
            <CirclePlus className="mr-2 h-4 w-4" />
            Thêm bài học
          </Link>
        </Button>
      }
    >
      <div className="space-y-4 p-3 sm:p-4 lg:p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-border/60 bg-muted/10 px-4 py-3 text-sm">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Tổng bài học
            </p>
            <p className="text-xl font-semibold">{lessonCount}</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-primary/5 px-4 py-3 text-sm">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Hoạt động
            </p>
            <p className="text-xl font-semibold text-primary">{activeCount}</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-muted/10 px-4 py-3 text-sm">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Đang khóa
            </p>
            <p className="text-xl font-semibold">{blockedCount}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-background p-3 sm:p-4 md:flex-row md:items-center md:justify-between">
          <Input
            placeholder="Tìm bài học theo tên hoặc mô tả..."
            className="md:max-w-sm"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setCurrentPage(1);
            }}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={statusFilter === "all" ? "default" : "outline"}
              onClick={() => {
                setStatusFilter("all");
                setCurrentPage(1);
              }}
            >
              Tất cả
            </Button>
            <Button
              size="sm"
              variant={statusFilter === "active" ? "default" : "outline"}
              onClick={() => {
                setStatusFilter("active");
                setCurrentPage(1);
              }}
            >
              Active
            </Button>
            <Button
              size="sm"
              variant={statusFilter === "blocked" ? "default" : "outline"}
              onClick={() => {
                setStatusFilter("blocked");
                setCurrentPage(1);
              }}
            >
              Blocked
            </Button>
          </div>
        </div>

        <div className="hidden lg:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>STT</TableHead>
                <TableHead>Tên bài học</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Thời lượng</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-muted-foreground"
                  >
                    Đang tải bài học...
                  </TableCell>
                </TableRow>
              ) : paginatedLessons.length ? (
                paginatedLessons.map((lesson) => (
                  <TableRow key={lesson.id}>
                    <TableCell>{lesson.id}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{lesson.title}</p>
                        <p className="max-w-xl text-xs text-muted-foreground">
                          {lesson.description ?? "Chưa có mô tả"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{lesson.contentType}</TableCell>
                    <TableCell>{lesson.duration ?? 0} phút</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link
                            href={`/instructor/courses/${course.id}/lessons/${lesson.id}/edit`}
                          >
                            <PencilLine className="mr-2 h-4 w-4" />
                            Sửa
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => {
                            void handleDelete(lesson.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-muted-foreground"
                  >
                    Không có bài học nào trong danh sách hiện tại.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="space-y-3 lg:hidden">
          {isLoading ? (
            <div className="rounded-2xl border border-border/60 bg-background p-5 text-center text-sm text-muted-foreground">
              Đang tải bài học...
            </div>
          ) : paginatedLessons.length ? (
            paginatedLessons.map((lesson) => (
              <div
                key={lesson.id}
                className="rounded-2xl border border-border/60 bg-background p-4"
              >
                <div className="space-y-2">
                  <p className="text-sm font-semibold">{lesson.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {lesson.description ?? "Chưa có mô tả"}
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>#{lesson.id}</span>
                    <span>{lesson.contentType}</span>
                    <span>{lesson.duration ?? 0} phút</span>
                    <span>{String(lesson.status)}</span>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="flex-1"
                  >
                    <Link
                      href={`/instructor/courses/${course.id}/lessons/${lesson.id}/edit`}
                    >
                      <PencilLine className="mr-2 h-4 w-4" />
                      Sửa
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => {
                      void handleDelete(lesson.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
              Không có bài học nào trong danh sách hiện tại.
            </div>
          )}
        </div>

        {filteredLessons.length > 0 && (
          <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-background p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
            <div className="text-sm text-muted-foreground">
              Hiển thị {(currentPage - 1) * itemsPerPage + 1} đến{" "}
              {Math.min(currentPage * itemsPerPage, filteredLessons.length)} của{" "}
              {filteredLessons.length} bài học
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Trước
              </Button>
              <div className="flex items-center gap-2 px-3 text-sm">
                Trang {currentPage} / {totalPages}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
              >
                Sau
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </ManagementPageShell>
  );
}
