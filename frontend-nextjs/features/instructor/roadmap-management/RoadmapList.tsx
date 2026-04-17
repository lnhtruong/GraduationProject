"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  Layers3,
  Route,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ManagementPageShell } from "@/features/instructor/course-management/components/ManagementPageShell";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useInstructorRoadmapsPaginated } from "./api/roadmap-management.hooks";

const PAGE_SIZE = 8;

export default function RoadmapList() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  const { data, isLoading } = useInstructorRoadmapsPaginated(
    {
      userId: user?.id,
      page,
      limit: PAGE_SIZE,
      search: debouncedSearch || undefined,
    },
    Boolean(user?.id),
  );

  const roadmaps = data?.data ?? [];
  const pagination = data?.pagination;

  const totalPages = Math.max(1, Number(pagination?.totalPages ?? 1));
  const currentPage = Math.min(page, totalPages);

  return (
    <ManagementPageShell
      title="Quản lý lộ trình"
      description="Quản lý danh sách lộ trình của bạn."
      breadcrumbs={[{ label: "Lộ trình" }]}
      action={
        <Button asChild className="w-full sm:w-auto">
          <Link href="/instructor/roadmaps/new">
            <CirclePlus className="mr-2 h-4 w-4" />
            Tạo lộ trình
          </Link>
        </Button>
      }
    >
      <div className="space-y-4 p-3 sm:space-y-5 sm:p-4 lg:p-5">
        <div className="space-y-4 p-1 sm:p-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Danh sách lộ trình</h2>
            </div>
            <Badge variant="secondary" className="text-xs">
              {pagination?.totalItems ?? roadmaps.length} lộ trình
            </Badge>
          </div>

          <div className="relative w-full lg:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm lộ trình theo tên hoặc mô tả..."
              className="pl-9"
            />
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-28 w-full rounded-2xl" />
              ))}
            </div>
          ) : roadmaps.length ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {roadmaps.map((roadmap) => (
                <Link
                  key={roadmap.id}
                  href={`/instructor/roadmaps/${roadmap.id}`}
                  className="group overflow-hidden rounded-2xl border border-border/40 bg-card shadow-sm transition hover:border-primary/40 hover:shadow-lg"
                >
                  <div className="relative h-28 border-b border-border/40 bg-linear-to-br from-primary/20 via-primary/5 to-transparent">
                    <div className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full bg-black/55 px-2.5 py-1 text-[11px] text-white backdrop-blur-sm">
                      <Layers3 className="h-3.5 w-3.5" />
                      Lộ trình học
                    </div>
                    <div className="absolute bottom-3 right-3 rounded-full bg-background/80 p-2 shadow-sm backdrop-blur-sm">
                      <Route className="h-3.5 w-3.5 text-primary" />
                    </div>
                  </div>

                  <div className="space-y-3 p-5">
                    <h3 className="line-clamp-2 text-base font-semibold leading-tight transition group-hover:text-primary">
                      {roadmap.name}
                    </h3>
                    <p className="line-clamp-2 text-sm font-light text-muted-foreground">
                      {roadmap.description || "Chưa có mô tả"}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 border-t border-border/40 bg-muted/30 px-4 py-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <BookOpen className="h-3.5 w-3.5 text-primary/80" />
                      {Number(roadmap.totalCourses ?? 0)} khóa học
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
              Không có lộ trình phù hợp với từ khóa hiện tại.
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">
            <p className="text-xs text-muted-foreground">
              Trang {currentPage}/{totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Trước
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage >= totalPages}
              >
                Sau
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </ManagementPageShell>
  );
}
