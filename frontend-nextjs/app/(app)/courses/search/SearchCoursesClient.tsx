"use client";

import { Suspense, useState } from "react";
import { ChevronLeft, ChevronRight, GraduationCap, Inbox, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FilterSidebar } from "@/features/courses/components/FilterSidebar";
import { useSearchCourses } from "@/features/courses/api/courseSearch.hooks";
import { CourseCard } from "@/features/home/component/CourseCard";
import { useQueryParams } from "@/hooks/useQueryParams";

function CourseCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl border border-border/60 bg-card">
      <div className="aspect-video w-full bg-muted" />
      <div className="flex flex-col gap-2 p-4">
        <div className="h-4 w-3/4 rounded bg-muted" />
        <div className="h-3 w-1/2 rounded bg-muted" />
        <div className="mt-1 h-3 w-1/3 rounded bg-muted" />
      </div>
    </div>
  );
}

function SearchResultsContent() {
  const { params, setQueryParams, clearFilters } = useQueryParams();
  const [searchInputValue, setSearchInputValue] = useState(params.q || "");

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
  const categories = data?.categories ?? [];
  const totalItems = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setQueryParams({ q: searchInputValue || undefined, page: 1 });
  };

  const handleClearSearch = () => {
    setSearchInputValue("");
    setQueryParams({ q: undefined, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    setQueryParams({ page: newPage });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-6 md:pb-12 lg:px-8">
      <section className="mb-6 rounded-2xl border border-border/60 bg-card px-4 py-5 shadow-sm sm:px-6 md:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              Khóa học
            </p>
            <h1 className="text-xl font-extrabold tracking-tight text-foreground md:text-2xl">
              {params.q ? `Kết quả cho "${params.q}"` : "Tìm kiếm khóa học"}
            </h1>
          </div>

          <form onSubmit={handleSearchSubmit} className="w-full md:max-w-md">
            <div className="relative flex h-11 items-center rounded-xl border border-border/80 bg-background shadow-xs transition-colors focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/15">
              <Search className="ml-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Tìm khóa học, giảng viên, chủ đề..."
                value={searchInputValue}
                onChange={(event) => setSearchInputValue(event.target.value)}
                className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
              />
              {searchInputValue && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="mr-1 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Xóa tìm kiếm"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <Button type="submit" size="sm" className="mr-1 h-9 rounded-lg px-4">
                Tìm
              </Button>
            </div>
          </form>
        </div>
      </section>

      <div className="flex flex-col items-start gap-6 md:flex-row md:gap-8">
        <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-1/2 z-40 w-[90%] max-w-xs -translate-x-1/2 md:hidden">
          <FilterSidebar
            isMobileTrigger
            categories={categories}
            isLoadingCategories={isLoading}
          />
        </div>

        <FilterSidebar categories={categories} isLoadingCategories={isLoading} />

        <main className="min-w-0 flex-1">
          <div className="mb-6 flex flex-col gap-3 border-b border-border/40 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm font-semibold text-muted-foreground">
              Tìm thấy <span className="font-bold text-primary">{totalItems}</span> kết quả
            </div>
            <div className="flex items-center gap-2">
              <span className="whitespace-nowrap text-xs font-semibold text-muted-foreground">
                Sắp xếp:
              </span>
              <Select
                value={params.sort}
                onValueChange={(sort) => setQueryParams({ sort, page: 1 })}
              >
                <SelectTrigger className="h-9 w-[170px] rounded-lg bg-card text-xs font-semibold">
                  <SelectValue placeholder="Sắp xếp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Mới nhất</SelectItem>
                  <SelectItem value="popular">Phổ biến nhất</SelectItem>
                  <SelectItem value="rating">Đánh giá cao nhất</SelectItem>
                  <SelectItem value="price_asc">Giá thấp đến cao</SelectItem>
                  <SelectItem value="price_desc">Giá cao đến thấp</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 8 }).map((_, index) => (
                <CourseCardSkeleton key={index} />
              ))}
            </div>
          )}

          {isError && !isLoading && (
            <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border/70 bg-card/70 px-6 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                <GraduationCap className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Không thể tải danh sách khóa học</h3>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                  Đã xảy ra lỗi khi kết nối tới máy chủ. Vui lòng tải lại trang hoặc thử lại sau.
                </p>
              </div>
            </div>
          )}

          {!isLoading && !isError && courses.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border/70 bg-card/70 px-6 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Inbox className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Không tìm thấy khóa học phù hợp</h3>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                  Hãy thử đổi từ khóa hoặc xóa bớt bộ lọc để xem nhiều kết quả hơn.
                </p>
              </div>
              <Button variant="outline" onClick={clearFilters} className="rounded-xl">
                Xóa tất cả bộ lọc
              </Button>
            </div>
          )}

          {!isLoading && !isError && courses.length > 0 && (
            <div className="flex flex-col gap-10">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
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

                  {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                    <Button
                      key={page}
                      variant={page === params.page ? "default" : "outline"}
                      onClick={() => handlePageChange(page)}
                      className="h-9 w-9 rounded-lg text-xs font-semibold"
                    >
                      {page}
                    </Button>
                  ))}

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
        </main>
      </div>
    </div>
  );
}

export default function SearchCoursesPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8">
          <div className="h-24 w-full animate-pulse rounded-2xl bg-muted" />
          <div className="flex gap-8">
            <div className="hidden h-96 w-64 animate-pulse rounded-xl bg-muted md:block" />
            <div className="grid flex-1 grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-64 animate-pulse rounded-xl bg-muted" />
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
