"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileVideo, Upload, X } from "lucide-react";
import { getVideoDurationFromFile } from "@/features/video/utils/get-video-duration-from-file";

interface FilePreviewProps {
  file: File;
  onRemove: () => void;
  onUpload: () => void;
  isUploading?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
}

export default function FilePreview({
  file,
  onRemove,
  onUpload,
  isUploading = false,
}: FilePreviewProps) {
  const [duration, setDuration] = React.useState<number | null>(null);
  const [thumbnail, setThumbnail] = React.useState<string | null>(null);

  React.useEffect(() => {
    const loadVideoMetadata = async () => {
      try {
        const videoDuration = await getVideoDurationFromFile(file);
        setDuration(videoDuration);

        const video = document.createElement("video");
        video.preload = "metadata";
        video.currentTime = 1;

        video.onloadeddata = () => {
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            setThumbnail(canvas.toDataURL("image/jpeg", 0.7));
          }

          window.URL.revokeObjectURL(video.src);
        };

        video.src = URL.createObjectURL(file);
      } catch (err) {
        console.error("Failed to load video metadata:", err);
      }
    };

    void loadVideoMetadata();
  }, [file]);

  return (
    <Card className="p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="shrink-0">
          {thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbnail}
              alt={file.name}
              className="h-32 w-full rounded-lg border object-cover sm:h-24 sm:w-32"
            />
          ) : (
            <div className="flex h-24 w-32 items-center justify-center rounded-lg border bg-muted/20">
              <FileVideo className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate font-medium" title={file.name}>
            {file.name}
          </div>
          <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
            <span>{formatFileSize(file.size)}</span>
            {duration && (
              <>
                <span aria-hidden="true">•</span>
                <span>{formatDuration(duration)}</span>
              </>
            )}
          </div>

          <div className="mt-2 text-xs text-muted-foreground">
            {file.type || "File video"}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={onRemove}
            disabled={isUploading}
            title="Xóa file"
          >
            <X className="h-4 w-4" />
          </Button>
          <Button onClick={onUpload} disabled={isUploading} size="default">
            {isUploading ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Đang tải lên
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Chọn cách cắt
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
