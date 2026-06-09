"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { FilterSidebar } from "@/features/courses/components/FilterSidebar";
import {
  useSearchCourses,
  useCourseCategories,
} from "@/features/courses/api/courseSearch.hooks";
import { useQueryParams } from "@/hooks/useQueryParams";
import { CourseCard } from "@/features/home/component/CourseCard";
import {
  GraduationCap,
  Inbox,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

function CourseCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card animate-pulse">
      <div className="aspect-video w-full bg-muted" />
      <div className="p-4 flex flex-col gap-2">
        <div className="h-4 w-3/4 rounded bg-muted" />
        <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
        <div className="h-3 w-1/3 rounded bg-muted mt-1" />
      </div>
    </div>
  );
}

function SearchResultsContent() {
  const { params, setQueryParams, clearFilters } = useQueryParams();

  // Call API categories to resolve active badge names
  const { data: categories = [] } = useCourseCategories();

  // Local state for in-page search input
  const [searchInputValue, setSearchInputValue] = useState(params.q || "");

  // Sync search input with URL query param changes
  useEffect(() => {
    setSearchInputValue(params.q || "");
  }, [params.q]);

  // Call API search with parsed query parameters
  const { data, isLoading, isError } = useSearchCourses({
    q: params.q || undefined,
    categoryIds: params.categoryIds.length > 0 ? params.categoryIds : undefined,
    level: params.level || undefined,
    minPrice: params.minPrice > 0 ? params.minPrice : undefined,
    maxPrice: params.maxPrice < 5000000 ? params.maxPrice : undefined,
    minRating: params.minRating > 0 ? params.minRating : undefined,
    sort: params.sort || undefined,
    page: params.page,
    limit: 12,
  });

  const courses = data?.courses ?? [];
  const totalItems = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  // Active filter count
  const activeFiltersCount =
    params.categoryIds.length +
    (params.level && params.level !== "all" ? 1 : 0) +
    (params.minPrice > 0 || params.maxPrice < 5000000 ? 1 : 0) +
    (params.minRating > 0 ? 1 : 0);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQueryParams({ q: searchInputValue || undefined, page: 1 });
  };

  const handleClearSearch = () => {
    setSearchInputValue("");
    setQueryParams({ q: undefined, page: 1 });
  };

  const handleSortChange = (newSort: string) => {
    setQueryParams({ sort: newSort, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    setQueryParams({ page: newPage });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12">
      {/* 1. Premium Compact Search Header using Theme Colors */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-primary/5 via-card to-accent/5 py-5 px-6 md:py-6 md:px-8 mb-6 border border-border/40 shadow-xs">
        {/* Glow decorative elements using system variables */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 rounded-full bg-accent/8 blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-foreground leading-tight">
              {params.q ? `Kết quả cho "${params.q}"` : "Tìm kiếm khóa học"}
            </h1>
          </div>

          <div className="w-full md:max-w-md">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Tìm khóa học (ví dụ: Python, Thiết kế...)"
                  value={searchInputValue}
                  onChange={(e) => setSearchInputValue(e.target.value)}
                  className="w-full h-10 pl-10 pr-32 bg-card text-foreground placeholder-muted-foreground rounded-xl border border-border/80 focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none text-xs sm:text-sm transition-all shadow-2xs"
                />
                <span className="absolute left-3.5 text-muted-foreground/50">
                  <Search className="h-4 w-4" />
                </span>
                {searchInputValue && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-26 p-1 rounded-full text-muted-foreground/50 hover:bg-muted/60 hover:text-foreground transition-colors"
                    aria-label="Xóa tìm kiếm"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
                <Button
                  type="submit"
                  size="sm"
                  className="absolute right-1 h-8 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 text-xs shadow-2xs transition-all active:scale-[0.98]"
                >
                  Tìm kiếm
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Main Layout: 2 Columns */}
      <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
        {/* 3. Mobile Sticky Filter Trigger */}
        <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-xs z-40">
          <FilterSidebar isMobileTrigger={true} />
        </div>

        {/* Desktop Filter Sidebar */}
        <FilterSidebar />

        {/* Results Grid Side */}
        <div className="flex-1 w-full">
          {/* Top Results Header and Sorting Bar */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/40 pb-4">
            <div className="text-sm font-semibold text-muted-foreground">
              Tìm thấy{" "}
              <span className="text-primary font-bold">{totalItems}</span> kết
              quả
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                Sắp xếp theo:
              </span>
              <Select value={params.sort} onValueChange={handleSortChange}>
                <SelectTrigger className="w-[160px] h-9 text-xs font-semibold rounded-lg bg-card/60 backdrop-blur-xs border-border/60">
                  <SelectValue placeholder="Sắp xếp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest" className="text-xs">
                    Mới nhất
                  </SelectItem>
                  <SelectItem value="popular" className="text-xs">
                    Phổ biến nhất
                  </SelectItem>
                  <SelectItem value="rating" className="text-xs">
                    Đánh giá cao nhất
                  </SelectItem>
                  <SelectItem value="price_asc" className="text-xs">
                    Giá thấp → cao
                  </SelectItem>
                  <SelectItem value="price_desc" className="text-xs">
                    Giá cao → thấp
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* Loading state */}
          {isLoading && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <CourseCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Error State */}
          {isError && !isLoading && (
            <div className="flex flex-col items-center justify-center gap-5 py-20 px-6 text-center border border-dashed border-border/50 rounded-3xl bg-card/50 backdrop-blur-xs">
              <div className="h-16 w-16 rounded-2xl bg-linear-to-br from-destructive/10 to-destructive/5 flex items-center justify-center text-destructive mb-2 shadow-inner">
                <GraduationCap className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-foreground">
                  Không thể tải danh sách khóa học
                </h3>
                <p className="mt-2 text-muted-foreground max-w-sm text-sm leading-relaxed">
                  Đã xảy ra lỗi khi kết nối tới máy chủ. Vui lòng tải lại trang
                  hoặc thử lại sau.
                </p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !isError && courses.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-5 py-20 px-6 text-center border border-dashed border-border/50 rounded-3xl bg-card/50 backdrop-blur-xs shadow-2xs">
              <div className="h-16 w-16 rounded-2xl bg-linear-to-br from-accent/10 to-primary/10 flex items-center justify-center text-primary mb-2 shadow-inner">
                <Inbox className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-foreground">
                  Không tìm thấy khóa học phù hợp
                </h3>
                {params.q ? (
                  <p className="mt-2 text-muted-foreground max-w-sm text-sm leading-relaxed">
                    Không tìm thấy kết quả nào cho &quot;
                    <span className="font-semibold text-foreground">
                      {params.q}
                    </span>
                    &quot;. Bạn hãy thử đổi từ khóa khác hoặc xóa bớt bộ lọc
                    nhé.
                  </p>
                ) : (
                  <p className="mt-2 text-muted-foreground max-w-sm text-sm leading-relaxed">
                    Không tìm thấy khóa học nào khớp với các tiêu chí bộ lọc của
                    bạn. Thử xóa bớt bộ lọc để hiển thị nhiều kết quả hơn?
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                onClick={clearFilters}
                className="mt-2 rounded-xl font-semibold px-5 border-dashed border-primary/40 text-primary hover:bg-primary/5 transition-all"
              >
                Xóa tất cả bộ lọc
              </Button>
            </div>
          )}

          {/* Results Grid */}
          {!isLoading && !isError && courses.length > 0 && (
            <div className="flex flex-col gap-10">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1.5 pt-4">
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={params.page === 1}
                    onClick={() => handlePageChange(params.page - 1)}
                    className="h-9 w-9 rounded-lg"
                    aria-label="Trang trước"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (p) => {
                      const isCurrent = p === params.page;

                      return (
                        <Button
                          key={p}
                          variant={isCurrent ? "default" : "outline"}
                          onClick={() => handlePageChange(p)}
                          className={`h-9 w-9 text-xs font-semibold rounded-lg ${
                            isCurrent
                              ? "bg-primary text-primary-foreground shadow-md"
                              : ""
                          }`}
                        >
                          {p}
                        </Button>
                      );
                    },
                  )}

                  <Button
                    variant="outline"
                    size="icon"
                    disabled={params.page >= totalPages}
                    onClick={() => handlePageChange(params.page + 1)}
                    className="h-9 w-9 rounded-lg"
                    aria-label="Trang tiếp"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchCoursesPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          <div className="h-20 w-1/3 animate-pulse rounded-lg bg-muted" />
          <div className="flex gap-8">
            <div className="h-96 w-64 hidden md:block animate-pulse rounded-lg bg-muted" />
            <div className="flex-1 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-64 rounded-lg bg-muted animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>
      }
    >
      <SearchResultsContent />
    </Suspense>
  );
}
