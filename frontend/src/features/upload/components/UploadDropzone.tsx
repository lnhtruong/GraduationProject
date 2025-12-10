import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, FileVideo } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleFileSelect = (file: File) => {
    setError(null);

    // Validate file type
    if (accept !== "*" && !file.type.match(accept.replace("/*", "/.*"))) {
      setError("Định dạng file không được hỗ trợ. Vui lòng chọn file video.");
      return;
    }

    // Validate file size
    if (maxSize && file.size > maxSize) {
      setError(`File quá lớn. Kích thước tối đa: ${maxSizeLabel}`);
      return;
    }

    // Valid file
    console.log("[UploadDropzone] File selected:", {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    onFileSelect(file);
  };

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset input để có thể chọn lại cùng file
    e.target.value = "";
  };

  // ============================================================================
  // DRAG & DROP HANDLERS
  // ============================================================================

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Card
      className={cn(
        "border-2 border-dashed transition-all duration-200",
        isDragging
          ? "border-primary bg-primary/5 scale-[1.02]"
          : "border-border hover:border-primary/50"
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="p-8 sm:p-12">
        <div className="flex flex-col items-center gap-4 text-center">
          {/* Icon */}
          <div
            className={cn(
              "rounded-full size-20 sm:size-24 grid place-items-center transition-all duration-200",
              isDragging ? "bg-primary/20 scale-110" : "bg-primary/10"
            )}
          >
            {isDragging ? (
              <FileVideo className="size-10 sm:size-12 text-primary animate-bounce" />
            ) : (
              <Upload className="size-10 sm:size-12 text-primary" />
            )}
          </div>

          {/* Title */}
          <div>
            <h3 className="text-lg font-medium mb-1">
              {isDragging ? "Thả file tại đây" : "Kéo và thả video vào đây"}
            </h3>
            <p className="text-sm text-muted-foreground">hoặc</p>
          </div>

          {/* Button */}
          <Button
            variant="default"
            size="lg"
            onClick={handleChooseFile}
            className="mt-2"
          >
            <Upload className="w-4 h-4 mr-2" />
            Chọn file từ máy tính
          </Button>

          {/* Supported formats */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              Hỗ trợ: <span className="font-medium">{SUPPORTED_FORMATS.join(", ")}</span>
            </p>
            <p>Tối đa: {maxSizeLabel}</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
              {error}
            </div>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileInputChange}
            className="hidden"
            aria-label="Chọn file video"
          />
        </div>
      </div>
    </Card>
  );
}