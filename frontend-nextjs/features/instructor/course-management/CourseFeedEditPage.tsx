"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  Heart,
  Loader2,
  Plus,
  Sparkles,
  Tag,
  Video,
  X,
  NotebookText,
  Clapperboard,
} from "lucide-react";
import { toast } from "sonner";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
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

const feedFormSchema = z.object({
  title: z.string().trim().min(1, "Tiêu đề feed không được để trống"),
  caption: z.string().trim().optional(),
  hashtags: z.array(z.string()),
});

type FeedFormValues = z.infer<typeof feedFormSchema>;

function parseHashtagTokens(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeCaption(value?: string): string | undefined {
  if (!value) return undefined;
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

  const [hashtagDraft, setHashtagDraft] = useState("");

  const feed = useMemo(() => {
    if (feedDetail?.feed_id) {
      return feedDetail;
    }

    return (feeds ?? []).find((item) => item.feed_id === feedId) ?? null;
  }, [feedDetail, feeds, feedId]);

  const isFeedLoading = feedDetailLoading || feedListLoading;
  const isReady = !courseLoading && !isFeedLoading && Boolean(course && feed);

  const { register, control, handleSubmit, setValue, reset, formState: { errors } } = useForm<FeedFormValues>({
    resolver: zodResolver(feedFormSchema),
    defaultValues: {
      title: "",
      caption: "",
      hashtags: [],
    },
  });

  const [formTitle = "", formCaption = "", formHashtags = []] = useWatch({
    control,
    name: ["title", "caption", "hashtags"],
  });

  // Populate data when feed is loaded
  useEffect(() => {
    if (feed) {
      reset({
        title: feed.title || "",
        caption: feed.caption || "",
        hashtags: feed.hashtags || [],
      });
    }
  }, [feed, reset]);

  const addHashtags = (rawValue: string) => {
    const nextItems = parseHashtagTokens(rawValue);
    if (!nextItems.length) {
      return;
    }

    const currentHashtags = formHashtags;
    const normalized = new Set(
      currentHashtags.map((item) => item.trim().toLowerCase()),
    );
    const merged = [...currentHashtags];

    nextItems.forEach((item) => {
      const key = item.toLowerCase();
      if (!normalized.has(key)) {
        normalized.add(key);
        merged.push(item);
      }
    });

    setValue("hashtags", merged);
    setHashtagDraft("");
  };

  const onSubmit = async (values: FeedFormValues) => {
    if (!feed) {
      return;
    }

    await updateFeedMutation.mutateAsync({
      id: feed.feed_id,
      data: {
        title: values.title.trim(),
        caption: normalizeCaption(values.caption),
        hashtags: values.hashtags,
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
      title="Sửa bài viết feed"
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
            type="submit"
            form="edit-feed-form"
            disabled={updateFeedMutation.isPending || !isReady}
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
      <div className="px-0 py-5">
        <form
          id="edit-feed-form"
          onSubmit={(event) => void handleSubmit(onSubmit)(event)}
        >
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,420px)]">
            {/* Cột trái: Thông tin bài viết & Video bài viết */}
            <div className="min-w-0 space-y-5">
              {/* Card 1: Thông tin feed */}
              <Card className="border-border/60 shadow-sm">
                <CardContent className="space-y-5 p-4 sm:p-5">
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
                    <Label htmlFor="feed-title">
                      Tiêu đề <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="feed-title"
                      {...register("title")}
                      placeholder="Nhập tiêu đề feed"
                      className={cn("h-11", errors.title && "border-destructive focus-visible:ring-destructive")}
                    />
                    {errors.title && (
                      <p className="text-xs text-destructive mt-0.5">{errors.title.message}</p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="feed-caption">Mô tả chi tiết</Label>
                    <Textarea
                      id="feed-caption"
                      {...register("caption")}
                      placeholder="Mô tả chi tiết hoặc thông tin đi kèm..."
                      className="min-h-24"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="feed-hashtags">Hashtags</Label>
                    <div className="space-y-3 rounded-xl border border-input bg-background p-2.5 sm:p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {formHashtags.map((hashtag, index) => (
                          <span
                            key={`${hashtag}-${index}`}
                            className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/30 px-2.5 py-1 text-xs font-medium text-foreground"
                          >
                            <Tag className="h-3 w-3 text-muted-foreground" />
                            {hashtag}
                            <button
                              type="button"
                              className="rounded-full p-0.5 transition hover:bg-muted"
                              onClick={() => {
                                const next = formHashtags.filter((_, i) => i !== index);
                                setValue("hashtags", next);
                              }}
                              aria-label={`Xóa hashtag ${hashtag}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
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
                          className="h-10 w-full shrink-0 p-2 sm:w-auto text-xs font-semibold px-4"
                          onClick={() => addHashtags(hashtagDraft)}
                          title="Thêm hashtag"
                        >
                          <Plus className="h-4 w-4 mr-1.5" />
                          Thêm
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 2: Video bài viết */}
              <Card className="border-border/60 shadow-sm">
                <CardContent className="space-y-5 p-4 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
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
                  </div>

                  <div className="grid gap-4 rounded-xl border border-border/60 bg-muted/10 p-4 sm:grid-cols-[176px_minmax(0,1fr)]">
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-border/60 bg-muted">
                      {feed.video?.thumbnail ? (
                        <img
                          src={feed.video.thumbnail}
                          alt={feed.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
                          <Clapperboard className="h-7 w-7 opacity-60" />
                          <span className="text-xs">Chưa có ảnh thu nhỏ</span>
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 space-y-4">
                      <div className="space-y-2">
                        <p className="line-clamp-2 break-words text-sm font-semibold">
                          {feed.title || "Video bài viết"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Video đang dùng cho bài viết này.
                        </p>
                      </div>

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
                            <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                            {feed.stats?.likes ?? 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Cột phải: Live Preview */}
            <div className="min-w-0 space-y-5 xl:sticky xl:top-24 xl:h-fit">
              <Card className="border-border/60 shadow-sm overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-center gap-2 border-b border-border/60 bg-muted/20 px-4 py-3.5 sm:px-5 sm:py-4">
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

                  <div className="p-4 sm:p-5">
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
                            {formTitle.trim() || "Tiêu đề bài viết"}
                          </p>
                          <p className="text-[10px] text-gray-300 line-clamp-2 mt-0.5 leading-normal">
                            {formCaption.trim() || "Mô tả chi tiết bài viết của bạn sẽ xuất hiện ở đây..."}
                          </p>
                          {formHashtags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {formHashtags.map((tag) => (
                                <span key={tag} className="text-[9px] font-medium text-sky-400 bg-sky-950/40 px-1.5 py-0.2 rounded">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </ManagementPageShell>
  );
}
