"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import {
  MessageCircleQuestion,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { DiscussionStats } from "./DiscussionStats";
import { QuestionCard } from "./QuestionCard";
import type { DiscussionStatus, DiscussionSort, QuestionItem } from "../types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FilterOption {
  value: string;
  label: string;
  bold?: boolean;
}

export interface SecondaryFilterConfig {
  /** Lucide icon to display */
  icon: LucideIcon;
  /** Label shown in the mobile Sheet */
  sheetLabel: string;
  /** Placeholder text for the trigger */
  placeholder: string;
  /** Fixed width on desktop, e.g. "w-[200px]" */
  desktopWidth: string;
  /** Currently selected value */
  value: string;
  /** Called with the new raw value (caller decides how to map it) */
  onChange: (val: string) => void;
  options: FilterOption[];
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface QAWorkspaceShellProps {
  // ── Header ──────────────────────────────────────────────────────────────────
  title: string;
  description?: string;
  /** Breadcrumbs rendered inside the header card, above the title */
  breadcrumbs?: BreadcrumbItem[];

  // ── Stats ───────────────────────────────────────────────────────────────────
  totalCount: number;
  unansweredCount: number;
  answeredCount: number;
  status: DiscussionStatus | undefined;
  onStatusChange: (status: DiscussionStatus | undefined) => void;

  // ── Filter bar ──────────────────────────────────────────────────────────────
  searchQuery: string;
  onSearchChange: (q: string) => void;
  secondaryFilter: SecondaryFilterConfig;
  sort: DiscussionSort;
  onSortChange: (val: string) => void;

  // ── Feed ────────────────────────────────────────────────────────────────────
  isLoading: boolean;
  isError: boolean;
  onRefetch: () => void;
  questions: QuestionItem[];
  /** courseId passed to each QuestionCard (undefined = all-courses view) */
  questionCourseId?: number;
  /** Whether any filter is active — used for "clear filters" button */
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  /** Label displayed in section header */
  feedLabel?: string;

  // ── Pagination ──────────────────────────────────────────────────────────────
  page: number;
  totalPages: number;
  totalQuestions: number;
  onPageChange: (page: number) => void;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function FeedSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border/50 bg-card p-4 shadow-xs dark:bg-card/90">
          <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-4 w-20 rounded" />
          </div>
          <div className="mt-3 flex gap-3">
            <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-36" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function QAWorkspaceShell({
  title,
  description,
  breadcrumbs,
  totalCount,
  unansweredCount,
  answeredCount,
  status,
  onStatusChange,
  searchQuery,
  onSearchChange,
  secondaryFilter,
  sort,
  onSortChange,
  isLoading,
  isError,
  onRefetch,
  questions,
  questionCourseId,
  hasActiveFilters,
  onClearFilters,
  feedLabel,
  page,
  totalPages,
  totalQuestions,
  onPageChange,
}: QAWorkspaceShellProps) {
  const SecondaryIcon = secondaryFilter.icon;
  const hasFilterActive =
    secondaryFilter.value !== "all" || sort !== "newest";

  const sortOptions: FilterOption[] = [
    { value: "newest", label: "Mới nhất" },
    { value: "upvotes", label: "Hữu ích nhất" },
    { value: "active", label: "Sôi nổi nhất" },
  ];

  const sectionTitle =
    feedLabel ??
    (status === "unanswered"
      ? "Các câu hỏi chờ phản hồi"
      : status === "answered"
        ? "Các câu hỏi đã phản hồi"
        : "Toàn bộ thảo luận từ học viên");

  return (
    <div className="space-y-4 sm:space-y-5 pb-12">
      {/* ── Header Card (breadcrumb + title + stats in one card) ──────────── */}
      <Card className="border-border/50 bg-card shadow-xs rounded-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-primary/5 blur-2xl" />
        <CardContent className="space-y-4 p-4 sm:p-6 relative">
          {/* Breadcrumbs — only rendered when provided (course Q&A) */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
              {breadcrumbs.map((item, i) => (
                <span key={`${item.label}-${i}`} className="inline">
                  {i > 0 && <span className="mx-1.5 opacity-50 select-none">›</span>}
                  {item.href ? (
                    <Link href={item.href} className="hover:text-foreground transition-colors">
                      {item.label}
                    </Link>
                  ) : (
                    <span className="font-medium text-foreground/80">{item.label}</span>
                  )}
                </span>
              ))}
            </nav>
          )}
          <div>
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            {description && (
              <p className="hidden sm:block mt-1 max-w-xl text-xs text-muted-foreground leading-relaxed">
                {description}
              </p>
            )}
          </div>
          <DiscussionStats
            totalCount={totalCount}
            unansweredCount={unansweredCount}
            answeredCount={answeredCount}
            status={status}
            onStatusChange={onStatusChange}
          />
        </CardContent>
      </Card>

      {/* ── Filter Bar ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        {/* Search — grows to fill all available space */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm kiếm thảo luận..."
            className="pl-9 h-9 border-zinc-200 focus-visible:ring-1 focus-visible:ring-primary/20 rounded-lg text-xs dark:border-zinc-800 bg-background"
          />
        </div>

        {/* Mobile: single Filter icon → bottom Sheet */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "sm:hidden h-9 w-9 shrink-0 rounded-lg border-zinc-200 dark:border-zinc-800",
                hasFilterActive && "border-primary/50 text-primary",
              )}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-8">
            <SheetHeader className="mb-4">
              <SheetTitle className="text-sm font-bold">Bộ lọc</SheetTitle>
            </SheetHeader>
            <div className="space-y-5">
              {/* Secondary filter (course / lesson) */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {secondaryFilter.sheetLabel}
                </p>
                <Select value={secondaryFilter.value} onValueChange={secondaryFilter.onChange}>
                  <SelectTrigger className="h-10 w-full rounded-xl text-sm border-zinc-200 dark:border-zinc-800">
                    <SecondaryIcon className="mr-2 h-4 w-4 text-muted-foreground/80 shrink-0" />
                    <SelectValue placeholder={secondaryFilter.placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {secondaryFilter.options.map((opt) => (
                      <SelectItem
                        key={opt.value}
                        value={opt.value}
                        className={cn("text-sm", opt.bold && "font-semibold")}
                      >
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort filter */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Sắp xếp
                </p>
                <Select value={sort} onValueChange={onSortChange}>
                  <SelectTrigger className="h-10 w-full rounded-xl text-sm border-zinc-200 dark:border-zinc-800">
                    <SlidersHorizontal className="mr-2 h-4 w-4 text-muted-foreground/80 shrink-0" />
                    <SelectValue placeholder="Sắp xếp" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-sm">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Desktop: inline selects (hidden on mobile) */}
        <div className="hidden sm:flex items-center gap-2">
          <Select value={secondaryFilter.value} onValueChange={secondaryFilter.onChange}>
            <SelectTrigger
              className={cn(
                "h-9 rounded-lg text-xs font-medium border-zinc-200 bg-background dark:border-zinc-800 text-zinc-700 dark:text-zinc-300",
                secondaryFilter.desktopWidth,
              )}
            >
              <SecondaryIcon className="mr-1.5 h-3.5 w-3.5 text-muted-foreground/80 shrink-0" />
              <SelectValue placeholder={secondaryFilter.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {secondaryFilter.options.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  className={cn("text-xs", opt.bold && "font-semibold")}
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={onSortChange}>
            <SelectTrigger className="h-9 w-[140px] rounded-lg text-xs font-medium border-zinc-200 bg-background dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">
              <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5 text-muted-foreground/80 shrink-0" />
              <SelectValue placeholder="Sắp xếp" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Feed Section ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-xl border border-border/50 bg-linear-to-br from-background via-card to-primary/5 shadow-xs">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-16 top-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute right-0 top-24 h-32 w-32 rounded-full bg-amber-400/10 blur-3xl" />
        </div>

        {/* Section Header */}
        <div className="relative border-b border-border/40 px-4 py-2.5 bg-card/40">
          <p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-primary">
            Danh sách thảo luận
          </p>
          <h2 className="mt-0.5 text-xs sm:text-sm font-bold text-foreground">
            {sectionTitle}
          </h2>
        </div>

        {/* Content */}
        <div className="relative p-3 sm:p-4">
          {isLoading ? (
            <FeedSkeleton />
          ) : isError ? (
            <div className="flex min-h-[180px] flex-col items-center justify-center gap-2.5 rounded-xl border border-dashed border-destructive/40 bg-destructive/5 p-6 text-center dark:bg-destructive/10">
              <AlertCircle className="h-9 w-9 text-destructive/80" />
              <p className="text-sm font-bold text-foreground">Không thể tải danh sách thảo luận</p>
              <Button variant="outline" size="sm" className="mt-1 rounded-lg font-semibold shadow-xs text-xs h-8" onClick={onRefetch}>
                Thử lại ngay
              </Button>
            </div>
          ) : questions.length === 0 ? (
            <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/80 bg-card/40 p-6 text-center dark:bg-card/20">
              <div className="rounded-full bg-muted/50 p-3 dark:bg-muted/30">
                <MessageCircleQuestion className="h-8 w-8 text-muted-foreground/60" />
              </div>
              <div className="max-w-md">
                <p className="text-sm font-bold text-foreground">
                  {searchQuery
                    ? `Không tìm thấy câu hỏi khớp với "${searchQuery}"`
                    : status === "unanswered"
                      ? "Không còn câu hỏi nào tồn đọng 🎉"
                      : "Chưa có câu hỏi thảo luận nào từ học viên"}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {searchQuery
                    ? "Hãy thử tìm với từ khóa khác hoặc xóa bộ lọc."
                    : "Mọi thắc mắc của học viên sẽ được tập hợp tại đây."}
                </p>
              </div>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" className="mt-1 rounded-lg text-xs font-semibold shadow-xs h-8" onClick={onClearFilters}>
                  Xóa bộ lọc
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {questions.map((q) => (
                <QuestionCard key={q.id} question={q} courseId={questionCourseId} />
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-border/40 bg-card/40 px-4 py-2.5 sm:flex-row">
            <span className="text-[11px] font-medium text-muted-foreground">
              Trang <strong className="text-foreground">{page}</strong> /{" "}
              <strong className="text-foreground">{totalPages}</strong> ({totalQuestions} thảo luận)
            </span>
            <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1 rounded-lg px-2.5 text-xs font-semibold justify-center w-full sm:w-auto"
                disabled={page <= 1 || isLoading}
                onClick={() => onPageChange(Math.max(1, page - 1))}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1 rounded-lg px-2.5 text-xs font-semibold justify-center w-full sm:w-auto"
                disabled={page >= totalPages || isLoading}
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              >
                Tiếp
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
