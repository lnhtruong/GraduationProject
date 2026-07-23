"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, Clapperboard, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useLessonVideoUpload } from "@/features/video/upload/useLessonVideoUpload";
import { createMediaUploadStream } from "@/features/_shared/realtime/media-upload-stream";
import { getVideoDurationFromFile } from "@/features/video/utils/get-video-duration-from-file";
import { useVideoById, videoKeys } from "@/features/video/api/video.hooks";
import { useAuthState } from "@/features/auth/hooks/useAuth";
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

function VideoHeaderThumbnail({
  thumbnail,
  title,
}: {
  thumbnail?: string | null;
  title: string;
}) {
  const [error, setError] = useState(false);
  const thumbnailSrc =
    typeof thumbnail === "string" &&
    thumbnail !== "processing" &&
    !/placehold\.co\/320x180\/png\?text=thumbnail/i.test(thumbnail)
      ? thumbnail
      : null;

  if (!thumbnailSrc || error) {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary shadow-inner">
        <Clapperboard className="h-5 w-5" />
      </div>
    );
  }

  return (
    <img
      src={thumbnailSrc}
      alt={title}
      onError={() => setError(true)}
      className="h-10 w-10 shrink-0 rounded-lg border border-border/70 object-cover shadow-inner"
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
  const queryClient = useQueryClient();
  const { user } = useAuthState();
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewFileName, setPreviewFileName] = useState<string | null>(null);
  const [previewDuration, setPreviewDuration] = useState<number | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isVideoPickerOpen, setIsVideoPickerOpen] = useState(!selectedVideoId);
  const [isVideoSseConnected, setIsVideoSseConnected] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const refreshedUploadVideoRef = useRef<number | null>(null);
  const autoSelectedSessionVideoRef = useRef<number | null>(null);
  const onDraftVideoChangeRef = useRef(onDraftVideoChange);
  const uploadSessionStorageKey = `lessonUploadSession:${courseId}:${lessonId ?? "new"}`;

  const {
    session,
    startUpload,
    retryUpload,
    clearSession,
    isUploadBlocking,
  } = useLessonVideoUpload({ storageKey: uploadSessionStorageKey });

  useEffect(() => {
    onDraftVideoChangeRef.current = onDraftVideoChange;
  }, [onDraftVideoChange]);

  // Video Library Pagination
  const PAGE_SIZE = 6;
  const [page, setPage] = useState(1);

  const libraryVideos = useMemo(() => {
    const videos = userVideos ?? [];
    if (!session.videoId) return videos;

    const hasPendingUploadRow = videos.some(
      (video) => String(video.id) === String(session.videoId),
    );
    if (hasPendingUploadRow) return videos;

    return [
      {
        id: session.videoId,
        url: session.readyVideoUrl ?? session.initialVideoUrl,
        duration: previewDuration,
        created_at: new Date().toISOString(),
        type: "long",
        thumbnail:
          session.status === "initializing" ||
          session.status === "uploading" ||
          session.status === "processing"
            ? "processing"
            : null,
        name: session.fileName,
      },
      ...videos,
    ];
  }, [
    previewDuration,
    session.fileName,
    session.initialVideoUrl,
    session.readyVideoUrl,
    session.status,
    session.videoId,
    userVideos,
  ]);

  const totalItems = libraryVideos.length;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE) || 1;

  const displayedVideos = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return libraryVideos.slice(startIndex, startIndex + PAGE_SIZE);
  }, [libraryVideos, page]);

  useEffect(() => {
    if (page > totalPages) {
      const timer = window.setTimeout(() => setPage(totalPages), 0);
      return () => window.clearTimeout(timer);
    }
  }, [page, totalPages]);

  useEffect(() => {
    onUploadStateChange?.(isUploadBlocking);
  }, [isUploadBlocking, onUploadStateChange]);

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
    if (refreshedUploadVideoRef.current === session.videoId) return;

    refreshedUploadVideoRef.current = session.videoId;
    void onRefreshVideos?.();
  }, [onRefreshVideos, session.videoId]);

  useEffect(() => {
    if (!session.videoId) return;
    if (autoSelectedSessionVideoRef.current === session.videoId) return;

    autoSelectedSessionVideoRef.current = session.videoId;
    if (String(session.videoId) === String(selectedVideoId)) return;
    onVideoSelect(session.videoId);
  }, [onVideoSelect, selectedVideoId, session.videoId]);

  const onPickFile = () => {
    if (isUploadBlocking) return;
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
    setIsVideoPickerOpen(false);
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

    const clearLocalPreview = () => {
      URL.revokeObjectURL(blobUrl);
      setPreviewBlobUrl(null);
      setPreviewFileName(null);
      setPreviewDuration(null);
      onDraftVideoChangeRef.current?.({
        blobUrl: null,
        durationSeconds: null,
        fileName: null,
      });
    };

    try {
      await startUpload({
        file,
        title: file.name,
        courseId,
        lessonId,
        onCompleted: async (videoId) => {
          await queryClient.invalidateQueries({
            queryKey: videoKeys.detail(videoId),
          });
          await queryClient.refetchQueries({
            queryKey: videoKeys.detail(videoId),
            type: "active",
          });
          await onRefreshVideos?.();
          onVideoSelect(videoId);
          setIsVideoPickerOpen(false);
          clearLocalPreview();
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
    if (isUploadBlocking) return;
    const file = event.dataTransfer.files?.[0] ?? null;
    await handleSelectedFile(file);
  };

  const { data: selectedVideo } = useVideoById(
    selectedVideoId,
    Boolean(selectedVideoId)
  );
  const selectedVideoUrl = selectedVideo?.url?.trim() ?? "";
  const isSelectedOriginalUrl = /\/original(?:[?#].*)?$/i.test(selectedVideoUrl);

  useEffect(() => {
    if (!user?.id || !selectedVideoId) return;
    if (session.videoId && String(session.videoId) === String(selectedVideoId)) {
      return;
    }

    const stream = createMediaUploadStream(
      {
        onOpen: () => {
          setIsVideoSseConnected(true);
        },
        onCompleted: (payload) => {
          const data = payload as unknown as {
            videoId?: number | string;
            video_id?: number | string;
            data?: {
              videoId?: number | string;
              video_id?: number | string;
            };
          };
          const completedVideoId =
            data.data?.videoId ??
            data.data?.video_id ??
            data.videoId ??
            data.video_id;

          if (!completedVideoId) return;

          void (async () => {
            if (String(completedVideoId) === String(selectedVideoId)) {
              await queryClient.invalidateQueries({
                queryKey: videoKeys.detail(Number(selectedVideoId)),
              });
              await queryClient.refetchQueries({
                queryKey: videoKeys.detail(Number(selectedVideoId)),
                type: "active",
              });
            }
            await onRefreshVideos?.();
          })();
        },
        onConnectionError: (error) => {
          setIsVideoSseConnected(false);
          console.error("[VideoSelectionSection] SSE connection error:", error);
        },
      },
      { userId: user.id },
    );

    return () => {
      setIsVideoSseConnected(false);
      stream.close();
    };
  }, [
    onRefreshVideos,
    queryClient,
    selectedVideoId,
    session.videoId,
    user?.id,
  ]);

  useEffect(() => {
    if (!selectedVideoId || !isSelectedOriginalUrl) return;

    let canceled = false;
    const refreshSelectedVideo = async () => {
      if (canceled) return;
      await queryClient.invalidateQueries({
        queryKey: videoKeys.detail(Number(selectedVideoId)),
      });
      await queryClient.refetchQueries({
        queryKey: videoKeys.detail(Number(selectedVideoId)),
        type: "active",
      });
      await onRefreshVideos?.();
    };

    void refreshSelectedVideo();
    if (isVideoSseConnected) return;

    const timer = window.setInterval(() => {
      void refreshSelectedVideo();
    }, 120000);

    return () => {
      canceled = true;
      window.clearInterval(timer);
    };
  }, [
    isSelectedOriginalUrl,
    isVideoSseConnected,
    onRefreshVideos,
    queryClient,
    selectedVideoId,
  ]);

  const handleOpenVideoPicker = () => {
    setIsVideoPickerOpen(true);
  };

  const handleLibraryVideoSelect = (videoId: number) => {
    if (session.videoId && String(session.videoId) !== String(videoId)) {
      clearSession();
    }

    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
      setPreviewBlobUrl(null);
      setPreviewFileName(null);
      setPreviewDuration(null);
      onDraftVideoChangeRef.current?.({
        blobUrl: null,
        durationSeconds: null,
        fileName: null,
      });
    }

    onVideoSelect(videoId);
    setIsVideoPickerOpen(false);
  };

  const hasActiveVideo = Boolean(selectedVideoId || previewBlobUrl);
  const isSelectedUploadSession = Boolean(
    session.videoId &&
      selectedVideoId &&
      String(session.videoId) === String(selectedVideoId),
  );
  const isShowingUploadSession = Boolean(previewBlobUrl || isSelectedUploadSession);
  // While the file is still uploading, keep the local blob preview so the user
  // can see the selected file immediately. Once Bunny's webhook/SSE reports the
  // processed playback URL, prefer that URL over the initial `/original` URL
  // stored at init-upload time.
  const videoUrl =
    previewBlobUrl ??
    (isSelectedUploadSession ? session.readyVideoUrl : null) ??
    selectedVideo?.url ??
    null;
  const videoName = previewFileName ?? (selectedVideo ? getVideoCardTitle(selectedVideo.name, selectedVideo.id) : "Đang tải thông tin video...");
  const durationSec = previewDuration ?? selectedVideo?.duration ?? null;
  const formattedDur = formatDuration(durationSec);

  let statusText = "";
  if (isShowingUploadSession) {
    if (session.status === "uploading" || session.status === "initializing") {
      statusText = "Đang tải lên...";
    } else if (session.status === "failed") {
      statusText = "Lỗi tải lên";
    } else if (session.status === "processing") {
      statusText = "Đang xử lý...";
    } else if (session.status !== "completed") {
      statusText = "Đang chuẩn bị";
    }
  }

  const showStatus =
    isShowingUploadSession &&
    session.status !== "idle" &&
    session.status !== "completed";

  return (
    <div className="grid gap-4 min-w-0">
      {/* Header section (only show if not active video or if we want labels) */}
      <div className="hidden items-center justify-between gap-2">
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

      {/* Active Video Card (only render if there is an active video and picker is closed) */}
      {hasActiveVideo && !isVideoPickerOpen ? (
        <div className="space-y-4 min-w-0">
          <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm transition hover:shadow-md">
            {/* Header info */}
            <div className="flex items-center gap-3 border-b border-border/60 bg-muted/40 px-4 py-3">
              <VideoHeaderThumbnail
                thumbnail={selectedVideo?.thumbnail}
                title={videoName}
              />
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

            {/* Upload progress if active */}
            {showStatus && (
              <div className="border-t border-border/60 bg-background/80 px-4 py-3.5 text-xs">
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
                      Đang tải lên...{" "}
                      <span className="font-semibold text-primary">
                        {Math.max(0, Math.min(100, session.progressPercent))}%
                      </span>
                    </p>
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

                {(session.status === "failed" ||
                  session.status === "canceled") && (
                  <div className="mt-3 flex items-center gap-2">
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
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-lg border-border/70 px-3 text-[11px] font-semibold text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                      onClick={clearSession}
                    >
                      Ẩn thông báo
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Actions Footer */}
            {!isUploadBlocking && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 bg-muted/20 px-4 py-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleOpenVideoPicker}
                  className="h-9 text-xs font-medium hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                >
                  <Clapperboard className="mr-1.5 h-3.5 w-3.5" />
                  Chọn video khác
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {isVideoPickerOpen && !isUploadBlocking ? (
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
              if (!isUploadBlocking) setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={onDropFile}
            className={`group flex min-h-40 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition-all duration-200 ${
              isDragOver
                ? "border-primary bg-primary/5 ring-4 ring-primary/10"
                : "border-border bg-background/50 hover:border-primary/50 hover:bg-muted/30"
            } ${isUploadBlocking ? "pointer-events-none opacity-70" : ""}`}
          >
            <div className="mb-3.5 grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110 shadow-sm">
              {isUploadBlocking ? (
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
            ) : libraryVideos.length ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {displayedVideos.map((video: Video) => {
                    const isSelected = selectedVideoId === video.id;
                    const durLabel = formatDuration(video.duration);
                    return (
                      <button
                        key={video.id}
                        type="button"
                        onClick={() => handleLibraryVideoSelect(video.id)}
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
      ) : null}
    </div>
  );
}
