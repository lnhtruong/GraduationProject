"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
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
import { Badge } from "@/components/ui/badge";
import { ManagementPageShell } from "./components/ManagementPageShell";
import {
  useCourseFeed,
  useCourseFeedCandidateVideos,
  useDeleteCourseFeed,
  useInstructorCourseById,
} from "./api/course-management.hooks";
interface Props {
  courseId: number;
}

export default function CourseFeedManagementPage({ courseId }: Props) {
  const { data: course, isLoading: courseLoading } =
    useInstructorCourseById(courseId);
  const { data: feeds, isLoading: feedLoading } = useCourseFeed(courseId);
  const { isLoading: candidateLoading } =
    useCourseFeedCandidateVideos(courseId);

  const deleteFeedMutation = useDeleteCourseFeed();

  const [search, setSearch] = useState("");
  const [pendingDeleteFeed, setPendingDeleteFeed] = useState<{
    id: number;
    title: string;
  } | null>(null);

  const filteredFeeds = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return feeds ?? [];

    return (feeds ?? []).filter((feed) => {
      const text = [feed.title, ...(feed.hashtags ?? []), String(feed.feed_id)]
        .join(" ")
        .toLowerCase();
      return text.includes(query);
    });
  }, [feeds, search]);

  const handleDelete = async (feedId: number) => {
    await deleteFeedMutation.mutateAsync(feedId);
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
            disabled={candidateLoading}
            className="w-full sm:w-auto"
          >
            <Link href={`/instructor/courses/${course.id}/feed/new`}>
              <Plus className="mr-2 h-4 w-4" />
              Thêm feed
            </Link>
          </Button>
        </div>
      }
    >
      <div className="space-y-3 p-3 sm:p-4 lg:p-5">
        <div className="rounded-xl border border-border/60 bg-background p-2.5 sm:p-3">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo tiêu đề, hashtag hoặc feed id..."
          />
        </div>

        <div className="space-y-2.5">
          {feedLoading ? (
            <div className="rounded-xl border border-border/60 bg-background p-5 text-sm text-muted-foreground">
              Đang tải danh sách feed...
            </div>
          ) : filteredFeeds.length ? (
            filteredFeeds.map((feed) => (
              <div
                key={feed.feed_id}
                className="group relative flex flex-col gap-2.5 rounded-xl border border-border/40 bg-card p-2.5 transition-all duration-200 hover:border-primary/30 hover:shadow-md sm:flex-row sm:gap-3 sm:p-3"
              >
                <div className="relative h-44 w-24 shrink-0 overflow-hidden rounded-lg border border-border/50 bg-black shadow-sm">
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
                        void event.currentTarget.play().catch(() => undefined);
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

                  <div className="absolute left-2 top-2">
                    <Badge
                      variant="secondary"
                      className="border-none bg-black/60 px-1.5 py-0 text-[10px] text-white backdrop-blur-md hover:bg-black/60"
                    >
                      {feed.video_type ?? "Feed"}
                    </Badge>
                  </div>
                </div>

                <div className="flex min-w-0 flex-1 flex-col py-0.5">
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
                      <div className="min-w-0 space-y-1">
                        <h3 className="line-clamp-2 text-base font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
                          {feed.title}
                        </h3>
                      </div>

                      <div className="flex w-full items-center gap-2 sm:w-auto sm:shrink-0">
                        <Button
                          asChild
                          variant="secondary"
                          size="sm"
                          className="h-8 flex-1 px-3 sm:flex-none"
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
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
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

                    <div className="flex flex-wrap gap-1.5">
                      {(feed.hashtags ?? []).length ? (
                        (feed.hashtags ?? []).map((tag) => (
                          <Badge
                            key={`${feed.feed_id}-${tag}`}
                            variant="outline"
                            className="bg-muted/30 text-xs font-normal"
                          >
                            #{tag}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs italic text-muted-foreground">
                          Chưa có hashtags
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs font-medium text-muted-foreground sm:mt-3 sm:gap-4">
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
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-border/60 bg-background p-8 text-center text-sm text-muted-foreground">
              Chưa có feed nào cho course này.
            </div>
          )}
        </div>
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
