"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Loader2,
  Search,
  Tag,
  Video,
  X,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ManagementPageShell } from "./components/ManagementPageShell";
import {
  useCourseFeed,
  useCourseFeedCandidateVideos,
  useCreateCourseFeed,
  useInstructorCourseById,
} from "./api/course-management.hooks";
import type { CourseFeedCandidateVideo } from "./types";

interface Props {
  courseId: number;
}

interface FeedCreateFormState {
  videoId: string;
  title: string;
  hashtags: string[];
}

const EMPTY_FORM: FeedCreateFormState = {
  videoId: "",
  title: "",
  hashtags: [],
};

function parseHashtagTokens(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getVideoThumbnail(video: CourseFeedCandidateVideo): string | null {
  return video.thumbnail ?? null;
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
  const previewVideoRef = useRef<HTMLDivElement | null>(null);
  const { data: course, isLoading: courseLoading } =
    useInstructorCourseById(courseId);
  const { data: feeds } = useCourseFeed(courseId);
  const { data: candidateVideos, isLoading: candidateLoading } =
    useCourseFeedCandidateVideos(courseId);
  const createFeedMutation = useCreateCourseFeed();

  const [form, setForm] = useState<FeedCreateFormState>(EMPTY_FORM);
  const [hashtagDraft, setHashtagDraft] = useState("");
  const [videoQuery, setVideoQuery] = useState("");
  const [videoTypeFilter, setVideoTypeFilter] = useState<
    "all" | "highlight" | "mascot"
  >("all");
  const [visibleCount, setVisibleCount] = useState(12);

  const feedVideoIds = useMemo(
    () => new Set((feeds ?? []).map((item) => item.video?.id)),
    [feeds],
  );

  const availableVideosForCreate = useMemo(
    () =>
      (candidateVideos ?? []).filter((video) => !feedVideoIds.has(video.id)),
    [candidateVideos, feedVideoIds],
  );

  const selectedVideo =
    availableVideosForCreate.find(
      (video) => String(video.id) === form.videoId,
    ) ?? null;

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

      const text = `${video.name} ${video.type} ${video.id}`.toLowerCase();
      return text.includes(query);
    });
  }, [availableVideosForCreate, videoQuery, videoTypeFilter]);

  const visibleVideos = useMemo(
    () => filteredVideos.slice(0, visibleCount),
    [filteredVideos, visibleCount],
  );

  const hasMoreVideos = visibleCount < filteredVideos.length;

  const addHashtags = (rawValue: string) => {
    const nextItems = parseHashtagTokens(rawValue);
    if (!nextItems.length) {
      return;
    }

    const normalized = new Set(
      (form.hashtags ?? []).map((item) => item.trim().toLowerCase()),
    );

    const merged = [...(form.hashtags ?? [])];
    nextItems.forEach((item) => {
      const key = item.toLowerCase();
      if (!normalized.has(key)) {
        normalized.add(key);
        merged.push(item);
      }
    });

    setForm((prev) => ({ ...prev, hashtags: merged }));
    setHashtagDraft("");
  };

  const handleCreate = async () => {
    const videoId = Number(form.videoId);
    if (!videoId) {
      toast.error("Vui lòng chọn video");
      return;
    }
    if (!form.title.trim()) {
      toast.error("Vui lòng nhập tiêu đề");
      return;
    }

    await createFeedMutation.mutateAsync({
      video_id: videoId,
      course_id: courseId,
      title: form.title.trim(),
      hashtags: form.hashtags,
    });

    toast.success("Đã thêm feed vào course");
    router.push(`/instructor/courses/${courseId}/feed`);
    router.refresh();
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
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link href={`/instructor/courses/${course.id}/feed`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại danh sách feed
          </Link>
        </Button>
      }
    >
      <div className="min-h-[calc(100vh-11rem)] bg-linear-to-br from-background via-background to-muted/20 p-3 sm:p-5">
        <div className="mx-auto max-w-6xl space-y-5">
          <section className="overflow-hidden rounded-2xl border border-border/60 bg-background shadow-sm">
            <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
              <div className="flex h-full flex-col space-y-3 border-b border-border/60 px-5 py-5 sm:px-6 lg:border-b-0 lg:border-r">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="rounded-full">
                    Tạo mới
                  </Badge>
                  <span>Mỗi feed item chỉ chọn 1 video</span>
                </div>

                <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                  Chọn video và tạo feed
                </h2>

                <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                  Tìm video từ thư viện của bạn, chọn một item rồi nhập tiêu đề
                  và hashtag.
                </p>

                <div className="overflow-hidden rounded-2xl border border-border/60 bg-background shadow-sm">
                  <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="rounded-full px-2 py-0.5 text-[11px]"
                      >
                        Live preview
                      </Badge>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="rounded-2xl border border-border/60 bg-muted/10 p-3">
                      <div className="flex items-center gap-3">
                        <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                          {(course.name?.trim().charAt(0) || "C").toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {course.name}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 space-y-2 rounded-xl border border-border/60 bg-background px-3 py-3">
                        <p className="line-clamp-2 text-sm font-semibold text-foreground">
                          {form.title.trim() || "Tiêu đề sẽ hiển thị ở đây"}
                        </p>
                        <div className="flex min-h-8 flex-wrap gap-2">
                          {form.hashtags.length ? (
                            form.hashtags.map((tagItem) => (
                              <Badge
                                key={tagItem}
                                variant="secondary"
                                className="rounded-full border border-border/60 bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-foreground"
                              >
                                #{tagItem}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Hashtags sẽ hiển thị ở đây
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 bg-muted/10 px-5 py-5 sm:px-6">
                <div className="overflow-hidden rounded-2xl border border-border/60 bg-background shadow-sm">
                  <div ref={previewVideoRef} className="relative bg-black">
                    {selectedVideo ? (
                      <video
                        key={selectedVideo.id}
                        className="block h-auto w-full max-h-[70vh] object-contain"
                        src={selectedVideo.url}
                        poster={getVideoThumbnail(selectedVideo) ?? undefined}
                        controls
                        preload="metadata"
                        playsInline
                      >
                        Trình duyệt không hỗ trợ phát video.
                      </video>
                    ) : (
                      <div className="flex min-h-80 items-center justify-center text-muted-foreground">
                        <Video className="h-10 w-10" />
                      </div>
                    )}

                    <div className="absolute left-3 top-3 flex gap-2">
                      <Badge
                        variant="secondary"
                        className="pointer-events-none rounded-full bg-black/70 px-3 py-1 text-[11px] text-white"
                      >
                        {selectedVideo ? selectedVideo.type : "Chưa chọn"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-3 rounded-2xl border border-border/60 bg-background p-4 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Thư viện video</p>
                  <p className="text-xs text-muted-foreground">
                    Chọn một thumbnail để gắn vào feed.
                  </p>
                </div>

                <div className="text-xs text-muted-foreground">
                  Hiển thị {visibleVideos.length}/{filteredVideos.length}
                </div>
              </div>

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
                    className="pl-9"
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
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              {candidateLoading ? (
                <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-5 text-sm text-muted-foreground">
                  Đang tải video...
                </div>
              ) : filteredVideos.length ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                    {visibleVideos.map((video) => {
                      const isSelected = String(video.id) === form.videoId;
                      const thumbnail = getVideoThumbnail(video);

                      return (
                        <button
                          key={video.id}
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              videoId: String(video.id),
                            }))
                          }
                          className={cn(
                            "group relative overflow-hidden rounded-2xl border bg-background text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
                            isSelected
                              ? "border-primary ring-2 ring-primary/20"
                              : "border-border/60",
                          )}
                        >
                          <div className="relative aspect-4/3 bg-muted">
                            {thumbnail ? (
                              <div
                                className="h-full w-full bg-cover bg-center transition-transform duration-300 group-hover:scale-[1.03]"
                                style={{ backgroundImage: `url(${thumbnail})` }}
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                <Video className="h-8 w-8" />
                              </div>
                            )}

                            <div className="absolute inset-0 bg-linear-to-t from-black/65 via-transparent to-transparent" />

                            <div className="absolute left-2 top-2 flex gap-1.5">
                              <Badge
                                variant="secondary"
                                className="rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-medium text-white"
                              >
                                {video.type}
                              </Badge>
                            </div>

                            {isSelected && (
                              <div className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                                <CheckCircle2 className="h-4 w-4" />
                              </div>
                            )}

                            <div className="absolute inset-x-0 bottom-0 p-2 text-white">
                              <p className="line-clamp-2 text-sm font-semibold leading-tight">
                                {video.name}
                              </p>
                              <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[11px] text-white/90">
                                <Clock3 className="h-3.5 w-3.5" />
                                {formatDuration(video.duration)}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/20 px-3 py-2">
                    <span className="text-xs text-muted-foreground">
                      {hasMoreVideos
                        ? `Đang xem ${visibleVideos.length} trong ${filteredVideos.length} video`
                        : `Đã hiển thị toàn bộ ${filteredVideos.length} video`}
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
                </div>
              ) : (
                <div className="flex min-h-48 items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/10 px-4 text-sm text-muted-foreground">
                  Không có video phù hợp.
                </div>
              )}
            </div>

            <div className="space-y-4 rounded-2xl border border-border/60 bg-background p-4 sm:p-5 shadow-sm lg:sticky lg:top-5">
              <div className="space-y-2">
                <Label htmlFor="feed-title">Tiêu đề</Label>
                <Input
                  id="feed-title"
                  value={form.title}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, title: event.target.value }))
                  }
                  placeholder="Nhập tiêu đề feed"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="feed-hashtags">Hashtags</Label>
                <div className="space-y-3 rounded-2xl border border-input bg-background p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {(form.hashtags ?? []).map((hashtag, index) => (
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
                            setForm((prev) => ({
                              ...prev,
                              hashtags: (prev.hashtags ?? []).filter(
                                (_, i) => i !== index,
                              ),
                            }))
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

              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <Button
                  asChild
                  variant="outline"
                  disabled={createFeedMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  <Link href={`/instructor/courses/${courseId}/feed`}>Hủy</Link>
                </Button>
                <Button
                  onClick={() => void handleCreate()}
                  disabled={createFeedMutation.isPending || !selectedVideo}
                  className="w-full sm:w-auto"
                >
                  {createFeedMutation.isPending ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang tạo...
                    </span>
                  ) : (
                    "Tạo feed"
                  )}
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </ManagementPageShell>
  );
}
