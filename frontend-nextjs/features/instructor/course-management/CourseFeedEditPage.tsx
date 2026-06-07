"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  Heart,
  Loader2,
  Plus,
  Sparkles,
  Tag,
  Video,
  X,
  MessageCircle,
  Bookmark,
  Share2,
  NotebookText,
  Clapperboard,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { ManagementPageShell } from "./components/ManagementPageShell";
import { HighlightUploadDialog } from "./components/HighlightUploadDialog";
import {
  useCourseFeed,
  useCourseFeedById,
  useInstructorCourseById,
  useUpdateCourseFeed,
} from "./api/course-management.hooks";

interface Props {
  courseId: number;
  feedId: number;
}

function parseHashtagTokens(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeCaption(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

export default function CourseFeedEditPage({ courseId, feedId }: Props) {
  const router = useRouter();
  const { data: course, isLoading: courseLoading } =
    useInstructorCourseById(courseId);
  const { data: feedDetail, isLoading: feedDetailLoading } =
    useCourseFeedById(feedId);
  const { data: feeds, isLoading: feedListLoading } = useCourseFeed(courseId);
  const updateFeedMutation = useUpdateCourseFeed();

  const feed = useMemo(() => {
    if (feedDetail?.feed_id) {
      return feedDetail;
    }

    return (feeds ?? []).find((item) => item.feed_id === feedId) ?? null;
  }, [feedDetail, feeds, feedId]);

  const [titleDraft, setTitleDraft] = useState<string | null>(null);
  const [captionDraft, setCaptionDraft] = useState<string | null>(null);
  const [hashtagsDraft, setHashtagsDraft] = useState<string[] | null>(null);
  const [hashtagDraft, setHashtagDraft] = useState("");
  const [isHighlightUploadOpen, setIsHighlightUploadOpen] = useState(false);

  const isFeedLoading = feedDetailLoading || feedListLoading;
  const isReady = !courseLoading && !isFeedLoading && Boolean(course && feed);

  const title = titleDraft ?? feed?.title ?? "";
  const caption = captionDraft ?? feed?.caption ?? "";
  const hashtags = hashtagsDraft ?? feed?.hashtags ?? [];

  const addHashtags = (rawValue: string) => {
    const nextItems = parseHashtagTokens(rawValue);
    if (!nextItems.length) {
      return;
    }

    const normalized = new Set(
      hashtags.map((item) => item.trim().toLowerCase()),
    );
    const merged = [...hashtags];

    nextItems.forEach((item) => {
      const key = item.toLowerCase();
      if (!normalized.has(key)) {
        normalized.add(key);
        merged.push(item);
      }
    });

    setHashtagsDraft(merged);
    setHashtagDraft("");
  };

  const handleUpdate = async () => {
    if (!feed) {
      return;
    }
    if (!title.trim()) {
      toast.error("Vui lòng nhập tiêu đề");
      return;
    }

    await updateFeedMutation.mutateAsync({
      id: feed.feed_id,
      data: {
        title: title.trim(),
        caption: normalizeCaption(caption),
        hashtags,
      },
    });

    toast.success("Đã cập nhật feed");
    router.push(`/instructor/courses/${courseId}/feed`);
    router.refresh();
  };

  if (courseLoading || isFeedLoading) {
    return (
      <ManagementPageShell
        title="Đang tải feed..."
        description="Lấy dữ liệu feed để chỉnh sửa"
        breadcrumbs={[
          { label: "Quản lý khóa học", href: "/instructor/courses" },
          {
            label: "Quản lý feed",
            href: `/instructor/courses/${courseId}/feed`,
          },
          { label: "Sửa feed" },
        ]}
      >
        <div className="p-4 text-sm text-muted-foreground sm:p-5">
          Đang tải...
        </div>
      </ManagementPageShell>
    );
  }

  if (!course || !feed) {
    return (
      <ManagementPageShell
        title="Không tìm thấy feed"
        description="Feed không tồn tại hoặc đã bị xóa"
        breadcrumbs={[
          { label: "Quản lý khóa học", href: "/instructor/courses" },
          {
            label: "Quản lý feed",
            href: `/instructor/courses/${courseId}/feed`,
          },
          { label: "Sửa feed" },
        ]}
      >
        <div className="p-4 text-sm text-muted-foreground sm:p-5">
          Không thể tải dữ liệu feed.
        </div>
      </ManagementPageShell>
    );
  }

  return (
    <ManagementPageShell
      title={`Sửa feed #${feed.feed_id}`}
      description="Chỉnh sửa title, caption và hashtags. Video được giữ nguyên."
      noCard
      breadcrumbs={[
        { label: "Quản lý khóa học", href: "/instructor/courses" },
        { label: course.name, href: `/instructor/courses/${course.id}` },
        {
          label: "Quản lý feed",
          href: `/instructor/courses/${course.id}/feed`,
        },
        { label: "Sửa feed" },
      ]}
      action={
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" className="h-10 text-xs font-semibold px-4">
            <Link href={`/instructor/courses/${course.id}/feed`}>
              Quay lại
            </Link>
          </Button>
          <Button
            onClick={() => void handleUpdate()}
            disabled={updateFeedMutation.isPending || !isReady || !title.trim()}
            className="h-10 text-xs font-semibold px-4"
          >
            {updateFeedMutation.isPending ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang lưu...
              </span>
            ) : (
              "Lưu thay đổi"
            )}
          </Button>
        </div>
      }
    >
      <div className="p-3 sm:p-4 lg:p-5">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Cột trái: Thông tin bài viết & Video bài viết */}
          <div className="space-y-6 lg:col-span-8">
            {/* Card 1: Thông tin feed */}
            <Card className="border-border/60 shadow-sm">
              <CardContent className="space-y-5 p-6">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <NotebookText className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-base font-semibold">Thông tin bài viết</p>
                    <p className="text-xs text-muted-foreground">
                      Chỉnh sửa tiêu đề, mô tả và hashtags hiển thị trên bảng tin.
                    </p>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="feed-title">Tiêu đề *</Label>
                  <Input
                    id="feed-title"
                    value={title}
                    onChange={(event) => setTitleDraft(event.target.value)}
                    placeholder="Nhập tiêu đề feed"
                    className="h-11"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="feed-caption">Caption</Label>
                  <Textarea
                    id="feed-caption"
                    value={caption}
                    onChange={(event) => setCaptionDraft(event.target.value)}
                    placeholder="Mô tả chi tiết hoặc thông tin đi kèm..."
                    className="min-h-24"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="feed-hashtags">Hashtags</Label>
                  <div className="space-y-3 rounded-xl border border-input bg-background p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {hashtags.map((hashtag, index) => (
                        <Badge
                          key={`${hashtag}-${index}`}
                          variant="secondary"
                          className="gap-1 rounded-full border border-border/60 bg-primary/10 px-2.5 py-1 text-xs font-medium text-foreground"
                        >
                          <Tag className="h-3 w-3 text-muted-foreground" />
                          {hashtag}
                          <button
                            type="button"
                            className="rounded-full p-0.5 transition hover:bg-muted"
                            onClick={() =>
                              setHashtagsDraft((prev) =>
                                (prev ?? hashtags).filter((_, i) => i !== index),
                              )
                            }
                            aria-label={`Xóa hashtag ${hashtag}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <Input
                        id="feed-hashtags"
                        value={hashtagDraft}
                        onChange={(event) => setHashtagDraft(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === ",") {
                            event.preventDefault();
                            addHashtags(hashtagDraft);
                          }
                        }}
                        placeholder="VD: react, typescript (nhấn Enter hoặc dấu phẩy để thêm)"
                        className="h-10 w-full"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-10 w-full shrink-0 p-2 sm:w-auto"
                        onClick={() => addHashtags(hashtagDraft)}
                        title="Thêm hashtag"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Video bài viết */}
            <Card className="border-border/60 shadow-sm">
              <CardContent className="space-y-5 p-6">
                <div className="flex items-center gap-2 justify-between">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-primary/10 p-2 text-primary">
                      <Clapperboard className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-base font-semibold">Video bài viết</p>
                      <p className="text-xs text-muted-foreground">
                        Nội dung video gốc được liên kết với feed này.
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 gap-1.5 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                    title="Tạo highlight"
                    onClick={() => setIsHighlightUploadOpen(true)}
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Tạo video highlight</span>
                  </Button>
                </div>

                <div className="overflow-hidden rounded-xl border border-border/60 bg-black">
                  <video
                    className="block h-auto w-full max-h-[62vh] bg-black object-contain"
                    src={feed.video?.url}
                    poster={feed.video?.thumbnail ?? undefined}
                    controls
                    preload="metadata"
                    playsInline
                  >
                    Trình duyệt không hỗ trợ phát video.
                  </video>
                </div>

                <div className="rounded-xl border border-border/60 bg-muted/10 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">Feed #{feed.feed_id}</Badge>
                    <Badge variant="secondary">
                      {feed.video_type ?? "unknown"}
                    </Badge>
                    <Badge variant="outline" className="inline-flex items-center gap-1">
                      <Video className="h-3.5 w-3.5" />
                      Video giữ nguyên
                    </Badge>
                  </div>

                  <Separator className="my-3" />

                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="rounded-lg border border-border/60 bg-background p-3">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Lượt xem
                      </p>
                      <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        {feed.stats?.views ?? 0}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-background p-3">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Lượt thích
                      </p>
                      <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold">
                        <Heart className="h-4 w-4 text-red-500 fill-red-500" />
                        {feed.stats?.likes ?? 0}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cột phải: Live Preview */}
          <div className="space-y-6 lg:col-span-4 lg:sticky lg:top-24 lg:h-fit">
            <Card className="border-border/60 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-center gap-2 border-b border-border/60 px-5 py-4 bg-muted/20">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-base font-semibold">Xem trước trên Web</p>
                    <p className="text-xs text-muted-foreground">
                      Giao diện hiển thị thực tế trên newsfeed.
                    </p>
                  </div>
                </div>

                <div className="p-5">
                  <div className="relative overflow-hidden rounded-xl border border-border bg-black shadow-lg aspect-video w-full">
                    {/* Video Area */}
                    <div className="relative h-full w-full bg-black flex items-center justify-center overflow-hidden">
                      {feed.video?.url ? (
                        <video
                          key={feed.feed_id}
                          className="h-full w-full object-contain"
                          src={feed.video.url}
                          poster={feed.video.thumbnail ?? undefined}
                          controls
                          preload="metadata"
                          playsInline
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-muted-foreground/80 p-4 text-center">
                          <Video className="h-7 w-7 mb-1.5 opacity-60" />
                          <span className="text-[11px]">Chưa có video</span>
                        </div>
                      )}

                      {/* Bottom details overlay on the video */}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3 pt-8 text-white z-10 text-left pointer-events-none">
                        <p className="text-xs font-semibold truncate">
                          {title.trim() || "Tiêu đề bài viết"}
                        </p>
                        <p className="mt-0.5 text-[10px] text-white/85 line-clamp-2 leading-relaxed">
                          {caption.trim() || "Caption bài viết"}
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {hashtags.map((tag) => (
                            <span key={tag} className="text-[9px] font-medium text-primary-foreground bg-primary/30 px-1 py-0.2 rounded">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <HighlightUploadDialog
        open={isHighlightUploadOpen}
        onOpenChange={setIsHighlightUploadOpen}
      />
    </ManagementPageShell>
  );
}
