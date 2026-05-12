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
  Tag,
  Video,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ManagementPageShell } from "./components/ManagementPageShell";
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
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link href={`/instructor/courses/${course.id}/feed`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại danh sách feed
          </Link>
        </Button>
      }
    >
      <div className="space-y-4 p-3 sm:p-4 lg:p-5">
        <div className="rounded-2xl border border-border/60 bg-linear-to-br from-background via-background to-muted/20 p-3 shadow-sm sm:p-4">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_340px] xl:items-start">
            <div className="space-y-4">
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

              <div className="rounded-xl border border-border/60 bg-background p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">Feed #{feed.feed_id}</Badge>
                  <Badge variant="secondary">
                    {feed.video_type ?? "unknown"}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="inline-flex items-center gap-1"
                  >
                    <Video className="h-3.5 w-3.5" />
                    Video giữ nguyên
                  </Badge>
                </div>

                <Separator className="my-3" />

                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                      Lượt xem
                    </p>
                    <p className="mt-1 inline-flex items-center gap-1 text-sm font-semibold">
                      <Eye className="h-4 w-4" />
                      {feed.stats?.views ?? 0}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                      Lượt thích
                    </p>
                    <p className="mt-1 inline-flex items-center gap-1 text-sm font-semibold">
                      <Heart className="h-4 w-4" />
                      {feed.stats?.likes ?? 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 rounded-xl border border-border/60 bg-background p-3 sm:p-4 xl:sticky xl:top-5">
              <div className="space-y-2">
                <Label htmlFor="feed-title">Tiêu đề</Label>
                <Input
                  id="feed-title"
                  value={title}
                  onChange={(event) => setTitleDraft(event.target.value)}
                  placeholder="Nhập tiêu đề feed"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="feed-caption">Caption</Label>
                <Textarea
                  id="feed-caption"
                  value={caption}
                  onChange={(event) => setCaptionDraft(event.target.value)}
                  placeholder="Mô tả ngắn cho feed (tùy chọn)"
                  className="min-h-24"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="feed-hashtags">Hashtags</Label>
                <div className="space-y-3 rounded-lg border border-input bg-background p-3">
                  <div className="flex min-h-7 flex-wrap items-center gap-2">
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
                      placeholder="VD: react, typescript"
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

              <div className="flex justify-end">
                <Button
                  onClick={() => void handleUpdate()}
                  disabled={updateFeedMutation.isPending || !isReady}
                  className="w-full sm:w-auto"
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
            </div>
          </div>
        </div>
      </div>
    </ManagementPageShell>
  );
}
