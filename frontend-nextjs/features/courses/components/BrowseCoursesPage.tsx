"use client";

import { useState, useEffect, useRef } from "react";
import { GraduationCap, Search } from "lucide-react";
import { CourseCard } from "@/features/home/component/CourseCard";
import { useBrowseCourses } from "../api/courseBrowse.hooks";
import type { CourseSort } from "../api/courseBrowse.api";

const LIMIT = 12;
const SEARCH_DEBOUNCE_MS = 400;

const SORT_OPTIONS: { value: CourseSort; label: string }[] = [
  { value: "newest", label: "Mới nhất" },
  { value: "popular", label: "Phổ biến nhất" },
  { value: "rating", label: "Đánh giá cao" },
];

function CourseCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card animate-pulse">
      <div className="aspect-video w-full bg-muted" />
      <div className="p-4 flex flex-col gap-2">
        <div className="h-4 w-3/4 rounded bg-muted" />
        <div className="h-3 w-1/2 rounded bg-muted" />
        <div className="h-3 w-1/3 rounded bg-muted mt-1" />
      </div>
    </div>
  );
}

export function BrowseCoursesPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<CourseSort>("newest");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchInput]);

  const { data, isLoading, isError } = useBrowseCourses({ page, limit: LIMIT, search, sort });

  const courses = data?.courses ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Khám phá khoá học</h1>
        <p className="mt-1 text-muted-foreground">
          Tìm kiếm và khám phá các khoá học AI phù hợp với bạn
        </p>
      </div>

      {/* Search + Sort bar */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm kiếm khoá học..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-4 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value as CourseSort);
            setPage(1);
          }}
          className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-44"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: LIMIT }).map((_, i) => (
            <CourseCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && !isLoading && (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <GraduationCap className="h-16 w-16 text-muted-foreground/40" />
          <p className="text-muted-foreground">
            Không thể tải danh sách khoá học. Vui lòng thử lại.
          </p>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && courses.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <GraduationCap className="h-16 w-16 text-muted-foreground/40" />
          {search ? (
            <p className="text-muted-foreground">
              Không tìm thấy khoá học nào cho &quot;{search}&quot;
            </p>
          ) : (
            <p className="text-muted-foreground">Chưa có khoá học nào.</p>
          )}
        </div>
      )}

      {/* Grid */}
      {!isLoading && !isError && courses.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
                Trước
              </button>
              <span className="text-sm text-muted-foreground">
                Trang {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
                Sau
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
