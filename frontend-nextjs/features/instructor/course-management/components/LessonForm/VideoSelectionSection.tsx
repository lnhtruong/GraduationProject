"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, Clapperboard, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useLessonVideoUpload } from "@/features/video/upload/useLessonVideoUpload";
import { getVideoDurationFromFile } from "@/features/video/utils/get-video-duration-from-file";
import { useVideoById } from "@/features/video/api/video.hooks";
import { getVideoCardTitle, formatDuration } from "../../utils/lesson-form.utils";
import { VideoPreview } from "./VideoPreview";
import type { QuizTimelineMarker } from "../../utils/quiz-timeline.utils";
import { getUserFacingErrorMessage } from "@/lib/user-facing-error";

interface Video {
  id: number;
  url?: string | null;
  duration?: number | null;
  created_at?: string;
  type?: string;
  thumbnail?: string | null;
  name?: string | null;
}

interface Props {
  videosLoading: boolean;
  userVideos?: Video[] | null;
  selectedVideoId: number | null;
  onVideoSelect: (videoId: number | null) => void;
  onRefreshVideos?: () => Promise<void>;
  onDraftVideoChange?: (draftVideo: {
    blobUrl: string | null;
    durationSeconds: number | null;
    fileName: string | null;
  }) => void;
  courseId: number;
  lessonId?: number | null;
  isEdit?: boolean;
  onOpenCreateQuizModal?: () => void;
  onPendingCreateQuiz?: () => void;
  onUploadStateChange?: (isUploading: boolean) => void;
  timelineMarkers?: QuizTimelineMarker[];
  isProcessing?: boolean;
}

function VideoThumbnail({
  thumbnail,
  title,
}: {
  thumbnail?: string | null;
  title: string;
}) {
  const [error, setError] = useState(false);

  if (thumbnail === "processing") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-xs text-muted-foreground bg-muted/20 animate-pulse">
        <Loader2 className="h-4.5 w-4.5 animate-spin text-primary" />
        <span>Đang xử lý video...</span>
      </div>
    );
  }

  if (error || !thumbnail) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-[11px] text-muted-foreground/60 bg-muted/40">
        <Clapperboard className="h-5 w-5 text-muted-foreground/40" />
        <span>Không có ảnh thu nhỏ</span>
      </div>
    );
  }

  return (
    <img
      src={thumbnail}
      alt={title}
      onError={() => setError(true)}
      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
    />
  );
}

