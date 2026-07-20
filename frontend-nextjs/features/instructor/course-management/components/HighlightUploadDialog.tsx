"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CheckCircle2,
  Film,
  Loader2,
  Search,
  UploadCloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
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
import { cn } from "@/lib/utils";
import type { HighlightParams, UploadHookReturn } from "@/features/upload/types";
import type { Video as StudyLoopVideo } from "@/features/video/types";

type SourceMode = "file" | "existing-video";

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
    startUpload,
    startFromExistingVideo,
    ensureProjectForClip,
    cancel,
  } = upload;

  const [sourceMode, setSourceMode] = React.useState<SourceMode>("file");
  const [selectedExistingVideoId, setSelectedExistingVideoId] =
    React.useState<number | null>(null);
  const [existingVideoQuery, setExistingVideoQuery] = React.useState("");
  const [showForm, setShowForm] = React.useState(false);
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

  React.useEffect(() => {
    if (!open) {
      setShowForm(false);
      setSourceMode("file");
      setSelectedExistingVideoId(null);
      setExistingVideoQuery("");
    }
  }, [open]);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setShowForm(false);
  };

  const handleFormSubmit = (params: HighlightParams) => {
    if (sourceMode === "file") {
      if (!file) return;
      void startUpload(file, params);
    } else {
      if (!selectedExistingVideo?.url) {
        toast.error("Vui lòng chọn một video bài học để tạo highlight.");
        return;
      }
      void startFromExistingVideo(selectedExistingVideo.url, params);
    }
    setShowForm(false);
  };

  const handleRemoveFile = () => {
    cancel();
    setShowForm(false);
  };

  const handleStartNew = () => {
    cancel();
    setShowForm(false);
    setSelectedExistingVideoId(null);
    setExistingVideoQuery("");
    setSourceMode("file");
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

  const handleViewResults = async () => {
    if (clips.length === 1 && clips[0]?.url) {
      await handleEditClip(clips[0]);
      return;
    }

    document
      .querySelector("[data-feed-highlight-results]")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const isProcessing =
    status === "uploading" || status === "pending" || status === "processing";
  const isCompleted = status === "completed" && clips.length > 0;
  const isFailed = status === "failed";
  const showSourceSwitcher =
    !file && !showForm && !isProcessing && !isCompleted && !isFailed;
  const isVideoPickerMode =
    sourceMode === "existing-video" && showSourceSwitcher;
  const isResultsMode = isCompleted;
  const isScrollableMode = isVideoPickerMode || isResultsMode;
  const dialogSizeClass =
    isVideoPickerMode || isResultsMode
      ? "h-[82vh] !w-[1100px] !max-w-[94vw]"
      : "h-auto max-h-[86vh] !w-[720px] !max-w-[92vw]";

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
        className={cn(
          "flex overflow-hidden rounded-2xl border border-border/70 p-0 shadow-2xl transition-[width,max-width,height,max-height] duration-200",
          dialogSizeClass,
        )}
      >
        <div
          className={cn(
            "flex min-h-0 w-full flex-col",
            isScrollableMode ? "h-full" : "h-auto",
          )}
        >
          <DialogHeader className="sticky top-0 z-10 border-b border-border/70 bg-background px-5 py-4 text-left sm:px-6">
            <DialogTitle className="text-xl font-bold">
              Tạo highlight cho feed
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Chọn file hoặc video bài học đã upload, đặt tiêu chí cắt rồi lưu
              kết quả vào thư viện feed.
            </DialogDescription>
          </DialogHeader>

          <div
            className={cn(
              "w-full space-y-4 overflow-x-hidden px-5 py-5 sm:px-6",
              isScrollableMode
                ? "min-h-0 flex-1 overflow-y-auto"
                : "overflow-y-visible",
            )}
          >
            {showSourceSwitcher && (
              <Tabs
                value={sourceMode}
                onValueChange={(value) => {
                  setSourceMode(value as SourceMode);
                  setShowForm(false);
                }}
              >
                <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-lg p-1">
                  <TabsTrigger value="file" className="gap-2 py-2.5">
                    <UploadCloud className="h-4 w-4" />
                    Tải từ máy
                  </TabsTrigger>
                  <TabsTrigger value="existing-video" className="gap-2 py-2.5">
                    <Film className="h-4 w-4" />
                    Video bài học
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="file" className="mt-4">
                  <UploadDropzone
                    onFileSelect={handleFileSelect}
                    title="Kéo video bài giảng vào đây"
                    subtitle="hoặc"
                    variant="compact"
                  />
                </TabsContent>

                <TabsContent value="existing-video" className="mt-4">
                  <div className="space-y-4 rounded-xl border border-border/70 bg-background p-4 shadow-none sm:p-5">
                    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(15rem,20rem)] lg:items-start">
                      <div className="min-w-0">
                        <h2 className="font-semibold">Chọn video bài học</h2>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          Dùng video long đã upload trong kho bài học của bạn để
                          cắt highlight cho feed.
                        </p>
                      </div>
                      <div className="relative min-w-0">
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

                    {lessonVideosLoading ? (
                      <div className="flex min-h-52 items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang tải video bài học...
                      </div>
                    ) : filteredLessonVideos.length > 0 ? (
                      <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {filteredLessonVideos.map((video) => {
                          const selected =
                            video.id === selectedExistingVideoId;

                          return (
                            <button
                              key={video.id}
                              type="button"
                              onClick={() =>
                                setSelectedExistingVideoId(video.id)
                              }
                              className={cn(
                                "group min-w-0 cursor-pointer overflow-hidden rounded-xl border bg-card text-left shadow-sm transition hover:border-primary/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                selected
                                  ? "border-primary ring-2 ring-primary/20"
                                  : "border-border/70",
                              )}
                            >
                              <div className="relative aspect-video bg-muted">
                                {video.thumbnail ? (
                                  <img
                                    src={video.thumbnail}
                                    alt={getVideoTitle(video)}
                                    className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                                  />
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
                                <p className="text-xs text-muted-foreground">
                                  Video bài học #{video.id}
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
                          Hãy upload video long trong bài học trước, rồi quay lại
                          tạo highlight cho feed.
                        </p>
                      </div>
                    )}

                    <Button
                      type="button"
                      onClick={() => setShowForm(true)}
                      disabled={!selectedExistingVideo?.url}
                      className={cn(
                        "h-11 w-full font-medium transition-all duration-200",
                        !selectedExistingVideo?.url &&
                          "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400 opacity-100 hover:bg-slate-100 dark:border-border dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted",
                      )}
                    >
                      Chọn cách cắt highlight
                    </Button>
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
                  onUpload={() => setShowForm(true)}
                  isUploading={false}
                />
              )}

            {showForm && !isProcessing && !isCompleted && (
              <HighlightParamsForm
                onSubmit={handleFormSubmit}
                onCancel={() => setShowForm(false)}
                isSubmitting={false}
                noCard={true}
              />
            )}

            {(isProcessing || isCompleted || isFailed) && (
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
                onClose={() => onOpenChange(false)}
              />
            )}

            <div data-feed-highlight-results>
              <ResultsSection
                clips={clips}
                isVisible={isCompleted}
                onEditClip={handleEditClip}
                onStartNew={handleStartNew}
              />
            </div>
          </div>

          <div className="sticky bottom-0 flex w-full items-center justify-between gap-3 border-t border-border/70 bg-background px-5 py-4 sm:px-6">
            <div className="text-xs text-muted-foreground">
              {isCompleted
                ? "Xử lý video hoàn tất"
                : isProcessing
                  ? "Đang xử lý..."
                  : "Sẵn sàng chọn video"}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9 px-4 text-xs font-semibold shadow-sm"
            >
              Đóng
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
