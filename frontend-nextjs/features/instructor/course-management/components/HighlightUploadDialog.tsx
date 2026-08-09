"use client";

import Image from "next/image";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowRight,
  CheckCircle2,
  Film,
  Loader2,
  Search,
  UploadCloud,
  X,
} from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import UploadDropzone from "@/features/upload/components/UploadDropzone";
import FilePreview from "@/features/upload/components/FilePreview";
import HighlightParamsForm from "@/features/upload/components/HighlightParamsForm";
import ResultsSection from "@/features/upload/components/ResultsSection";
import UploadProgress from "@/features/upload/components/UploadProgress";
import { useVideosByUser } from "@/features/video/api/video.hooks";
import { getVideoDurationFromFile } from "@/features/video/utils/get-video-duration-from-file";
import { QuotaNotice, useQuotaCost } from "@/features/_shared/quota";
import { cn } from "@/lib/utils";
import type {
  Clip,
  HighlightParams,
  UploadHookReturn,
} from "@/features/upload/types";
import type { Video as StudyLoopVideo } from "@/features/video/types";
import HighlightEditSheet, {
  type EditableHighlightVideo,
} from "@/features/highlight-edit/components/HighlightEditSheet";

type SourceMode = "file" | "existing-video";
const HIGHLIGHT_PARAMS_FORM_ID = "feed-highlight-params-form";
const VIDEOS_PER_PAGE = 6;

function formatVideoDuration(duration: number | null | undefined) {
  if (!duration || !Number.isFinite(duration)) return "--:--";

  const total = Math.max(0, Math.floor(duration));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function getVideoTitle(video: StudyLoopVideo) {
  return video.name?.trim() || `Video bài học #${video.id}`;
}

interface HighlightUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  upload: UploadHookReturn;
}

