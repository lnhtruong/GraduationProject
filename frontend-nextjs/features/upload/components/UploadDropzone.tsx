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

// ============================================================================
// TYPES
// ============================================================================

interface UploadDropzoneProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number; // in bytes
  maxSizeLabel?: string; // for display (e.g., "2GB")
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_ACCEPT = "video/*";
const DEFAULT_MAX_SIZE = 2 * 1024 * 1024 * 1024; // 2GB
const DEFAULT_MAX_SIZE_LABEL = "2GB";

const SUPPORTED_FORMATS = ["MP4", "MOV", "AVI", "WEBM", "MKV"];

// ============================================================================
// COMPONENT
// ============================================================================

export default function UploadDropzone({
  onFileSelect,
  accept = DEFAULT_ACCEPT,
  maxSize = DEFAULT_MAX_SIZE,
  maxSizeLabel = DEFAULT_MAX_SIZE_LABEL,
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
        description: `"${
          file.name.length > 20 ? `${file.name.slice(0, 20)}...` : file.name
        }" đã bị từ chối`,
      });
    },
    [maxSizeLabel],
  );

  const onValueChange = React.useCallback(
    (selectedFiles: File[]) => {
      setFiles(selectedFiles);
      if (selectedFiles.length > 0) {
        const file = selectedFiles[0];
        console.log("[UploadDropzone] File selected:", {
          name: file.name,
          size: file.size,
          type: file.type,
        });
        onFileSelect(file);
      }
    },
    [onFileSelect],
  );

  return (
    <FileUpload
      maxFiles={1}
      maxSize={maxSize}
      accept={accept}
      value={files}
      onValueChange={onValueChange}
      onFileReject={onFileReject}
    >
      <FileUploadDropzone>
        <div className="flex flex-col items-center gap-4 text-center p-4">
          {/* Icon */}
          <div className="rounded-full size-20 sm:size-24 grid place-items-center bg-primary/10">
            <Upload className="size-10 sm:size-12 text-primary" />
          </div>

          {/* Title */}
          <div>
            <h3 className="text-lg font-medium mb-1">
              Kéo và thả video vào đây
            </h3>
            <p className="text-sm text-muted-foreground">
              hoặc{" "}
              <FileUploadTrigger asChild>
                <Button variant="link" size="sm" className="p-0 h-auto">
                  chọn file
                </Button>
              </FileUploadTrigger>
            </p>
          </div>

          {/* Supported formats */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              Hỗ trợ:{" "}
              <span className="font-medium">
                {SUPPORTED_FORMATS.join(", ")}
              </span>
            </p>
            <p>Tối đa: {maxSizeLabel}</p>
          </div>
        </div>
      </FileUploadDropzone>
    </FileUpload>
  );
}