export function VideoSelectionSection({
  videosLoading,
  userVideos,
  selectedVideoId,
  onVideoSelect,
  onRefreshVideos,
  onDraftVideoChange,
  courseId,
  lessonId,
  onUploadStateChange,
  timelineMarkers = [],
  isProcessing = false,
}: Props) {
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewFileName, setPreviewFileName] = useState<string | null>(null);
  const [previewDuration, setPreviewDuration] = useState<number | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const selectedUploadVideoRef = useRef<number | null>(null);
  const onDraftVideoChangeRef = useRef(onDraftVideoChange);

  useEffect(() => {
    onDraftVideoChangeRef.current = onDraftVideoChange;
  }, [onDraftVideoChange]);

  // Video Library Pagination
  const PAGE_SIZE = 6;
  const [page, setPage] = useState(1);
  const totalItems = userVideos?.length ?? 0;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE) || 1;

  useEffect(() => {
    if (page > totalPages) {
      const timer = window.setTimeout(() => setPage(totalPages), 0);
      return () => window.clearTimeout(timer);
    }
  }, [page, totalPages]);

  const displayedVideos = useMemo(() => {
    if (!userVideos) return [];
    const startIndex = (page - 1) * PAGE_SIZE;
    return userVideos.slice(startIndex, startIndex + PAGE_SIZE);
  }, [userVideos, page]);


  const {
    session,
    startUpload,
    retryUpload,
    cancelUpload,
    clearSession,
    isUploading,
  } = useLessonVideoUpload();

  useEffect(() => {
    onUploadStateChange?.(isUploading);
  }, [isUploading, onUploadStateChange]);

  useEffect(() => {
    return () => {
      if (previewBlobUrl) {
        URL.revokeObjectURL(previewBlobUrl);
      }
    };
  }, [previewBlobUrl]);

  useEffect(() => {
    return () => {
      onDraftVideoChangeRef.current?.({
        blobUrl: null,
        durationSeconds: null,
        fileName: null,
      });
    };
  }, []);

  useEffect(() => {
    if (!session.videoId) return;
    if (selectedUploadVideoRef.current === session.videoId) return;
    selectedUploadVideoRef.current = session.videoId;
    onVideoSelect(session.videoId);
  }, [session.videoId, onVideoSelect]);

  const onPickFile = () => {
    if (isUploading) return;
    fileInputRef.current?.click();
  };

  const handleSelectedFile = async (file: File | null) => {
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast.error("Vui lòng chọn file video hợp lệ.");
      return;
    }

    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
    }

    const blobUrl = URL.createObjectURL(file);
    const fileName = file.name;
    setPreviewBlobUrl(blobUrl);
    setPreviewFileName(fileName);
    onDraftVideoChangeRef.current?.({
      blobUrl,
      durationSeconds: null,
      fileName,
    });

    void getVideoDurationFromFile(file).then((durationSeconds) => {
      setPreviewDuration(durationSeconds);
      onDraftVideoChangeRef.current?.({
        blobUrl,
        durationSeconds,
        fileName,
      });
    });

    try {
      await startUpload({
        file,
        title: file.name,
        courseId,
        lessonId,
        onCompleted: async (videoId) => {
          await onRefreshVideos?.();
          onVideoSelect(videoId);
        },
      });
    } catch (error) {
      toast.error(
        getUserFacingErrorMessage(
          error,
          "Không thể bắt đầu upload. Vui lòng thử lại.",
        ),
      );
    }
  };

  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    await handleSelectedFile(file);
  };

  const onDropFile = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    if (isUploading) return;
    const file = event.dataTransfer.files?.[0] ?? null;
    await handleSelectedFile(file);
  };

  const { data: selectedVideo } = useVideoById(
    selectedVideoId,
    Boolean(selectedVideoId)
  );

  const handleClearSelection = () => {
    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
    }
    setPreviewBlobUrl(null);
    setPreviewFileName(null);
    setPreviewDuration(null);
    clearSession();
    onVideoSelect(null);
    onDraftVideoChangeRef.current?.({
      blobUrl: null,
      durationSeconds: null,
      fileName: null,
    });
  };

  const hasActiveVideo = Boolean(selectedVideoId || previewBlobUrl);
  const videoUrl = previewBlobUrl ?? selectedVideo?.url ?? null;
  const videoName = previewFileName ?? (selectedVideo ? getVideoCardTitle(selectedVideo.name, selectedVideo.id) : "Đang tải thông tin video...");
  const durationSec = previewDuration ?? selectedVideo?.duration ?? null;
  const formattedDur = formatDuration(durationSec);

  let statusText = "";
  if (previewBlobUrl) {
    if (session.status === "uploading" || session.status === "initializing") {
      statusText = "Đang tải lên...";
    } else if (session.status === "failed") {
      statusText = "Lỗi tải lên";
    } else if (session.status !== "completed") {
      statusText = "Đang chuẩn bị";
    }
  }

  const showStatus = session.status !== "idle";

  return (
    <div className="grid gap-4 min-w-0">
      {/* Header section (only show if not active video or if we want labels) */}
      <div className="flex items-center justify-between gap-2">
        <Label className="text-sm font-semibold text-foreground/90">
          {hasActiveVideo ? "Video bài học đã chọn" : "Chọn video bài học"}
        </Label>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={onFileChange}
      />

      {hasActiveVideo ? (
        <div className="space-y-4 min-w-0">
          <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm transition hover:shadow-md">
            {/* Header info */}
            <div className="flex items-center gap-3 border-b border-border/60 bg-muted/40 px-4 py-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary shadow-inner">
                <Clapperboard className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="line-clamp-2 text-sm font-semibold text-foreground leading-snug break-words">
                  {videoName}
                </h4>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                  <span>Thời lượng: {formattedDur}</span>
                  {statusText && (
                    <>
                      <span>•</span>
                      <Badge variant="secondary" className="h-4.5 px-1.5 py-0 text-[10px] font-medium leading-none">
                        {statusText}
                      </Badge>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Inline Video Player Preview */}
            <div className="p-4 border-t border-border/50 bg-background/50">
              <VideoPreview
                courseId={courseId}
                lessonId={lessonId ?? 0}
                videoUrl={videoUrl}
                videoDurationSeconds={durationSec ?? 0}
                videoLoading={videosLoading}
                timelineMarkers={timelineMarkers}
                isProcessing={isProcessing}
                thumbnailUrl={selectedVideo?.thumbnail}
              />
            </div>


            {/* Actions Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 bg-muted/20 px-4 py-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearSelection}
                className="h-9 text-xs font-medium hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Chọn video khác
              </Button>
            </div>
          </div>

          {/* Upload progress if active */}
          {showStatus && (
            <div className="rounded-xl border border-border/60 bg-background/80 px-4 py-3.5 text-xs shadow-sm">
              <div className="flex items-center justify-between gap-2 font-medium">
                {session.status === "processing" ? (
                  <p className="text-foreground flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                    Video vẫn đang được xử lý.
                  </p>
                ) : session.status === "initializing" ? (
                  <p className="text-foreground">Đang khởi tạo upload...</p>
                ) : session.status === "uploading" ? (
                  <p className="text-foreground">
                    Đang upload...{" "}
                    <span className="font-semibold text-primary">
                      {Math.max(0, Math.min(100, session.progressPercent))}%
                    </span>
                  </p>
                ) : session.status === "completed" ? (
                  <p className="text-green-600 dark:text-green-400">Upload hoàn tất.</p>
                ) : session.status === "failed" ? (
                  <p className="text-destructive">
                    {getUserFacingErrorMessage(
                      session.error,
                      "Upload thất bại. Vui lòng thử lại.",
                    )}
                  </p>
                ) : session.status === "canceled" ? (
                  <p className="text-muted-foreground">Đã hủy upload.</p>
                ) : null}
              </div>

              {(session.status === "uploading" ||
                session.status === "initializing") && (
                <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted shadow-inner">
                  <div
                    className="h-full bg-primary transition-[width] duration-300 rounded-full"
                    style={{
                      width: `${Math.max(0, Math.min(100, session.progressPercent))}%`,
                    }}
                  />
                </div>
              )}

              <div className="mt-3 flex items-center gap-2">
                {(session.status === "uploading" ||
                  session.status === "initializing") && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-[11px] font-medium"
                    onClick={() => {
                      void cancelUpload();
                    }}
                  >
                    Hủy upload
                  </Button>
                )}
                {(session.status === "failed" || session.status === "canceled") && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-[11px] font-medium"
                    onClick={() => {
                      void retryUpload();
                    }}
                  >
                    Thử lại
                  </Button>
                )}
                {(session.status === "failed" ||
                  session.status === "canceled" ||
                  session.status === "completed") && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg border-border/70 px-3 text-[11px] font-semibold text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                    onClick={clearSession}
                  >
                    Ẩn thông báo
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6 animate-fadeIn">
          {/* Upload Zone */}
          <div
            role="button"
            tabIndex={0}
            onClick={onPickFile}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onPickFile();
              }
            }}
            onDragOver={(event) => {
              event.preventDefault();
              if (!isUploading) setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={onDropFile}
            className={`group flex min-h-40 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition-all duration-200 ${
              isDragOver
                ? "border-primary bg-primary/5 ring-4 ring-primary/10"
                : "border-border bg-background/50 hover:border-primary/50 hover:bg-muted/30"
            } ${isUploading ? "pointer-events-none opacity-70" : ""}`}
          >
            <div className="mb-3.5 grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110 shadow-sm">
              {isUploading ? (
                <Loader2 className="h-5.5 w-5.5 animate-spin" />
              ) : (
                <Upload className="h-5.5 w-5.5" />
              )}
            </div>
            <p className="text-sm font-semibold text-foreground/95">
              Kéo thả video vào đây hoặc bấm để chọn file
            </p>
            <p className="mt-1 text-xs text-muted-foreground/80">
              Hỗ trợ: MP4, MOV, AVI, WEBM, MKV (Tối đa 1GB)
            </p>
          </div>

          {/* Library Grid */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <h5 className="text-xs font-semibold text-muted-foreground">
                Hoặc chọn từ thư viện của bạn
              </h5>
              {!!userVideos?.length && (
                <Badge variant="secondary" className="h-4.5 px-1.5 text-[9px] font-medium leading-none bg-muted text-muted-foreground rounded-md">
                  {userVideos.length}
                </Badge>
              )}
            </div>

            {videosLoading ? (
              <div className="flex items-center justify-center rounded-xl border border-dashed border-border/80 p-8 text-xs text-muted-foreground bg-muted/10">
                <Loader2 className="h-4 w-4 animate-spin mr-2 text-primary" />
                Đang tải thư viện video...
              </div>
            ) : userVideos?.length ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {displayedVideos.map((video: Video) => {
                    const isSelected = selectedVideoId === video.id;
                    const durLabel = formatDuration(video.duration);
                    return (
                      <button
                        key={video.id}
                        type="button"
                        onClick={() => onVideoSelect(video.id)}
                        className={`group relative overflow-hidden rounded-xl border text-left bg-card transition-all duration-200 hover:shadow-sm ${
                          isSelected
                            ? "border-primary ring-2 ring-primary/20 shadow-sm"
                            : "border-border/80 hover:border-primary/40"
                        }`}
                      >
                        <div className="relative aspect-video bg-muted/40 overflow-hidden">
                          <VideoThumbnail
                            thumbnail={video.thumbnail}
                            title={getVideoCardTitle(video.name, video.id)}
                          />
                          {durLabel !== "--:--" && (
                            <span className="absolute bottom-1.5 right-1.5 rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-medium text-white tracking-wide leading-none shadow-sm">
                              {durLabel}
                            </span>
                          )}
                        </div>
                        <div className="space-y-1.5 p-3">
                          <p className="line-clamp-2 text-xs font-semibold leading-relaxed text-foreground/90 group-hover:text-primary transition-colors">
                            {getVideoCardTitle(video.name, video.id)}
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                            <span>{video.created_at ? new Date(video.created_at).toLocaleDateString("vi-VN") : ""}</span>
                            {isSelected && (
                              <Badge variant="default" className="h-4.5 px-1.5 text-[9px] font-medium leading-none">
                                Đã chọn
                              </Badge>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-border/40 mt-4 pt-3">
                    <span className="text-[11px] text-muted-foreground font-medium">
                      Hiển thị {Math.min((page - 1) * PAGE_SIZE + 1, totalItems)}–{Math.min(page * PAGE_SIZE, totalItems)} / {totalItems} video
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 rounded-lg cursor-pointer"
                        disabled={page <= 1}
                        onClick={() => setPage(page - 1)}
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </Button>
                      <span className="min-w-[50px] text-center text-[11px] font-semibold text-muted-foreground">
                        Trang {page} / {totalPages}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 rounded-lg cursor-pointer"
                        disabled={page >= totalPages}
                        onClick={() => setPage(page + 1)}
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-border/80 p-8 text-center text-xs text-muted-foreground bg-muted/10">
                Thư viện chưa có video nào. Hãy tải lên video đầu tiên của bạn ở trên.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