export function HighlightUploadDialog({
  open,
  onOpenChange,
  upload,
}: HighlightUploadDialogProps) {
  const router = useRouter();
  const {
    file,
    setFile,
    progress,
    status,
    jobId,
    clips,
    isDownloading,
    error,
    stage,
    progressPercent,
    jobType,
    sourceVideoId,
    sourceVideoUrl,
    startFileUpload,
    startUpload,
    startFromExistingVideo,
    ensureProjectForClip,
    cancel,
    reset,
  } = upload;

  const [sourceMode, setSourceMode] = React.useState<SourceMode>("file");
  const [paramsCanSubmit, setParamsCanSubmit] = React.useState(false);
  // Thời lượng nguồn để báo giá credit. Video đã có sẵn duration trong DB;
  // file mới thì phải tự đọc ở client.
  const [fileDurationSec, setFileDurationSec] = React.useState<
    number | undefined
  >(undefined);
  const [selectedExistingVideoId, setSelectedExistingVideoId] = React.useState<
    number | null
  >(null);
  const [existingVideoQuery, setExistingVideoQuery] = React.useState("");
  const [videoPage, setVideoPage] = React.useState(1);
  const [showForm, setShowForm] = React.useState(false);
  const previousOpenRef = React.useRef(open);
  const [editSegmentsVideo, setEditSegmentsVideo] =
    React.useState<EditableHighlightVideo | null>(null);
  const { data: lessonVideos = [], isLoading: lessonVideosLoading } =
    useVideosByUser("long", open && sourceMode === "existing-video");

  const filteredLessonVideos = React.useMemo(() => {
    const query = existingVideoQuery.trim().toLowerCase();
    if (!query) return lessonVideos;

    return lessonVideos.filter((video) =>
      `${getVideoTitle(video)} ${video.id}`.toLowerCase().includes(query),
    );
  }, [existingVideoQuery, lessonVideos]);

  const selectedExistingVideo = React.useMemo(
    () =>
      lessonVideos.find((video) => video.id === selectedExistingVideoId) ??
      null,
    [lessonVideos, selectedExistingVideoId],
  );

  const videoTotalPages = Math.max(
    1,
    Math.ceil(filteredLessonVideos.length / VIDEOS_PER_PAGE),
  );
  const paginatedLessonVideos = React.useMemo(() => {
    const start = (videoPage - 1) * VIDEOS_PER_PAGE;
    return filteredLessonVideos.slice(start, start + VIDEOS_PER_PAGE);
  }, [filteredLessonVideos, videoPage]);

  React.useEffect(() => {
    const reopened = open && !previousOpenRef.current;
    previousOpenRef.current = open;

    if (!reopened || status !== "failed") return;

    cancel();
    setShowForm(false);
    setParamsCanSubmit(false);
    setSelectedExistingVideoId(null);
    setExistingVideoQuery("");
    setVideoPage(1);
    setSourceMode("file");
  }, [cancel, open, status]);

  React.useEffect(() => {
    if (!open) {
      setShowForm(false);
      setSourceMode("file");
      setSelectedExistingVideoId(null);
      setExistingVideoQuery("");
      setVideoPage(1);
    }
  }, [open]);

  React.useEffect(() => {
    setVideoPage(1);
  }, [existingVideoQuery, sourceMode]);

  React.useEffect(() => {
    setVideoPage((currentPage) => Math.min(currentPage, videoTotalPages));
  }, [videoTotalPages]);

  React.useEffect(() => {
    if (!file) {
      setFileDurationSec(undefined);
      return;
    }
    let cancelled = false;
    void getVideoDurationFromFile(file).then((seconds) => {
      if (!cancelled) setFileDurationSec(seconds ?? undefined);
    });
    return () => {
      cancelled = true;
    };
  }, [file]);

  const sourceDurationSec =
    sourceMode === "file"
      ? fileDurationSec
      : (selectedExistingVideo?.duration ?? undefined);

  // Segment Selection Picker (specs/002-highlight-segment-picker-ui): needs a
  // real video_id. "existing-video" already has one the instant a lesson
  // video card is picked (no upload needed); "file" only gets one once the
  // pre-upload (ADR 0002, triggered below in the FilePreview onUpload
  // handler) resolves.
  const highlightVideoId =
    sourceMode === "file" ? sourceVideoId : (selectedExistingVideo?.id ?? null);
  const highlightVideoUrl =
    sourceMode === "file"
      ? sourceVideoUrl
      : (selectedExistingVideo?.url ?? null);

  const { cost: quotaCost, blocked: quotaBlocked } = useQuotaCost(
    "highlight",
    sourceDurationSec,
  );

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setShowForm(false);
    setParamsCanSubmit(false);
  };

  const handleFormSubmit = (params: HighlightParams) => {
    if (quotaBlocked) {
      toast.error("Bạn không còn đủ credit AI.");
      return;
    }
    if (sourceMode === "file") {
      if (!file) return;
      void startUpload(file, params, sourceDurationSec);
    } else {
      if (!selectedExistingVideo?.url) {
        toast.error("Vui lòng chọn một video bài học để tạo highlight.");
        return;
      }
      void startFromExistingVideo(
        selectedExistingVideo.url,
        params,
        sourceDurationSec,
        selectedExistingVideo.id,
      );
    }
    setShowForm(false);
    setParamsCanSubmit(false);
  };

  const handleRemoveFile = () => {
    cancel();
    setShowForm(false);
    setParamsCanSubmit(false);
  };

  const handleStartNew = () => {
    cancel();
    setShowForm(false);
    setParamsCanSubmit(false);
    setSelectedExistingVideoId(null);
    setExistingVideoQuery("");
    setSourceMode("file");
  };

  const handleRefineCriteria = () => {
    reset();
    setParamsCanSubmit(false);
    setShowForm(true);
  };

  const handleEditClip = async (clip: (typeof clips)[number]) => {
    if (!clip?.url) return;

    const ensured = await ensureProjectForClip(clip);
    const params = new URLSearchParams({ src: clip.url, from: "highlight" });

    if (ensured?.projectId) {
      params.set("edit_id", String(ensured.projectId));
    }
    if (ensured?.videoId) {
      params.set("video_id", String(ensured.videoId));
    } else if (clip.videoId) {
      params.set("video_id", String(clip.videoId));
    }

    router.push(`/editor?${params.toString()}`);
  };

  const handleEditSegments = (clip: Clip) => {
    if (clip.videoId == null) return;
    setEditSegmentsVideo({
      id: clip.videoId,
      srt_raw_url: clip.srtUrl ?? null,
      editing_job_id: null,
    });
  };

  const handleViewResults = async () => {
    if (clips.length === 1 && clips[0]?.url) {
      await handleEditClip(clips[0]);
      return;
    }

    document
      .querySelector("[data-feed-highlight-results]")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // ADR 0002 (see GraduationProject docs/adr): "uploading" now only ever
  // means the pre-upload phase (started when the file is confirmed, while
  // HighlightParamsForm is shown) — startUpload's submit phase goes
  // straight to "pending". Must NOT count as "processing" here either,
  // same fix as features/upload/index.tsx.
  const isProcessing = status === "pending" || status === "processing";
  const isCompleted = status === "completed" && clips.length > 0;
  const isFailed = status === "failed";
  const showSourceSwitcher =
    !file && !showForm && !isProcessing && !isCompleted && !isFailed;
  const isVideoPickerMode =
    sourceMode === "existing-video" && showSourceSwitcher;
  const isFilePickerMode = sourceMode === "file" && showSourceSwitcher;
  const isResultsMode = isCompleted;
  const showFooter =
    (showForm && !isProcessing && !isCompleted) || isVideoPickerMode;
  const dialogSizeClass =
    isVideoPickerMode || isResultsMode
      ? "h-[88dvh] !w-[92vw] !max-w-[1120px] max-sm:h-[94dvh]"
      : isFilePickerMode
        ? "h-auto !w-[90vw] !max-w-[980px] max-sm:max-h-[calc(100dvh-1rem)]"
        : "h-[calc(100dvh-40px)] !w-[min(1060px,calc(100vw-48px))] !max-w-[1060px] max-sm:h-[94dvh] max-sm:!w-[calc(100vw-1rem)]";

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) {
          setShowForm(false);
        }
      }}
    >
      <DialogContent
        showCloseButton={false}
        className={cn(
          "flex max-h-[900px] overflow-hidden rounded-2xl border border-border/70 p-0 shadow-2xl transition-[width,max-width,height,max-height] duration-200 max-sm:!w-[calc(100vw-1rem)] max-sm:rounded-xl",
          dialogSizeClass,
        )}
      >
        <div className="flex h-full min-h-0 w-full flex-col">
          <DialogHeader className="sticky top-0 z-10 shrink-0 border-b border-border/70 bg-background px-4 py-4 pr-12 text-left sm:px-6 sm:pr-14">
            <DialogTitle className="text-xl font-bold">
              Tạo highlight cho feed
            </DialogTitle>
            <DialogDescription className="space-y-1 text-sm text-muted-foreground">
              <span className="block">Chọn file hoặc video bài học đã upload, đặt tiêu chí rồi lưu kết quả vào thư viện feed.</span>
            </DialogDescription>
            <DialogClose asChild>
              <button
                type="button"
                className="absolute right-4 top-3.5 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Đóng"
              >
                <X className="h-4 w-4" />
              </button>
            </DialogClose>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden px-4 py-4 pb-5 sm:px-5">
            {showSourceSwitcher && (
              <Tabs
                value={sourceMode}
                onValueChange={(value) => {
                  setSourceMode(value as SourceMode);
                  setShowForm(false);
                }}
              >
                <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-lg p-1">
                  <TabsTrigger value="file" className="gap-2 py-2">
                    <UploadCloud className="h-4 w-4" />
                    Tải từ máy
                  </TabsTrigger>
                  <TabsTrigger value="existing-video" className="gap-2 py-2">
                    <Film className="h-4 w-4" />
                    Video bài học
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="file" className="mt-4">
                  <UploadDropzone
                    onFileSelect={handleFileSelect}
                    title="Kéo video bài giảng vào đây"
                    subtitle="hoặc"
                    variant="hero"
                  />
                </TabsContent>

                <TabsContent value="existing-video" className="mt-3">
                  <div className="space-y-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold">Chọn video bài học</h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {filteredLessonVideos.length} video khả dụng trong thư viện bài học.
                        </p>
                      </div>
                      <div className="relative w-full min-w-0 sm:max-w-[22rem]">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={existingVideoQuery}
                          onChange={(event) =>
                            setExistingVideoQuery(event.target.value)
                          }
                          placeholder="Tìm video bài học..."
                          className="h-10 pl-9"
                        />
                      </div>
                    </div>
                    {selectedExistingVideo ? (
                      <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-primary">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span className="min-w-0 truncate">
                          Đã chọn: {getVideoTitle(selectedExistingVideo)}
                        </span>
                      </div>
                    ) : null}

                    {lessonVideosLoading ? (
                      <div className="flex min-h-52 items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang tải video bài học...
                      </div>
                    ) : filteredLessonVideos.length > 0 ? (
                      <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {paginatedLessonVideos.map((video) => {
                          const selected = video.id === selectedExistingVideoId;

                          return (
                            <button
                              key={video.id}
                              type="button"
                              onClick={() =>
                                setSelectedExistingVideoId(video.id)
                              }
                              className={cn(
                                "group min-w-0 cursor-pointer overflow-hidden rounded-xl border bg-card text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                selected
                                  ? "border-primary shadow-md ring-2 ring-primary/20"
                                  : "border-border/70",
                              )}
                            >
                              <div className="relative aspect-video bg-muted">
                                {video.thumbnail ? (
                                  <Image src={video.thumbnail} alt={getVideoTitle(video)} fill sizes="(max-width: 768px) 100vw, 280px" className="object-cover transition group-hover:scale-[1.02]" />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                    <Film className="h-8 w-8" />
                                  </div>
                                )}
                                <span className="absolute bottom-2 right-2 rounded bg-black/75 px-1.5 py-0.5 text-[11px] font-medium text-white">
                                  {formatVideoDuration(video.duration)}
                                </span>
                                {selected ? (
                                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-1 text-[11px] font-semibold text-primary-foreground">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Đã chọn
                                  </span>
                                ) : null}
                              </div>
                              <div className="space-y-1 p-3">
                                <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground break-words">
                                  {getVideoTitle(video)}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center">
                        <Film className="h-8 w-8 text-muted-foreground" />
                        <p className="mt-3 text-sm font-semibold">
                          Chưa có video bài học phù hợp
                        </p>
                        <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
                          Hãy upload video long trong bài học trước, rồi quay
                          lại tạo highlight cho feed.
                        </p>
                      </div>
                    )}

                    {filteredLessonVideos.length > VIDEOS_PER_PAGE ? (
                      <div className="flex items-center justify-between gap-3 border-t border-border/70 pt-3 text-xs text-muted-foreground sm:text-sm">
                        <span className="shrink-0">
                          Trang {videoPage} / {videoTotalPages}
                        </span>
                        <Pagination className="mx-0 w-auto">
                          <PaginationContent className="gap-0.5 sm:gap-1">
                            <PaginationItem>
                              <PaginationPrevious
                                href="#"
                                size="icon"
                                aria-disabled={videoPage <= 1}
                                className={cn(
                                  "size-8 cursor-pointer sm:size-9",
                                  videoPage <= 1 &&
                                    "pointer-events-none opacity-50",
                                )}
                                onClick={(event) => {
                                  event.preventDefault();
                                  setVideoPage((page) => Math.max(1, page - 1));
                                }}
                              />
                            </PaginationItem>
                            {Array.from(
                              { length: videoTotalPages },
                              (_, index) => index + 1,
                            ).map((pageNumber) => (
                              <PaginationItem key={pageNumber}>
                                <PaginationLink
                                  href="#"
                                  size="icon"
                                  isActive={pageNumber === videoPage}
                                  className="size-8 cursor-pointer text-xs sm:size-9 sm:text-sm"
                                  onClick={(event) => {
                                    event.preventDefault();
                                    setVideoPage(pageNumber);
                                  }}
                                >
                                  {pageNumber}
                                </PaginationLink>
                              </PaginationItem>
                            ))}
                            <PaginationItem>
                              <PaginationNext
                                href="#"
                                size="icon"
                                aria-disabled={videoPage >= videoTotalPages}
                                className={cn(
                                  "size-8 cursor-pointer sm:size-9",
                                  videoPage >= videoTotalPages &&
                                    "pointer-events-none opacity-50",
                                )}
                                onClick={(event) => {
                                  event.preventDefault();
                                  setVideoPage((page) =>
                                    Math.min(videoTotalPages, page + 1),
                                  );
                                }}
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      </div>
                    ) : null}
                  </div>
                </TabsContent>
              </Tabs>
            )}

            {sourceMode === "file" &&
              file &&
              !showForm &&
              !isProcessing &&
              !isCompleted && (
                <FilePreview
                  file={file}
                  onRemove={handleRemoveFile}
                  onUpload={() => {
                    // ADR 0002: start the Bunny upload now, in parallel with
                    // the params form, instead of waiting for form submit —
                    // so video_id is available while the form is still open.
                    void startFileUpload(file);
                    setShowForm(true);
                  }}
                  isUploading={false}
                />
              )}

            {showForm && !isProcessing && !isCompleted && (
              <QuotaNotice
                feature="highlight"
                durationSec={sourceDurationSec}
                className="mb-3"
              />
            )}

            {showForm && !isProcessing && !isCompleted && (
              <HighlightParamsForm
                formId={HIGHLIGHT_PARAMS_FORM_ID}
                onSubmit={handleFormSubmit}
                onCancel={() => setShowForm(false)}
                isSubmitting={false}
                noCard={true}
                compact
                hideActions
                isUploadingSource={sourceMode === "file" && status === "uploading"}
                uploadProgress={sourceMode === "file" ? progress : null}
                uploadError={
                  sourceMode === "file" && status === "failed" ? error : null
                }
                videoId={highlightVideoId}
                videoUrl={highlightVideoUrl}
                onCanSubmitChange={setParamsCanSubmit}
              />
            )}

            {(isProcessing || isCompleted || (isFailed && !showForm)) && (
              <UploadProgress
                progress={progress}
                status={status}
                jobId={jobId}
                isDownloading={isDownloading}
                clipsCount={clips.length}
                error={error}
                stage={stage}
                progressPercent={progressPercent}
                jobType={jobType}
                onViewResults={handleViewResults}
                onStartNew={handleStartNew}
                onRefineCriteria={handleRefineCriteria}
                onClose={() => onOpenChange(false)}
              />
            )}

            <div data-feed-highlight-results>
              <ResultsSection
                clips={clips}
                isVisible={isCompleted}
                onEditClip={handleEditClip}
                onStartNew={handleStartNew}
                onEditSegments={handleEditSegments}
                onRefineCriteria={handleRefineCriteria}

              />
            </div>
          </div>

          {showFooter ? (
            <div className="sticky bottom-0 flex w-full shrink-0 items-center justify-end gap-3 border-t border-border/70 bg-background px-4 py-3 sm:px-5">
              {showForm && !isProcessing && !isCompleted ? (
                <div className="flex w-full flex-col-reverse gap-3 sm:w-auto sm:min-w-[420px] sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    className="h-10 flex-1 px-5 text-xs font-semibold shadow-sm"
                  >
                    Quay lại
                  </Button>
                  <Button
                    type="submit"
                    form={HIGHLIGHT_PARAMS_FORM_ID}
                    disabled={quotaBlocked || !paramsCanSubmit}
                    className="h-10 flex-1 px-5 text-xs font-semibold shadow-sm"
                  >
                    Tạo highlight{quotaCost ? ` · ${quotaCost} credit` : ""}
                  </Button>
                </div>
              ) : isVideoPickerMode ? (
                <Button
                  type="button"
                  onClick={() => setShowForm(true)}
                  disabled={!selectedExistingVideo?.url}
                  className={cn(
                    "h-10 w-full gap-2 px-5 text-xs font-semibold shadow-sm sm:w-auto sm:min-w-[260px]",
                    !selectedExistingVideo?.url &&
                      "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400 opacity-100 hover:bg-slate-100 dark:border-border dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted",
                  )}
                >
                  Tiếp tục thiết lập highlight
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </DialogContent>

      <HighlightEditSheet
        video={editSegmentsVideo}
        open={!!editSegmentsVideo}
        onOpenChange={(next) => {
          if (!next) setEditSegmentsVideo(null);
        }}
      />
    </Dialog>
  );
}
