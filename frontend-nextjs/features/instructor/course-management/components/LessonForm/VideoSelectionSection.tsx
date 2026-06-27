"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, Clapperboard, NotebookText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useLessonVideoUpload } from "@/features/video/upload/useLessonVideoUpload";
import { getVideoDurationFromFile } from "@/features/video/utils/get-video-duration-from-file";
import { useVideoById } from "@/features/video/api/video.hooks";
import { getVideoCardTitle, formatDuration } from "../../utils/lesson-form.utils";

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
  isEdit = false,
  onOpenCreateQuizModal,
  onPendingCreateQuiz,
  onUploadStateChange,
}: Props) {
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewFileName, setPreviewFileName] = useState<string | null>(null);
  const [previewDuration, setPreviewDuration] = useState<number | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const selectedUploadVideoRef = useRef<number | null>(null);
  const onDraftVideoChangeRef = useRef(onDraftVideoChange);
  onDraftVideoChangeRef.current = onDraftVideoChange;


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
      const message =
        error instanceof Error ? error.message : "Không thể bắt đầu upload.";
      toast.error(message);
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
    if (session.status === "completed") {
      statusText = "Đã tải lên";
    } else if (session.status === "uploading" || session.status === "initializing") {
      statusText = "Đang tải lên...";
    } else if (session.status === "failed") {
      statusText = "Lỗi tải lên";
    } else {
      statusText = "Đang chuẩn bị";
    }
  } else if (selectedVideoId) {
    statusText = "Từ thư viện";
  }

  const showStatus = session.status !== "idle";

  return (
    <div className="grid gap-4">
      {/* Header section (only show if not active video or if we want labels) */}
      <div className="flex items-center justify-between gap-2">
        <Label className="text-sm font-semibold text-foreground/90">
          {hasActiveVideo ? "Video bài học đã chọn" : "Chọn video bài học"}
        </Label>
        {!hasActiveVideo && !!userVideos?.length ? (
          <Badge variant="outline" className="bg-background px-2.5 py-0.5 text-[11px] font-normal text-muted-foreground shadow-sm">
            {userVideos.length} video trong thư viện
          </Badge>
        ) : null}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={onFileChange}
      />

      {hasActiveVideo ? (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm transition hover:shadow-md">
            {/* Header info */}
            <div className="flex items-center gap-3 border-b border-border/60 bg-muted/40 px-4 py-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary shadow-inner">
                <Clapperboard className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="truncate text-sm font-semibold text-foreground">
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
                    Upload thất bại{session.error ? `: ${session.error}` : "."}
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
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2.5 text-[11px] font-medium"
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
            <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Hoặc chọn từ thư viện của bạn
            </h5>

            {videosLoading ? (
              <div className="flex items-center justify-center rounded-xl border border-dashed border-border/80 p-8 text-xs text-muted-foreground bg-muted/10">
                <Loader2 className="h-4 w-4 animate-spin mr-2 text-primary" />
                Đang tải thư viện video...
              </div>
            ) : userVideos?.length ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {userVideos.map((video) => {
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
                        {video.thumbnail ? (
                          <Image
                            src={video.thumbnail}
                            alt={getVideoCardTitle(video.name, video.id)}
                            width={480}
                            height={270}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-xs text-muted-foreground">
                            <Clapperboard className="h-5 w-5 text-muted-foreground/60" />
                            <span>Không có ảnh thu nhỏ</span>
                          </div>
                        )}
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
