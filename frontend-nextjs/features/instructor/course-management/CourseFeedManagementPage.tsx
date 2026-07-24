"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  Bookmark,
  ChevronLeft,
  Eye,
  Heart,
  Plus,
  PencilLine,
  Trash2,
  VideoOff,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ManagementPageShell } from "./components/ManagementPageShell";
import {
  invalidateCourseFeedCache,
  useCourseFeedPage,
  useDeleteCourseFeed,
  useInstructorCourseById,
} from "./api/course-management.hooks";

type FeedStatusFilter = "all" | "active" | "hidden" | "removed";
const FEED_PAGE_SIZE = 6;

function getVisiblePages(page: number, totalPages: number): number[] {
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const end = Math.min(totalPages, start + 4);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

interface Props {
  courseId: number;
}

export default function CourseFeedManagementPage({ courseId }: Props) {
  const queryClient = useQueryClient();
  const { data: course, isLoading: courseLoading } =
    useInstructorCourseById(courseId);
  const [statusFilter, setStatusFilter] = useState<FeedStatusFilter>("all");
  const [page, setPage] = useState(1);
  const { data: feedPage, isLoading: feedLoading } = useCourseFeedPage(
    courseId,
    true,
    {
      page,
      pageSize: FEED_PAGE_SIZE,
      sortBy: "created_at",
      order: "desc",
      status: statusFilter === "all" ? undefined : statusFilter,
    },
  );
  const deleteFeedMutation = useDeleteCourseFeed();

  const [search, setSearch] = useState("");
  const [pendingDeleteFeed, setPendingDeleteFeed] = useState<{
    id: number;
    title: string;
  } | null>(null);

  const feeds = useMemo(() => feedPage?.data ?? [], [feedPage?.data]);
  const pagination = feedPage?.pagination ?? {
    page,
    pageSize: FEED_PAGE_SIZE,
    total: 0,
    totalPages: 0,
  };

  const filteredFeeds = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return feeds;

    return feeds.filter((feed) => {
      const text = [
        feed.title,
        feed.caption ?? "",
        ...(feed.hashtags ?? []),
        String(feed.feed_id),
      ]
        .join(" ")
        .toLowerCase();
      return text.includes(query);
    });
  }, [feeds, search]);

  const stats = useMemo(() => {
    const source = feeds;
    return {
      total: pagination.total,
      views: source.reduce(
        (sum, item) => sum + Number(item.stats?.views ?? 0),
        0,
      ),
      likes: source.reduce(
        (sum, item) => sum + Number(item.stats?.likes ?? 0),
        0,
      ),
      saves: source.reduce(
        (sum, item) => sum + Number(item.stats?.saves ?? 0),
        0,
      ),
    };
  }, [feeds, pagination.total]);

  const pageStart =
    pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
  const pageEnd = Math.min(
    pagination.page * pagination.pageSize,
    pagination.total,
  );

  const handleDelete = async (feedId: number) => {
    await deleteFeedMutation.mutateAsync(feedId);
    await invalidateCourseFeedCache(queryClient, courseId);
    toast.success("Đã xóa feed");
    setPendingDeleteFeed(null);
  };

  if (courseLoading) {
    return (
      <ManagementPageShell
        title="Đang tải feed..."
        description="Lấy thông tin course feed từ backend"
        breadcrumbs={[
          { label: "Quản lý khóa học", href: "/instructor/courses" },
          { label: "Quản lý feed" },
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
        description="Vui lòng quay lại danh sách khóa học"
        breadcrumbs={[
          { label: "Quản lý khóa học", href: "/instructor/courses" },
          { label: "Quản lý feed" },
        ]}
      >
        <div className="p-4 text-sm text-muted-foreground sm:p-5">
          Khóa học không hợp lệ.
        </div>
      </ManagementPageShell>
    );
  }

  return (
    <ManagementPageShell
      title={`Feed của ${course.name}`}
      description="Quản lý feed theo từng course: thêm video vào feed, sửa metadata feed và xóa feed item."
      breadcrumbs={[
        { label: "Quản lý khóa học", href: "/instructor/courses" },
        { label: course.name, href: `/instructor/courses/${course.id}` },
        { label: "Quản lý feed" },
      ]}
      action={
        <div className="grid w-full gap-2 sm:flex sm:w-auto sm:flex-wrap">
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href={`/instructor/courses/${course.id}`}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Về course
            </Link>
          </Button>
          <Button
            asChild
            className="w-full sm:w-auto"
          >
            <Link href={`/instructor/courses/${course.id}/feed/new`}>
              <Plus className="mr-2 h-4 w-4" />
              Thêm feed
            </Link>
          </Button>
        </div>
      }
      noCard
    >
      <div className="space-y-4 py-3 sm:py-4 lg:py-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex min-h-24 flex-col justify-between rounded-xl border border-border/60 bg-background p-4 shadow-sm">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              Tổng feed
            </p>
            <p className="mt-1 text-xl font-semibold">{stats.total}</p>
          </div>
          <div className="flex min-h-24 flex-col justify-between rounded-xl border border-border/60 bg-background p-4 shadow-sm">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              Tổng lượt xem
            </p>
            <p className="mt-1 inline-flex items-center gap-1 text-xl font-semibold">
              <Eye className="h-4 w-4" />
              {stats.views}
            </p>
          </div>
          <div className="flex min-h-24 flex-col justify-between rounded-xl border border-border/60 bg-background p-4 shadow-sm">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              Tổng lượt thích
            </p>
            <p className="mt-1 inline-flex items-center gap-1 text-xl font-semibold">
              <Heart className="h-4 w-4" />
              {stats.likes}
            </p>
          </div>
          <div className="flex min-h-24 flex-col justify-between rounded-xl border border-border/60 bg-background p-4 shadow-sm">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              Tổng lượt lưu
            </p>
            <p className="mt-1 inline-flex items-center gap-1 text-xl font-semibold">
              <Bookmark className="h-4 w-4" />
              {stats.saves}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-background p-3 shadow-sm sm:p-4">
          <div className="grid gap-2.5 lg:grid-cols-[minmax(0,1fr)_280px]">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm theo tiêu đề, hashtag hoặc feed id..."
              className="h-11"
            />
            <select
              className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as FeedStatusFilter);
                setPage(1);
              }}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Active</option>
              <option value="hidden">Hidden</option>
              <option value="removed">Removed</option>
            </select>
          </div>
        </div>

        <div className="space-y-2.5">
          {feedLoading ? (
            <div className="rounded-xl border border-border/60 bg-background p-5 text-sm text-muted-foreground">
              Đang tải danh sách feed...
            </div>
          ) : filteredFeeds.length ? (
            <div className="grid gap-3 xl:grid-cols-2">
              {filteredFeeds.map((feed) => (
                <div
                  key={feed.feed_id}
                  className="group relative flex min-w-0 flex-col overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm transition-all duration-200 hover:border-primary/35 hover:shadow-md sm:flex-row"
                >
                  <div className="relative aspect-video w-full shrink-0 overflow-hidden bg-black sm:aspect-[4/5] sm:w-28 md:w-32 xl:w-28 2xl:w-32">
                    {feed.video?.url ? (
                      <video
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        src={feed.video.url}
                        poster={feed.video.thumbnail ?? undefined}
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        onMouseEnter={(event) => {
                          void event.currentTarget
                            .play()
                            .catch(() => undefined);
                        }}
                        onMouseLeave={(event) => {
                          event.currentTarget.pause();
                          event.currentTarget.currentTime = 0;
                        }}
                      >
                        Trình duyệt không hỗ trợ phát video.
                      </video>
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center bg-muted text-muted-foreground">
                        <VideoOff className="mb-2 h-6 w-6 opacity-50" />
                        <span className="text-[10px]">No video</span>
                      </div>
                    )}

                  </div>

                  <div className="flex min-w-0 flex-1 flex-col justify-between gap-2.5 p-3">
                    <div className="space-y-2.5">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <h3 className="line-clamp-2 text-base font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
                            {feed.title}
                          </h3>
                          {feed.caption?.trim() ? (
                            <p className="line-clamp-3 text-sm text-muted-foreground">
                              {feed.caption}
                            </p>
                          ) : null}
                        </div>

                        <div className="flex w-full items-center gap-2 md:w-auto md:shrink-0">
                          <Button
                            asChild
                            variant="secondary"
                            size="sm"
                            className="h-9 flex-1 border border-transparent px-3 transition-all hover:border-primary/35 hover:bg-primary/10 hover:text-primary hover:shadow-sm md:flex-none"
                          >
                            <Link
                              href={`/instructor/courses/${course.id}/feed/${feed.feed_id}/edit`}
                            >
                              <PencilLine className="mr-2 h-3.5 w-3.5" />
                              Sửa
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => {
                              setPendingDeleteFeed({
                                id: feed.feed_id,
                                title: feed.title,
                              });
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex min-h-6 flex-wrap gap-1.5">
                        {(feed.hashtags ?? []).length ? (
                          (feed.hashtags ?? []).map((tag) => (
                            <span
                              key={`${feed.feed_id}-${tag}`}
                              className="rounded-full border border-border/60 bg-muted/30 px-2 py-0.5 text-xs font-normal text-muted-foreground"
                            >
                              #{tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs italic text-muted-foreground">
                            Chưa có hashtags
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 border-t border-border/50 pt-2.5 text-xs font-medium text-muted-foreground sm:gap-4">
                      <div className="flex items-center gap-1.5">
                        <Eye className="h-4 w-4" />
                        {feed.stats?.views ?? 0} lượt xem
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Heart className="h-4 w-4" />
                        {feed.stats?.likes ?? 0} thích
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Bookmark className="h-4 w-4" />
                        {feed.stats?.saves ?? 0} lưu
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border/60 bg-background p-8 text-center text-sm text-muted-foreground">
              <BarChart3 className="mx-auto mb-3 h-7 w-7 opacity-60" />
              Chưa có feed nào cho course này.
            </div>
          )}
        </div>

        {pagination.totalPages > 1 ? (
          <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-background px-3 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <p className="text-xs text-muted-foreground">
              Hiển thị {pageStart}-{pageEnd} / {pagination.total} feed
            </p>
            <Pagination className="mx-0 w-auto justify-start sm:justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    aria-disabled={pagination.page <= 1 || feedLoading}
                    className={
                      pagination.page <= 1 || feedLoading
                        ? "pointer-events-none opacity-50"
                        : undefined
                    }
                    onClick={(event) => {
                      event.preventDefault();
                      if (pagination.page > 1 && !feedLoading) {
                        setPage((current) => Math.max(1, current - 1));
                      }
                    }}
                  />
                </PaginationItem>

                {getVisiblePages(pagination.page, pagination.totalPages).map(
                  (pageNumber) => (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        href="#"
                        isActive={pageNumber === pagination.page}
                        onClick={(event) => {
                          event.preventDefault();
                          if (!feedLoading) {
                            setPage(pageNumber);
                          }
                        }}
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  ),
                )}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    aria-disabled={
                      pagination.page >= pagination.totalPages || feedLoading
                    }
                    className={
                      pagination.page >= pagination.totalPages || feedLoading
                        ? "pointer-events-none opacity-50"
                        : undefined
                    }
                    onClick={(event) => {
                      event.preventDefault();
                      if (pagination.page < pagination.totalPages && !feedLoading) {
                        setPage((current) =>
                          Math.min(pagination.totalPages, current + 1),
                        );
                      }
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        ) : null}
      </div>

      <AlertDialog
        open={Boolean(pendingDeleteFeed)}
        onOpenChange={(open) => {
          if (!open && !deleteFeedMutation.isPending) {
            setPendingDeleteFeed(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa feed</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa feed{" "}
              <span className="font-medium text-foreground">
                {pendingDeleteFeed?.title || "này"}
              </span>
              ? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteFeedMutation.isPending}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteFeedMutation.isPending}
              onClick={(event) => {
                event.preventDefault();
                if (!pendingDeleteFeed) {
                  return;
                }
                void handleDelete(pendingDeleteFeed.id);
              }}
            >
              {deleteFeedMutation.isPending ? "Đang xóa..." : "Xóa feed"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ManagementPageShell>
  );
}
