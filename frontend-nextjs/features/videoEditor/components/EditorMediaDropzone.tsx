"use client";

import * as React from "react";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadTrigger,
} from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useCloudinaryDirectUpload } from "@/features/cloudinary";
import { type VideoCompletedEvent } from "@/features/upload/api/upload.websocket";
import { createMediaSocket as createMediaUploadSocket } from "@/features/_shared/realtime/media-socket";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { authStorageHelper } from "@/store/auth";

// ============================================================================
// TYPES
// ============================================================================

export interface VideoDropData {
  type: "video";
  url: string;
  id?: number;
  video_id?: number;
  fileName?: string;
}

interface EditorMediaDropzoneProps {
  onMediaSelect: (url: string, file?: File, videoId?: number) => void;
  onVideoDrop?: (video: VideoDropData) => void;
  onUploadStart?: () => void;
  onUploadComplete?: () => void;
  isLoading?: boolean;
  title?: string;
  subtitle?: string;
  accept?: string;
  maxSize?: number;
  maxSizeLabel?: string;
  showDragIcon?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_ACCEPT = "video/*";
const DEFAULT_MAX_SIZE = 100 * 1024 * 1024; // 100MB
const DEFAULT_MAX_SIZE_LABEL = "100MB";

// ============================================================================
// COMPONENT
// ============================================================================

export default function EditorMediaDropzone({
  onMediaSelect,
  onVideoDrop,
  onUploadStart,
  onUploadComplete,
  isLoading = false,
  title = "Tải lên video của bạn",
  subtitle = "Kéo video vào đây hoặc chọn từ máy tính",
  accept = DEFAULT_ACCEPT,
  maxSize = DEFAULT_MAX_SIZE,
  maxSizeLabel = DEFAULT_MAX_SIZE_LABEL,
  showDragIcon = true,
}: EditorMediaDropzoneProps) {
  const { user } = useAuth();
  const [files, setFiles] = React.useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [dragOverInternal, setDragOverInternal] = React.useState(false);

  const uploadMutation = useCloudinaryDirectUpload((percent: number) =>
    setUploadProgress(percent),
  );

  const resolveUserId = (): number | undefined => {
    if (typeof user?.id === "number") return user.id;
    const stored = authStorageHelper.getUser() as {
      id?: number;
      user_id?: number;
    } | null;
    if (typeof stored?.id === "number") return stored.id;
    if (typeof stored?.user_id === "number") return stored.user_id;
    return undefined;
  };

  const waitForUploadedVideoId = (
    uploadedUrl: string,
    timeoutMs = 12000,
  ): Promise<number | undefined> => {
    const userId = resolveUserId();
    if (!userId || !uploadedUrl) {
      return Promise.resolve(undefined);
    }

    return new Promise((resolve) => {
      const normalizeUrl = (value?: string) => {
        if (!value) return "";
        try {
          const parsed = new URL(value);
          return `${parsed.origin}${parsed.pathname}`;
        } catch {
          return value;
        }
      };

      const targetUrl = normalizeUrl(uploadedUrl);
      const socket = createMediaUploadSocket(userId);
      let settled = false;

      const finish = (videoId?: number) => {
        if (settled) return;
        settled = true;
        socket.off("upload-video :completed", onUploadCompleted);
        socket.disconnect();
        resolve(videoId);
      };

      const onUploadCompleted = (payload: VideoCompletedEvent) => {
        const eventUrl = payload?.data?.url;
        const eventId = payload?.data?.id;
        if (!eventUrl) return;

        const normalizedEventUrl = normalizeUrl(eventUrl);
        if (normalizedEventUrl !== targetUrl) return;

        finish(typeof eventId === "number" ? eventId : undefined);
      };

      const timeout = window.setTimeout(() => {
        window.clearTimeout(timeout);
        finish(undefined);
      }, timeoutMs);

      socket.on("upload-video :completed", onUploadCompleted);
    });
  };

  const onFileReject = React.useCallback(
    (file: File, message: string) => {
      let errorMessage = message;

      if (message.includes("size")) {
        errorMessage = `File quá lớn. Kích thước tối đa: ${maxSizeLabel}`;
      } else if (message.includes("type")) {
        errorMessage =
          "Định dạng file không được hỗ trợ. Vui lòng chọn file video.";
      }

      toast.error(errorMessage, {
        description: `"${file.name.slice(0, 20)}${file.name.length > 20 ? "..." : ""}" đã bị từ chối`,
      });
    },
    [maxSizeLabel],
  );

  const validateVideoDuration = React.useCallback(
    async (file: File): Promise<boolean> => {
      return new Promise((resolve) => {
        const video = document.createElement("video");
        const url = URL.createObjectURL(file);

        const onLoadedMetadata = () => {
          const duration = Math.round(video.duration);
          const maxDuration = 180; // 3 minutes in seconds

          URL.revokeObjectURL(url);
          video.removeEventListener("loadedmetadata", onLoadedMetadata);

          if (duration > maxDuration) {
            const minutes = Math.ceil(duration / 60);
            toast.error(`Video quá dài (${minutes} phút). Tối đa 3 phút.`);
            resolve(false);
            return;
          }

          resolve(true);
        };

        const onError = () => {
          URL.revokeObjectURL(url);
          video.removeEventListener("loadedmetadata", onLoadedMetadata);
          video.removeEventListener("error", onError);
          toast.error(
            "Không thể xác định độ dài video. Vui lòng thử file khác.",
          );
          resolve(false);
        };

        video.addEventListener("loadedmetadata", onLoadedMetadata, {
          once: true,
        });
        video.addEventListener("error", onError, { once: true });
        video.src = url;
      });
    },
    [],
  );

  const onValueChange = async (selectedFiles: File[]) => {
    setFiles(selectedFiles);
    if (selectedFiles.length > 0) {
      const file = selectedFiles[0];
      console.log("[EditorMediaDropzone] File selected:", {
        name: file.name,
        size: file.size,
        type: file.type,
      });

      // Validate video duration
      const isValidDuration = await validateVideoDuration(file);
      if (!isValidDuration) {
        setFiles([]);
        return;
      }

      onUploadStart?.();
      setUploadProgress(0);

      try {
        const response = await uploadMutation.mutateAsync({
          file,
          folderName: "editor-uploads",
        });

        const uploadedUrl = response.secure_url;
        const videoId = await waitForUploadedVideoId(uploadedUrl);
        onMediaSelect(uploadedUrl, undefined, videoId);
        onUploadComplete?.();
      } catch (error) {
        console.error("[EditorMediaDropzone] Upload failed:", error);
      }
    }
  };

  const handleNativeDragOver = React.useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOverInternal(true);
    },
    [],
  );

  const handleNativeDragLeave = React.useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOverInternal(false);
    },
    [],
  );

  const handleNativeDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverInternal(false);

    // Handle sidebar video drops
    const videoData = e.dataTransfer.getData("application/json");
    if (videoData) {
      try {
        const data = JSON.parse(videoData) as VideoDropData;
        if (data.type === "video" && data.url) {
          console.log(
            "[EditorMediaDropzone] Video dropped from sidebar:",
            data,
          );
          onVideoDrop?.(data);
          return;
        }
      } catch (error) {
        console.error(
          "[EditorMediaDropzone] Failed to parse video data:",
          error,
        );
      }
    }

    // Handle file drops - let FileUpload logic handle it
    // by triggering the file input programmatically
    const dataTransfer = e.dataTransfer;
    if (dataTransfer.files && dataTransfer.files.length > 0) {
      void onValueChange(Array.from(dataTransfer.files));
    }
  };

  const isUploading = uploadMutation.isPending || isLoading;

  return (
    <FileUpload
      maxFiles={1}
      maxSize={maxSize}
      accept={accept}
      value={files}
      onValueChange={onValueChange}
      onFileReject={onFileReject}
      disabled={isUploading}
    >
      <FileUploadDropzone>
        <div
          className={`flex flex-col items-center justify-center gap-4 p-8 text-center h-full min-h-96 transition-colors ${
            dragOverInternal ? "bg-primary/5 border-2 border-primary/50" : ""
          }`}
          onDragOver={handleNativeDragOver}
          onDragLeave={handleNativeDragLeave}
          onDrop={handleNativeDrop}
        >
          {/* Icon */}
          {showDragIcon && (
            <div className="rounded-full size-20 grid place-items-center bg-primary/10">
              {isUploading ? (
                <Loader2 className="size-10 text-primary animate-spin" />
              ) : (
                <Upload className="size-10 text-primary" />
              )}
            </div>
          )}

          {/* Title */}
          <div>
            <h3 className="text-xl font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground mt-2">
              {subtitle}
              {!isUploading && (
                <>
                  {" "}
                  <FileUploadTrigger asChild>
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 h-auto text-primary inline"
                    >
                      hoặc chọn file
                    </Button>
                  </FileUploadTrigger>
                </>
              )}
            </p>
          </div>

          {/* Progress */}
          {isUploading && (
            <div className="w-full max-w-xs">
              <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Đang tải lên... {uploadProgress}%
              </p>
            </div>
          )}

          {/* Supported formats */}
          {!isUploading && (
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Hỗ trợ: MP4, MOV, AVI, WEBM, MKV</p>
              <p>Tối đa: {maxSizeLabel}</p>
            </div>
          )}
        </div>
      </FileUploadDropzone>
    </FileUpload>
  );
}
