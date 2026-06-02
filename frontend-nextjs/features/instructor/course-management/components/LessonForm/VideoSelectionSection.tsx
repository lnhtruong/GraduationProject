"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useLessonVideoUpload } from "@/features/video/upload/useLessonVideoUpload";
import { getVideoCardTitle } from "../../utils/lesson-form.utils";

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
  canUseInVideoQuiz?: boolean;
  onVideoSelect: (videoId: number) => void;
  onRefreshVideos?: () => Promise<void>;
  onDraftVideoChange?: (draftVideo: {
    blobUrl: string | null;
    durationSeconds: number | null;
    fileName: string | null;
  }) => void;
  lessonId?: number | null;
  onOpenCreateQuizModal?: () => void;
  onPendingCreateQuiz?: () => void;
}

export function VideoSelectionSection({
  videosLoading,
  userVideos,
  selectedVideoId,
  canUseInVideoQuiz,
  onVideoSelect,
  onRefreshVideos,
  onDraftVideoChange,
  lessonId,
  onOpenCreateQuizModal,
  onPendingCreateQuiz,
}: Props) {
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewFileName, setPreviewFileName] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const selectedUploadVideoRef = useRef<number | null>(null);

  const {
    session,
    startUpload,
    retryUpload,
    cancelUpload,
    clearSession,
    isUploading,
  } = useLessonVideoUpload();

  useEffect(() => {
    return () => {
      if (previewBlobUrl) {
        URL.revokeObjectURL(previewBlobUrl);
      }
      onDraftVideoChange?.({
        blobUrl: null,
        durationSeconds: null,
        fileName: null,
      });
    };
  }, [onDraftVideoChange, previewBlobUrl]);

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
    setPreviewBlobUrl(blobUrl);
    setPreviewFileName(file.name);
    onDraftVideoChange?.({
      blobUrl,
      durationSeconds: null,
      fileName: file.name,
    });

    try {
      await startUpload({
        file,
        title: file.name,
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

  const showStatus = session.status !== "idle";

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-sm font-medium">Chọn video bài học</Label>
        {!!userVideos?.length ? (
          <Badge variant="outline" className="text-[11px] font-normal">
            {userVideos.length} video
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

      {previewBlobUrl ? (
        <div className="space-y-2">
          <div className="overflow-hidden rounded-xl border border-border/60 bg-background shadow-sm">
            <div className="bg-black">
              <video
                className="block h-auto max-h-104 w-full object-contain"
                src={previewBlobUrl}
                poster={previewBlobUrl}
                controls
                preload="metadata"
                playsInline
                onLoadedMetadata={(event) => {
                  const durationSeconds = event.currentTarget.duration;
                  const safeDuration =
                    Number.isFinite(durationSeconds) && durationSeconds > 0
                      ? durationSeconds
                      : null;
                  onDraftVideoChange?.({
                    blobUrl: previewBlobUrl,
                    durationSeconds: safeDuration,
                    fileName: previewFileName,
                  });
                }}
              >
                Trình duyệt không hỗ trợ phát video.
              </video>
            </div>
            {previewFileName ? (
              <p className="px-3 py-2 text-xs text-muted-foreground">
                {previewFileName}
              </p>
            ) : null}
          </div>
          {selectedVideoId || previewBlobUrl ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                if (lessonId) {
                  onOpenCreateQuizModal?.();
                } else {
                  onPendingCreateQuiz?.();
                }
              }}
            >
              {canUseInVideoQuiz ? "Tạo Quiz" : "Tạo quiz ngoài video"}
            </Button>
          ) : null}
        </div>
      ) : (
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
          className={`group flex min-h-36 w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-4 py-7 text-center transition ${
            isDragOver
              ? "border-primary bg-primary/8"
              : "border-border/60 bg-background/60 hover:border-primary/50"
          } ${isUploading ? "pointer-events-none opacity-70" : ""}`}
        >
          <div className="mb-3 grid h-14 w-14 place-items-center rounded-full bg-primary/10">
            {isUploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : (
              <Upload className="h-6 w-6 text-primary" />
            )}
          </div>
          <p className="text-sm font-medium text-foreground">
            Kéo thả video vào đây hoặc bấm để chọn file
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Hỗ trợ: MP4, MOV, AVI, WEBM, MKV
          </p>
        </div>
      )}

      {showStatus ? (
        <div className="rounded-xl border border-border/60 bg-background/80 px-3 py-2.5 text-xs">
          {session.status === "processing" ? (
            <p className="font-medium text-foreground">
              Video vẫn đang được xử lý.
            </p>
          ) : session.status === "initializing" ? (
            <p className="font-medium text-foreground">
              Đang khởi tạo upload...
            </p>
          ) : session.status === "uploading" ? (
            <p className="font-medium text-foreground">
              Đang upload...{" "}
              {Math.max(0, Math.min(100, session.progressPercent))}%
            </p>
          ) : session.status === "completed" ? (
            <p className="font-medium text-foreground">Upload hoàn tất.</p>
          ) : session.status === "failed" ? (
            <p className="font-medium text-destructive">
              Upload thất bại{session.error ? `: ${session.error}` : "."}
            </p>
          ) : session.status === "canceled" ? (
            <p className="font-medium text-muted-foreground">Đã hủy upload.</p>
          ) : null}

          {(session.status === "uploading" ||
            session.status === "initializing") && (
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-[width] duration-300"
                style={{
                  width: `${Math.max(0, Math.min(100, session.progressPercent))}%`,
                }}
              />
            </div>
          )}

          <div className="mt-2 flex items-center gap-2">
            {(session.status === "uploading" ||
              session.status === "initializing") && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2 text-[11px]"
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
                className="h-7 px-2 text-[11px]"
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
                className="h-7 px-2 text-[11px]"
                onClick={clearSession}
              >
                Ẩn
              </Button>
            )}
          </div>
        </div>
      ) : null}

      {videosLoading ? (
        <div className="rounded-xl border border-dashed border-border/60 px-3 py-2 text-xs text-muted-foreground">
          Đang tải video bài học...
        </div>
      ) : userVideos?.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {userVideos.map((video) => {
            const isSelected = selectedVideoId === video.id;
            return (
              <button
                key={video.id}
                type="button"
                onClick={() => onVideoSelect(video.id)}
                className={`overflow-hidden rounded-xl border text-left transition ${
                  isSelected
                    ? "border-primary shadow-sm ring-1 ring-primary/40"
                    : "border-border/60 hover:border-primary/50"
                }`}
              >
                <div className="aspect-video bg-muted/30">
                  {video.thumbnail ? (
                    <Image
                      src={video.thumbnail}
                      alt={getVideoCardTitle(video.name, video.id)}
                      width={480}
                      height={270}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                      Không có thumbnail
                    </div>
                  )}
                </div>
                <div className="space-y-1 p-2">
                  <p className="line-clamp-2 text-xs font-medium">
                    {getVideoCardTitle(video.name, video.id)}
                  </p>
                  <div className="flex items-center justify-end">
                    {isSelected ? (
                      <Badge variant="default" className="h-5 px-2 text-[10px]">
                        Đã chọn
                      </Badge>
                    ) : null}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
