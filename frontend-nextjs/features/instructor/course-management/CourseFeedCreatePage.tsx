"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Edit3,
  Loader2,
  Search,
  Send,
  Tag,
  Video,
  X,
  Plus,
  NotebookText,
  Clapperboard,
} from "lucide-react";
import { toast } from "sonner";
import { useForm, Controller, useWatch } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { getUserFacingErrorMessage } from "@/lib/user-facing-error";
import { cn } from "@/lib/utils";
import { ManagementPageShell } from "./components/ManagementPageShell";
import { HighlightUploadDialog } from "./components/HighlightUploadDialog";
import { useUpload } from "@/features/upload/hooks/useUpload";
import {
  courseFeedKeys,
  invalidateCourseFeedCache,
  useCourseFeeds,
  useCourseFeedCandidateVideos,
  useCreateCourseFeed,
  useInstructorCourseById,
} from "./api/course-management.hooks";
import type { CourseFeedCandidateVideo } from "./types";
import type { Clip } from "@/features/upload/types";

interface Props {
  courseId: number;
}

const feedFormSchema = z.object({
  title: z.string().trim().min(1, "Tiêu đề feed không được để trống"),
  caption: z.string().trim().optional(),
  videoId: z.string().min(1, "Vui lòng chọn một video từ thư viện"),
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

function getCreateFeedErrorMessage(error: unknown): string {
  const responseMessage = (error as {
    response?: { data?: { message?: unknown } };
  }).response?.data?.message;

  if (
    typeof responseMessage === "string" &&
    responseMessage.toLowerCase().includes("already in feed")
  ) {
    return "Video này đã có trên feed. Vui lòng chọn highlight khác.";
  }

  if (
    typeof responseMessage === "string" &&
    responseMessage.trim() &&
    !/request failed|status code|service unavailable|internal server error/i.test(responseMessage)
  ) {
    return responseMessage;
  }

  return getUserFacingErrorMessage(error, "Không thể tạo feed. Vui lòng thử lại.");
}

function getVideoThumbnail(video: CourseFeedCandidateVideo): string | null {
  return video.thumbnail ?? null;
}

function normalizeVideoUrl(value?: string | null): string {
  return (value ?? "").trim().replace(/[?#].*$/, "");
}

function formatDuration(duration: number | null | undefined): string {
  if (
    duration === null ||
    duration === undefined ||
    !Number.isFinite(duration)
  ) {
    return "00:00:00";
  }

  const total = Math.max(0, Math.floor(duration));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

export default function CourseFeedCreatePage({ courseId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { data: course, isLoading: courseLoading } =
    useInstructorCourseById(courseId);
  // Fetch ALL feeds of the instructor (all courses) to deduplicate globally —
  // backend rejects a video that is ALREADY in ANY feed (not just this course).
  const { data: allMyFeeds } = useCourseFeeds({ pageSize: 500 });
  const {
    data: candidateVideos,
    isLoading: candidateLoading,
    refetch: refetchCandidateVideos,
  } = useCourseFeedCandidateVideos(courseId);
  const createFeedMutation = useCreateCourseFeed();
  const highlightUpload = useUpload({ autoCreateProject: false });

  const [hashtagDraft, setHashtagDraft] = useState("");
  const [videoQuery, setVideoQuery] = useState("");
  const [videoTypeFilter, setVideoTypeFilter] = useState<
    "all" | "highlight" | "mascot"
  >("all");
  const [visibleCount, setVisibleCount] = useState(12);
  const [isHighlightUploadOpen, setIsHighlightUploadOpen] = useState(false);
  const [pendingHighlightClip, setPendingHighlightClip] = useState<Clip | null>(null);
  const autoOpenedHighlightJobRef = useRef<string | null>(null);
  const handledHighlightJobRef = useRef<string | null>(null);

  const { register, control, handleSubmit, setValue, formState: { errors } } = useForm<FeedFormValues>({
    resolver: zodResolver(feedFormSchema),
    defaultValues: {
      title: "",
      caption: "",
      videoId: "",
      hashtags: [],
    },
  });

  const [formVideoId = "", formTitle = "", formCaption = "", formHashtags = []] =
    useWatch({
      control,
      name: ["videoId", "title", "caption", "hashtags"],
    });

  // Build set of video IDs already on ANY feed (global dedup)
  const feedVideoIds = useMemo(
    () => new Set((allMyFeeds ?? []).map((item) => item.video?.id)),
    [allMyFeeds],
  );

  const availableVideosForCreate = useMemo(
    () =>
      (candidateVideos ?? []).filter((video) => !feedVideoIds.has(video.id)),
    [candidateVideos, feedVideoIds],
  );

  const hiddenUsedVideoCount = Math.max(
    0,
    (candidateVideos?.length ?? 0) - availableVideosForCreate.length,
  );

  const selectedVideo =
    availableVideosForCreate.find(
      (video) => String(video.id) === formVideoId,
    ) ?? null;

  const selectVideoForFeed = useCallback(
    (video: Pick<CourseFeedCandidateVideo, "id" | "name">) => {
      setValue("videoId", String(video.id), {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
      if (!formTitle.trim()) {
        setValue("title", video.name, {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        });
      }
      setVideoQuery("");
      setVideoTypeFilter("all");
      setVisibleCount(12);
    },
    [formTitle, setValue],
  );

  const handleEditFeedVideo = useCallback(
    async (video: CourseFeedCandidateVideo) => {
      const ensured = await highlightUpload.ensureProjectForClip({
        name: video.name,
        url: video.url,
        videoId: video.id,
        thumbnail: video.thumbnail,
        duration: video.duration,
      });
      const params = new URLSearchParams({
        src: video.url,
        from: "highlight",
        returnUrl: `/instructor/courses/${courseId}/feed/new`,
      });

      if (ensured?.projectId) {
        params.set("edit_id", String(ensured.projectId));
      }
      if (ensured?.videoId) {
        params.set("video_id", String(ensured.videoId));
      } else {
        params.set("video_id", String(video.id));
      }

      router.push(`/editor?${params.toString()}`);
    },
    [courseId, highlightUpload, router],
  );

  useEffect(() => {
    const returnedVideoId = searchParams.get("video_id");
    if (!returnedVideoId) return;

    let cancelled = false;

    const pickReturnedVideo = async () => {
      const findAvailableVideo = (videos: CourseFeedCandidateVideo[] = []) =>
        videos.find(
          (video) =>
            String(video.id) === returnedVideoId && !feedVideoIds.has(video.id),
        ) ?? null;

      let matchedVideo = findAvailableVideo(availableVideosForCreate);

      if (!matchedVideo) {
        await queryClient.invalidateQueries({
          queryKey: courseFeedKeys.custom("candidate-videos", courseId),
        });
        const refreshed = await refetchCandidateVideos();
        matchedVideo = findAvailableVideo(refreshed.data ?? []);
      }

      if (cancelled || !matchedVideo) return;

      selectVideoForFeed(matchedVideo);
      toast.success("Da chon video vua tao cho feed", {
        id: "feed-editor-video-selected",
      });

      router.replace(`/instructor/courses/${courseId}/feed/new`, {
        scroll: false,
      });
    };

    void pickReturnedVideo();

    return () => {
      cancelled = true;
    };
  }, [
    availableVideosForCreate,
    courseId,
    feedVideoIds,
    queryClient,
    refetchCandidateVideos,
    router,
    searchParams,
    selectVideoForFeed,
  ]);

  const handleHighlightUploadSuccess = useCallback(
    async (clips: Clip[]) => {
      const clip = clips.find((item) => item.videoId) ?? clips[0];
      if (!clip) return;

      setPendingHighlightClip(clip);

      await queryClient.invalidateQueries({
        queryKey: courseFeedKeys.custom("candidate-videos", courseId),
      });
      await queryClient.invalidateQueries({
        queryKey: courseFeedKeys.root,
      });
      await queryClient.refetchQueries({
        queryKey: courseFeedKeys.custom("candidate-videos", courseId),
        type: "active",
      });

      if (clip.videoId) {
        selectVideoForFeed({
          id: clip.videoId,
          name: clip.name?.trim() || "Highlight mới",
        });
        setPendingHighlightClip(null);
        toast.success("Đã chọn highlight mới cho feed", {
          id: "feed-highlight-selected",
        });
      }

      router.refresh();
    },
    [courseId, queryClient, router, selectVideoForFeed],
  );

  useEffect(() => {
    const isRunning =
      highlightUpload.status === "uploading" ||
      highlightUpload.status === "pending" ||
      highlightUpload.status === "processing";
    const restoreKey = highlightUpload.jobId ?? (isRunning ? "uploading" : null);

    if (!restoreKey || autoOpenedHighlightJobRef.current === restoreKey) return;

    autoOpenedHighlightJobRef.current = restoreKey;
    const timer = window.setTimeout(() => {
      setIsHighlightUploadOpen(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [highlightUpload.jobId, highlightUpload.status]);

  useEffect(() => {
    if (highlightUpload.status !== "completed" || highlightUpload.clips.length === 0) {
      return;
    }

    const clipKey = highlightUpload.clips
      .map((clip) => `${clip.videoId ?? ""}:${clip.url}`)
      .join("|");
    const completedKey = `${highlightUpload.jobId ?? "completed"}:${clipKey}`;
    if (handledHighlightJobRef.current === completedKey) return;

    handledHighlightJobRef.current = completedKey;
    const timer = window.setTimeout(() => {
      void handleHighlightUploadSuccess(highlightUpload.clips);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [
    handleHighlightUploadSuccess,
    highlightUpload.clips,
    highlightUpload.jobId,
    highlightUpload.status,
  ]);

  useEffect(() => {
    if (!pendingHighlightClip) return;

    const pendingUrl = normalizeVideoUrl(pendingHighlightClip.url);
    const matchedVideo = availableVideosForCreate.find((video) => {
      if (pendingHighlightClip.videoId && video.id === pendingHighlightClip.videoId) {
        return true;
      }

      return pendingUrl.length > 0 && normalizeVideoUrl(video.url) === pendingUrl;
    });

    if (!matchedVideo) return;

    const timer = window.setTimeout(() => {
      selectVideoForFeed(matchedVideo);
      setPendingHighlightClip(null);
      toast.success("Đã chọn highlight mới cho feed", {
        id: "feed-highlight-selected",
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [availableVideosForCreate, pendingHighlightClip, selectVideoForFeed]);

  const filteredVideos = useMemo(() => {
    const query = videoQuery.trim().toLowerCase();

    return availableVideosForCreate.filter((video) => {
      const matchType =
        videoTypeFilter === "all" ? true : video.type === videoTypeFilter;
      if (!matchType) {
        return false;
      }

      if (!query) {
        return true;
      }

      const text = `${video.name} ${video.type}`.toLowerCase();
      return text.includes(query);
    });
  }, [availableVideosForCreate, videoQuery, videoTypeFilter]);

  const visibleVideos = useMemo(
    () => filteredVideos.slice(0, visibleCount),
    [filteredVideos, visibleCount],
  );

  const hasMoreVideos = visibleCount < filteredVideos.length;
  const isHighlightUploadActive =
    highlightUpload.status === "uploading" ||
    highlightUpload.status === "pending" ||
    highlightUpload.status === "processing";

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
    const videoId = Number(values.videoId);
    if (!Number.isInteger(videoId) || videoId <= 0) {
      toast.error("Vui lòng chọn một video để tạo feed.", { id: "feed-create-error" });
      return;
    }

    if (feedVideoIds.has(videoId)) {
      toast.error("Video này đã có trên feed. Vui lòng chọn highlight khác.", { id: "feed-duplicate-error" });
      return;
    }

    try {
      await createFeedMutation.mutateAsync({
        video_id: videoId,
        course_id: courseId,
        title: values.title.trim(),
        caption: normalizeCaption(values.caption),
        hashtags: values.hashtags,
      });
      await invalidateCourseFeedCache(queryClient, courseId);

      toast.success("Đã thêm video vào feed");
      router.push(`/instructor/courses/${courseId}/feed`);
      router.refresh();
    } catch (error) {
      toast.error(getCreateFeedErrorMessage(error), { id: "feed-create-error" });
    }
  };

  if (courseLoading) {
    return (
      <ManagementPageShell
        title="Đang tải..."
        description="Lấy dữ liệu khóa học"
        breadcrumbs={[
          { label: "Quản lý khóa học", href: "/instructor/courses" },
          {
            label: "Quản lý feed",
            href: `/instructor/courses/${courseId}/feed`,
          },
          { label: "Tạo feed" },
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
          {
            label: "Quản lý feed",
            href: `/instructor/courses/${courseId}/feed`,
          },
          { label: "Tạo feed" },
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
      title={`Tạo feed cho ${course.name}`}
      description="Chọn 1 video và nhập metadata để tạo feed item mới."
      noCard
      breadcrumbs={[
        { label: "Quản lý khóa học", href: "/instructor/courses" },
        { label: course.name, href: `/instructor/courses/${course.id}` },
        {
          label: "Quản lý feed",
          href: `/instructor/courses/${course.id}/feed`,
        },
        { label: "Tạo feed" },
      ]}
      action={
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" className="h-10 gap-2 px-4 text-xs font-semibold">
            <Link href={`/instructor/courses/${course.id}/feed`}>
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </Link>
          </Button>
          <Button
            type="submit"
            form="create-feed-form"
            disabled={createFeedMutation.isPending}
            className="h-10 gap-2 px-4 text-xs font-semibold"
          >
            {createFeedMutation.isPending ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang tạo...
              </span>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Tạo feed
              </>
            )}
          </Button>
        </div>
      }
    >
      <div>
        <form
          id="create-feed-form"
          onSubmit={(event) => void handleSubmit(onSubmit)(event)}
        >
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            {/* Cột trái: Thông tin bài viết & Thư viện video */}
            <div className="space-y-5">
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
                        Nhập tiêu đề, caption và hashtags hiển thị trên bảng tin.
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
                      placeholder="Nhập tiêu đề hấp dẫn cho feed..."
                      className={cn("h-11", errors.title && "border-destructive focus-visible:ring-destructive")}
                    />
                    {errors.title && (
                      <p className="text-xs text-destructive mt-0.5">{errors.title.message}</p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="feed-hashtags">Hashtags</Label>
                    <div className="space-y-3 rounded-xl border border-input bg-background p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {formHashtags.map((hashtag, index) => (
                          <span
                            key={`${hashtag}-${index}`}
                            className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/30 px-2.5 py-1 text-xs font-medium text-foreground"
                          >
                            <Tag className="h-3 w-3 text-muted-foreground" />
                            {hashtag}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="h-5 w-5 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                              onClick={() => {
                                const next = formHashtags.filter((_, i) => i !== index);
                                setValue("hashtags", next);
                              }}
                              aria-label={`Xóa hashtag ${hashtag}`}
                            >
                              <X className="h-3 w-3" />
                            </Button>
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
                          placeholder="Thêm hashtag..."
                          className="h-10 sm:flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => addHashtags(hashtagDraft)}
                          className="h-10 text-xs font-semibold px-4"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Thêm
                        </Button>
                      </div>
                    </div>
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
                </CardContent>
              </Card>

              {/* Card 2: Thư viện video */}
              <Controller
                name="videoId"
                control={control}
                render={({ field }) => (
                  <Card
                    ref={field.ref}
                    tabIndex={-1}
                    className={cn(
                      "border-border/60 shadow-sm transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-destructive/30",
                      errors.videoId && "border-destructive bg-destructive/[0.01]"
                    )}
                  >
                    <CardContent className="space-y-5 p-6">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className="rounded-lg bg-primary/10 p-2 text-primary">
                            <Clapperboard className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-base font-semibold">
                              Thư viện video <span className="text-destructive">*</span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Chọn một video để hiển thị trên bảng tin.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-9 gap-1.5 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                            title="Tạo highlight"
                            onClick={() => setIsHighlightUploadOpen(true)}
                          >
                            <Video className="h-4 w-4" />
                            <span>Tạo video highlight</span>
                          </Button>
                        </div>
                      </div>

                      {hiddenUsedVideoCount > 0 ? (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                          Đã ẩn {hiddenUsedVideoCount} video vì các video này đã có trên feed. Một video chỉ được đăng feed một lần để tránh trùng nội dung.
                        </div>
                      ) : null}

                      {(isHighlightUploadActive || pendingHighlightClip) && (
                        <div className="flex flex-col gap-3 rounded-xl border border-primary/25 bg-primary/5 px-3 py-3 text-sm text-primary sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-semibold">
                              {isHighlightUploadActive
                                ? "Highlight đang được tạo"
                                : "Đang cập nhật highlight mới"}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {highlightUpload.stage ||
                                "StudyLoop sẽ tự chọn video mới khi xử lý hoàn tất."}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 shrink-0 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
                            onClick={() => setIsHighlightUploadOpen(true)}
                          >
                            Xem tiến trình
                          </Button>
                        </div>
                      )}

                      {errors.videoId && (
                        <p className="text-sm font-medium text-destructive">{errors.videoId.message}</p>
                      )}

                      <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                        <div className="relative">
                          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            value={videoQuery}
                            onChange={(event) => {
                              setVideoQuery(event.target.value);
                              setVisibleCount(12);
                            }}
                            placeholder="Tìm video..."
                            className="pl-9 h-10"
                          />
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          {(
                            [
                              { key: "all", label: "Tất cả" },
                              { key: "highlight", label: "Highlight" },
                              { key: "mascot", label: "Mascot" },
                            ] as const
                          ).map((option) => (
                            <Button
                              key={option.key}
                              type="button"
                              size="sm"
                              variant={
                                videoTypeFilter === option.key ? "default" : "outline"
                              }
                              onClick={() => {
                                setVideoTypeFilter(option.key);
                                setVisibleCount(12);
                              }}
                              className="h-10"
                            >
                              {option.label}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {candidateLoading ? (
                        <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-8 text-center text-sm text-muted-foreground animate-pulse">
                          Đang tải danh sách video...
                        </div>
                      ) : filteredVideos.length ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                            {visibleVideos.map((video) => {
                              const isSelected = String(video.id) === field.value;
                              const thumbnail = getVideoThumbnail(video);

                              return (
                                <div key={video.id} className="group/card relative">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      field.onChange(String(video.id))
                                    }
                                    className={cn(
                                      "group relative w-full cursor-pointer overflow-hidden rounded-xl border bg-card text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
                                      isSelected
                                        ? "border-primary ring-2 ring-primary/20"
                                        : "border-border/60 hover:border-primary/40",
                                    )}
                                  >
                                    <div className="relative aspect-video bg-muted overflow-hidden shrink-0">
                                      {thumbnail ? (
                                        <div
                                          className="h-full w-full bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                                          style={{ backgroundImage: `url(${thumbnail})` }}
                                        />
                                      ) : (
                                        <div className="flex h-full w-full items-center justify-center text-muted-foreground bg-muted">
                                          <Video className="h-5 w-5" />
                                        </div>
                                      )}

                                      {isSelected && (
                                        <div className="absolute right-2 top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                                          <CheckCircle2 className="h-3 w-3" />
                                        </div>
                                      )}

                                      <span className="absolute bottom-1.5 right-1.5 rounded bg-black/75 px-1.5 py-0.5 text-[9px] font-medium text-white tracking-wide leading-none shadow-sm">
                                        {formatDuration(video.duration)}
                                      </span>
                                    </div>

                                    <div className="p-3 space-y-1">
                                      <p className="line-clamp-2 text-xs font-semibold leading-relaxed text-foreground group-hover:text-primary transition-colors">
                                        {video.name}
                                      </p>
                                    </div>
                                  </button>
                                  <Button
                                    type="button"
                                    variant="secondary"
                                    size="icon-sm"
                                    aria-label={`Mở Studio chỉnh sửa ${video.name}`}
                                    className="absolute left-2 top-2 h-7 w-7 rounded-full border border-white/70 bg-black/65 text-white opacity-0 shadow-sm hover:bg-primary hover:text-white group-hover/card:opacity-100 focus:opacity-100 focus:ring-primary/40"
                                    onClick={() => {
                                      void handleEditFeedVideo(video);
                                    }}
                                  >
                                    <Edit3 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              );
                            })}
                          </div>

                          {(hasMoreVideos || visibleCount > 12) && (
                            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 px-3 py-2">
                              <span className="text-xs text-muted-foreground">
                                Đang xem {visibleVideos.length} trong {filteredVideos.length} video
                              </span>
                              <div className="flex items-center gap-2">
                                {visibleCount > 12 && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setVisibleCount(12)}
                                  >
                                    Thu gọn
                                  </Button>
                                )}
                                {hasMoreVideos && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setVisibleCount((prev) => prev + 12)}
                                  >
                                    Xem thêm 12
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex min-h-36 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/70 bg-muted/10 px-4 py-8 text-center">
                          {videoTypeFilter === "mascot" ? (
                            <>
                              <p className="text-sm text-muted-foreground">Bạn chưa có video Mascot nào.</p>
                              <p className="text-xs text-muted-foreground/70">Hãy tạo video mascot trong Studio để đưa lên feed.</p>
                              <Link
                                href="/studio"
                                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
                              >
                                <Clapperboard className="h-3.5 w-3.5" />
                                Mở Studio tạo Mascot
                              </Link>
                            </>
                          ) : videoTypeFilter === "highlight" ? (
                            <>
                              <p className="text-sm text-muted-foreground">Không có video Highlight nào để chọn.</p>
                              <p className="text-xs text-muted-foreground/70">Tất cả highlight đã có trên feed hoặc bạn chưa tạo highlight nào.</p>
                            </>
                          ) : (
                            <>
                              <p className="text-sm text-muted-foreground">Không có video nào khả dụng.</p>
                              <p className="text-xs text-muted-foreground/70">
                                Chỉ các video dạng <strong>Highlight</strong> và <strong>Mascot</strong> mới có thể đăng lên feed. Video gốc dài không được hỗ trợ.
                              </p>
                            </>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              />
            </div>

            {/* Cột phải: Live Preview */}
            <div className="space-y-5 xl:sticky xl:top-24 xl:h-fit">
              <Card className="border-border/60 shadow-sm overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-center gap-2 border-b border-border/60 px-5 py-4 bg-muted/20">
                    <div className="rounded-lg bg-primary/10 p-2 text-primary">
                      <Video className="h-4 w-4" />
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
                        {selectedVideo ? (
                          <video
                            key={selectedVideo.id}
                            className="h-full w-full object-contain"
                            src={selectedVideo.url}
                            poster={getVideoThumbnail(selectedVideo) ?? undefined}
                            controls
                            preload="metadata"
                            playsInline
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-muted-foreground/80 p-4 text-center">
                            <Video className="h-7 w-7 mb-1.5 opacity-60" />
                            <span className="text-[11px]">Chưa chọn video</span>
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

      <HighlightUploadDialog
        open={isHighlightUploadOpen}
        onOpenChange={setIsHighlightUploadOpen}
        upload={highlightUpload}
      />
    </ManagementPageShell>
  );
}
