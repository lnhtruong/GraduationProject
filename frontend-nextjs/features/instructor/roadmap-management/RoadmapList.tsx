"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  FileClock,
  Pencil,
  Route,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { ManagementPageShell } from "@/features/instructor/course-management/components/ManagementPageShell";
import {
  useDeleteRoadmap,
  useInstructorRoadmapsPaginated,
} from "./api/roadmap-management.hooks";

const ROADMAP_PAGE_SIZE = {
  base: 4,
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
};

function getRoadmapPageSizeForWidth(width: number) {
  if (width >= 1280) return ROADMAP_PAGE_SIZE.xl;
  if (width >= 1024) return ROADMAP_PAGE_SIZE.lg;
  if (width >= 768) return ROADMAP_PAGE_SIZE.md;
  return ROADMAP_PAGE_SIZE.sm;
}

function useResponsiveRoadmapPageSize() {
  const [pageSize, setPageSize] = useState(ROADMAP_PAGE_SIZE.base);

  useEffect(() => {
    const syncPageSize = () => {
      setPageSize(getRoadmapPageSizeForWidth(window.innerWidth));
    };

    syncPageSize();
    window.addEventListener("resize", syncPageSize);
    return () => window.removeEventListener("resize", syncPageSize);
  }, []);

  return pageSize;
}

export default function RoadmapList() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search.trim(), 350);
  const pageSize = useResponsiveRoadmapPageSize();
  const deleteRoadmapMutation = useDeleteRoadmap();

  const { data, isLoading } = useInstructorRoadmapsPaginated(
    {
      userId: user?.id,
      page,
      limit: pageSize,
      search: debouncedSearch || undefined,
    },
    Boolean(user?.id),
  );

  const roadmaps = useMemo(() => data?.data ?? [], [data?.data]);
  const pagination = data?.pagination;
  const totalItems = Number(pagination?.totalItems ?? roadmaps.length);
  const totalPages = Math.max(1, Number(pagination?.totalPages ?? 1));
  const currentPage = Math.min(page, totalPages);
  const showingFrom = totalItems ? (currentPage - 1) * pageSize + 1 : 0;
  const showingTo = totalItems
    ? Math.min(currentPage * pageSize, totalItems)
    : 0;

  const handleDeleteRoadmap = async (roadmapId: number, roadmapName: string) => {
    const confirmed = window.confirm(`Xóa lộ trình "${roadmapName}"?`);

    if (!confirmed) return;

    try {
      await deleteRoadmapMutation.mutateAsync(roadmapId);
      toast.success("Đã xóa lộ trình");
    } catch {
      toast.error("Không thể xóa lộ trình");
    }
  };

  return (
    <ManagementPageShell
      noCard
      title="Lộ trình học"
      description="Tổ chức các khóa học thành đường học rõ ràng để học viên biết nên bắt đầu từ đâu và học tiếp gì."
      breadcrumbs={[{ label: "Lộ trình" }]}
      action={
        <Button asChild size="sm" className="h-10 rounded-xl px-4">
          <Link href="/instructor/roadmaps/new">
            <CirclePlus className="mr-2 h-4 w-4" />
            Tạo lộ trình
          </Link>
        </Button>
      }
    >
      <div className="space-y-5 sm:space-y-6">
        <div className="rounded-2xl border border-border/50 bg-card p-3.5 shadow-xs">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Tìm theo tên lộ trình hoặc mô tả..."
              className="h-12 rounded-xl border-border/80 pl-11 text-base focus-visible:ring-1 focus-visible:ring-primary/20"
            />
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-xs">
          <div className="border-b border-border/50 px-5 py-4">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-primary">
              Danh sách lộ trình
            </p>
            <h2 className="mt-1 text-lg font-bold text-foreground">
              Các lộ trình đang vận hành
            </h2>
          </div>

          <div className="p-4 sm:p-5">
            {isLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: pageSize }).map((_, index) => (
                  <Skeleton
                    key={index}
                    className="h-52 w-full rounded-2xl"
                  />
                ))}
              </div>
            ) : !totalItems && !debouncedSearch ? (
              <Card className="rounded-2xl border-dashed border-border bg-background/80 shadow-xs">
                <CardContent className="flex min-h-72 flex-col items-center justify-center space-y-4 p-6 text-center">
                  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-primary">
                    <Route className="h-8 w-8" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-xl font-bold">
                      Chưa có lộ trình học
                    </h3>
                    <p className="max-w-md text-sm leading-6 text-muted-foreground">
                      Tạo lộ trình để gom các khóa học theo thứ tự học rõ ràng.
                    </p>
                  </div>
                  <Button asChild size="sm" className="rounded-xl">
                    <Link href="/instructor/roadmaps/new">
                      <CirclePlus className="mr-1.5 h-4 w-4" />
                      Tạo lộ trình đầu tiên
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : !roadmaps.length ? (
              <Card className="rounded-2xl border-border bg-background/80 shadow-xs">
                <CardContent className="flex min-h-56 flex-col items-center justify-center space-y-3 p-6 text-center">
                  <div className="rounded-full bg-muted p-3 text-muted-foreground">
                    <FileClock className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground">
                      Không có lộ trình phù hợp
                    </p>
                    <p className="text-sm leading-6 text-muted-foreground">
                      Thử đổi từ khóa tìm kiếm hoặc xóa bộ lọc hiện tại.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg"
                    onClick={() => setSearch("")}
                  >
                    Xóa tìm kiếm
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {roadmaps.map((roadmap) => (
                    <article
                      key={roadmap.id}
                      className="flex min-h-52 flex-col overflow-hidden rounded-2xl border border-border/50 bg-background shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
                    >
                      <div className="flex flex-1 flex-col p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                            <Route className="h-5 w-5" />
                          </div>
                          <div className="flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                            <BookOpen className="h-4 w-4" />
                            {Number(roadmap.totalCourses ?? 0)} khóa học
                          </div>
                        </div>

                        <div className="mt-5 min-w-0 flex-1 space-y-2">
                          <h3 className="line-clamp-2 text-base font-bold leading-snug text-foreground">
                            {roadmap.name}
                          </h3>
                          <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
                            {roadmap.description ||
                              "Chưa có mô tả cho lộ trình này."}
                          </p>
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-2 border-t border-border/60 pt-4">
                          <Button asChild className="h-10 rounded-xl">
                            <Link href={`/instructor/roadmaps/${roadmap.id}`}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Chỉnh sửa
                            </Link>
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="h-10 rounded-xl border-destructive/35 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            disabled={deleteRoadmapMutation.isPending}
                            onClick={() =>
                              void handleDeleteRoadmap(roadmap.id, roadmap.name)
                            }
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Xóa
                          </Button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="mt-5 flex flex-col gap-3 border-t border-border/50 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-sm text-muted-foreground">
                    Hiển thị {showingFrom}-{showingTo} / {totalItems} lộ trình
                  </span>
                  {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-lg"
                        disabled={currentPage <= 1}
                        onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                        aria-label="Trang trước"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="min-w-20 text-center text-sm font-semibold text-muted-foreground">
                        Trang {currentPage}/{totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-lg"
                        disabled={currentPage >= totalPages}
                        onClick={() =>
                          setPage((prev) => Math.min(totalPages, prev + 1))
                        }
                        aria-label="Trang sau"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </ManagementPageShell>
  );
}
