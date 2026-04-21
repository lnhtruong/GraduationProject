"use client";

import { useState, useMemo } from "react";
import { BookCheck, Clock4, XCircle, Search } from "lucide-react";
import { MOCK_LESSONS_BY_COURSE, USE_MOCK } from "../../mock/admin-courses.mock";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminCourseTable } from "./AdminCourseTable";
import { AdminCourseReviewModal } from "./AdminCourseReviewModal";
import {
  useAdminPendingCourses,
  useAdminAllCourses,
  useApproveCourse,
  useRejectCourse,
} from "../../api/admin-courses.hooks";
import type { Course } from "@/features/courses/types";

type LevelFilter = "all" | "Beginner" | "Intermediate" | "Advanced";

export default function AdminCoursesPage() {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);

  const { data: pendingCourses = [], isLoading: isPendingLoading } =
    useAdminPendingCourses();
  const { data: allCourses = [], isLoading: isAllLoading } =
    useAdminAllCourses();

  const approve = useApproveCourse();
  const reject = useRejectCourse();

  const stats = useMemo(() => ({
    pending: pendingCourses.length,
    approved: allCourses.filter((c) => c.status === "approved").length,
    rejected: allCourses.filter((c) => c.status === "rejected").length,
  }), [allCourses, pendingCourses]);

  // Lesson counts per course (mock: build from mock data; real: would be fetched separately)
  const lessonCounts: Record<number, number> = useMemo(() => {
    if (!USE_MOCK) return {};
    return Object.fromEntries(
      Object.entries(MOCK_LESSONS_BY_COURSE).map(([id, lessons]) => [
        Number(id),
        lessons.length,
      ]),
    );
  }, []);

  function applyFilters(list: Course[]) {
    const keyword = search.trim().toLowerCase();
    return list.filter((c) => {
      const bySearch =
        !keyword ||
        c.name.toLowerCase().includes(keyword) ||
        (c.description ?? "").toLowerCase().includes(keyword) ||
        c.categories.some((cat) => cat.toLowerCase().includes(keyword));
      const byLevel = levelFilter === "all" || c.level === levelFilter;
      return bySearch && byLevel;
    });
  }

  const filteredPending = useMemo(
    () => applyFilters(pendingCourses),
    [pendingCourses, search, levelFilter],
  );
  const filteredAll = useMemo(
    () => applyFilters(allCourses),
    [allCourses, search, levelFilter],
  );

  const handleInlineApprove = async (course: Course) => {
    setApprovingId(course.id);
    try {
      await approve.mutateAsync(course.id);
      toast.success(`Đã duyệt: "${course.name}"`);
    } catch {
      toast.error("Duyệt thất bại. Vui lòng thử lại.");
    } finally {
      setApprovingId(null);
    }
  };

  const handleInlineReject = async (course: Course) => {
    setRejectingId(course.id);
    try {
      await reject.mutateAsync(course.id);
      toast.success(`Đã từ chối: "${course.name}"`);
    } catch {
      toast.error("Từ chối thất bại. Vui lòng thử lại.");
    } finally {
      setRejectingId(null);
    }
  };

  return (
    <div className="space-y-6">

      {/* ── Page header ── */}
      <div className="flex items-end justify-between gap-4 border-b border-border/50 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Duyệt khóa học</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Xem xét và phê duyệt khóa học do giảng viên gửi lên
          </p>
        </div>

        {/* Stat chips inline */}
        <div className="flex shrink-0 items-center gap-2">
          <StatChip
            icon={<Clock4 className="h-3.5 w-3.5" />}
            value={stats.pending}
            colorClass="text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400"
            label="chờ"
          />
          <StatChip
            icon={<BookCheck className="h-3.5 w-3.5" />}
            value={stats.approved}
            colorClass="text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400"
            label="duyệt"
          />
          <StatChip
            icon={<XCircle className="h-3.5 w-3.5" />}
            value={stats.rejected}
            colorClass="text-destructive bg-destructive/5 border-destructive/20"
            label="từ chối"
          />
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="pending" className="space-y-4">

        {/* Toolbar row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="h-9 rounded-lg bg-muted/50 p-0.5">
            <TabsTrigger value="pending" className="h-8 gap-2 rounded-md px-4 text-sm">
              Chờ duyệt
              {stats.pending > 0 && (
                <span className="min-w-[18px] rounded-full bg-amber-500 px-1 py-0.5 text-[10px] font-bold leading-none text-white">
                  {stats.pending}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="all" className="h-8 rounded-md px-4 text-sm">
              Tất cả
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm khóa học..."
                className="h-9 w-52 pl-8 text-sm"
              />
            </div>
            <Select
              value={levelFilter}
              onValueChange={(v) => setLevelFilter(v as LevelFilter)}
            >
              <SelectTrigger size="sm" className="h-9 w-32 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả level</SelectItem>
                <SelectItem value="Beginner">Sơ cấp</SelectItem>
                <SelectItem value="Intermediate">Trung cấp</SelectItem>
                <SelectItem value="Advanced">Cao cấp</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tab: pending */}
        <TabsContent value="pending" className="mt-0">
          <div className="overflow-hidden rounded-xl border border-border/60 bg-background shadow-sm">
            <div className="flex items-center justify-between border-b border-border/50 px-5 py-3">
              <span className="text-sm font-semibold">Khóa học chờ duyệt</span>
              <span className="text-xs text-muted-foreground">
                {filteredPending.length} khóa học
              </span>
            </div>
            <AdminCourseTable
              courses={filteredPending}
              isLoading={isPendingLoading}
              showActions
              lessonCounts={lessonCounts}
              approvingId={approvingId}
              rejectingId={rejectingId}
              onApprove={handleInlineApprove}
              onReject={handleInlineReject}
              onViewDetail={setSelectedCourse}
            />
          </div>
        </TabsContent>

        {/* Tab: all */}
        <TabsContent value="all" className="mt-0">
          <div className="overflow-hidden rounded-xl border border-border/60 bg-background shadow-sm">
            <div className="flex items-center justify-between border-b border-border/50 px-5 py-3">
              <span className="text-sm font-semibold">Tất cả khóa học</span>
              <span className="text-xs text-muted-foreground">
                {filteredAll.length} khóa học
              </span>
            </div>
            <AdminCourseTable
              courses={filteredAll}
              isLoading={isAllLoading}
              showActions
              lessonCounts={lessonCounts}
              approvingId={approvingId}
              rejectingId={rejectingId}
              onApprove={handleInlineApprove}
              onReject={handleInlineReject}
              onViewDetail={setSelectedCourse}
            />
          </div>
        </TabsContent>
      </Tabs>

      <AdminCourseReviewModal
        course={selectedCourse}
        open={selectedCourse !== null}
        onClose={() => setSelectedCourse(null)}
      />
    </div>
  );
}

/* ── Helpers ── */

function StatChip({
  icon,
  value,
  colorClass,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  colorClass: string;
  label: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${colorClass}`}
    >
      {icon}
      {value} {label}
    </span>
  );
}
