"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadTrigger,
} from "@/components/ui/file-upload";
import { Upload } from "lucide-react";
import { toast } from "sonner";

interface UploadDropzoneProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number;
  maxSizeLabel?: string;
  title?: string;
  subtitle?: string;
  disabled?: boolean;
  variant?: "default" | "compact" | "hero";
  previewUrl?: string | null;
  previewFileName?: string | null;
}

const DEFAULT_ACCEPT = "video/*";
const DEFAULT_MAX_SIZE = 2 * 1024 * 1024 * 1024;
const DEFAULT_MAX_SIZE_LABEL = "2GB";

const SUPPORTED_FORMATS = ["MP4", "MOV", "AVI", "WEBM", "MKV"];

export default function UploadDropzone({
  onFileSelect,
  accept = DEFAULT_ACCEPT,
  maxSize = DEFAULT_MAX_SIZE,
  maxSizeLabel = DEFAULT_MAX_SIZE_LABEL,
  title = "Kéo và thả video vào đây",
  subtitle = "hoặc",
  disabled = false,
  variant = "default",
  previewUrl = null,
  previewFileName = null,
}: UploadDropzoneProps) {
  const [files, setFiles] = React.useState<File[]>([]);

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
        description: `${file.name.length > 20 ? `${file.name.slice(0, 20)}...` : file.name} đã bị từ chối`,
      });
    },
    [maxSizeLabel],
  );

  const onValueChange = React.useCallback(
    (selectedFiles: File[]) => {
      setFiles(selectedFiles);
      if (selectedFiles.length > 0) {
        const file = selectedFiles[0];
        onFileSelect(file);
        setFiles([]);
      }
    },
    [onFileSelect],
  );

  const dropzoneClassName =
    variant === "compact"
      ? "rounded-xl border-border/70 bg-background/70 p-4"
      : variant === "hero"
        ? "rounded-2xl border-primary/30 bg-primary/3 p-0 data-dragging:border-primary data-dragging:bg-primary/10"
        : "rounded-xl border-border/60 bg-background p-4 sm:p-5";

  const contentClassName =
    variant === "hero"
      ? "flex min-h-40 flex-col items-center justify-center gap-3 px-4 py-6 text-center"
      : variant === "compact"
        ? "flex flex-col items-center gap-3 text-center"
        : "flex flex-col items-center gap-4 text-center";

  const iconClassName =
    variant === "compact"
      ? "grid size-14 place-items-center rounded-full bg-primary/10"
      : "grid size-20 place-items-center rounded-full bg-primary/10 sm:size-24";

  const iconSizeClassName =
    variant === "compact"
      ? "size-7 text-primary"
      : "size-10 text-primary sm:size-12";

  const titleClassName =
    variant === "compact"
      ? "mb-1 text-base font-medium"
      : "mb-1 text-lg font-medium";

  return (
    <FileUpload
      maxFiles={1}
      maxSize={maxSize}
      accept={accept}
      value={files}
      onValueChange={onValueChange}
      onFileReject={onFileReject}
      disabled={disabled}
    >
      <FileUploadDropzone className={dropzoneClassName}>
        {previewUrl ? (
          <div className="flex min-h-40 flex-col items-center justify-center gap-3 px-4 py-6 text-center">
            <div className="w-full max-w-[860px]">
              <video
                className="mx-auto h-auto max-h-[26rem] w-full rounded-md bg-black object-contain"
                src={previewUrl}
                poster={previewUrl}
                controls
                preload="metadata"
                playsInline
              />
            </div>
            <div>
              <p className="text-sm font-medium">{previewFileName}</p>
            </div>
          </div>
        ) : (
          <div className={contentClassName}>
            <div className={iconClassName}>
              <Upload className={iconSizeClassName} />
            </div>

            <div>
              <h3 className={titleClassName}>{title}</h3>
              <p className="text-sm text-muted-foreground">
                {subtitle}{" "}
                <FileUploadTrigger asChild>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0"
                    disabled={disabled}
                  >
                    chọn file
                  </Button>
                </FileUploadTrigger>
              </p>
            </div>

            <div className="space-y-1 text-xs text-muted-foreground">
              <p>
                Hỗ trợ:{" "}
                <span className="font-medium">
                  {SUPPORTED_FORMATS.join(", ")}
                </span>
              </p>
              <p>Tối đa: {maxSizeLabel}</p>
            </div>
          </div>
        )}
      </FileUploadDropzone>
    </FileUpload>
  );
}
