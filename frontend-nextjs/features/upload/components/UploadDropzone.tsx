"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadTrigger,
} from "@/components/ui/file-upload";
import { cn } from "@/lib/utils";
import { BookOpenCheck, FileVideo, HelpCircle, Upload } from "lucide-react";
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

const OUTPUT_PREVIEW = [
  { label: "Ý chính", icon: BookOpenCheck },
  { label: "Ví dụ", icon: FileVideo },
  { label: "Quiz", icon: HelpCircle },
];

export default function UploadDropzone({
  onFileSelect,
  accept = DEFAULT_ACCEPT,
  maxSize = DEFAULT_MAX_SIZE,
  maxSizeLabel = DEFAULT_MAX_SIZE_LABEL,
  title = "Kéo video bài giảng vào đây",
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
          "Định dạng file chưa được hỗ trợ. Vui lòng chọn một file video.";
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
      const file = selectedFiles[0];
      if (!file) return;

      onFileSelect(file);
      setFiles([]);
    },
    [onFileSelect],
  );

  const dropzoneClassName =
    variant === "compact"
      ? "rounded-xl border-border/70 bg-background/70 p-4"
      : variant === "hero"
        ? "rounded-2xl border border-dashed border-primary/35 bg-primary/[0.03] p-0 transition data-[dragging]:border-primary data-[dragging]:bg-primary/10"
        : "rounded-2xl border-2 border-dashed border-slate-300 bg-background p-4 shadow-none transition-all duration-200 hover:border-primary/50 data-[dragging]:border-primary data-[dragging]:bg-primary/5 sm:p-6";

  const contentClassName =
    variant === "hero"
      ? "flex min-h-[18rem] flex-col items-center justify-center gap-4 px-4 py-7 text-center sm:min-h-[20rem]"
      : variant === "compact"
        ? "flex flex-col items-center gap-3 text-center"
        : "flex min-h-[20rem] flex-col items-center justify-center gap-4 text-center";

  const iconClassName =
    variant === "compact"
      ? "grid size-10 place-items-center"
      : variant === "hero"
        ? "grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm"
        : "grid size-12 place-items-center sm:size-14";

  const iconSizeClassName =
    variant === "compact"
      ? "size-6 text-primary"
      : variant === "hero"
        ? "size-7"
        : "size-8 text-primary sm:size-9";

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
            <p className="text-sm font-medium">{previewFileName}</p>
          </div>
        ) : (
          <div className={contentClassName}>
            <div className={iconClassName}>
              <Upload className={iconSizeClassName} />
            </div>

            <div>
              <h3 className="mb-1 text-lg font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">
                {subtitle}{" "}
                <FileUploadTrigger asChild>
                  <Button
                    variant={variant === "hero" ? "outline" : "link"}
                    size="sm"
                    className={cn(
                      variant === "hero"
                        ? "ml-1 h-8 rounded-full px-3 font-semibold"
                        : "h-auto p-0",
                    )}
                    disabled={disabled}
                  >
                    chọn video bài giảng
                  </Button>
                </FileUploadTrigger>
              </p>
            </div>

            {variant === "hero" && (
              <div className="flex flex-wrap justify-center gap-2">
                {OUTPUT_PREVIEW.map((item) => {
                  const Icon = item.icon;
                  return (
                    <span
                      key={item.label}
                      className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm"
                    >
                      <Icon className="size-3.5 text-primary" />
                      {item.label}
                    </span>
                  );
                })}
              </div>
            )}

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
