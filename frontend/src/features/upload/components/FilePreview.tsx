import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileVideo, X, Upload } from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

interface FilePreviewProps {
  file: File;
  onRemove: () => void;
  onUpload: () => void;
  isUploading?: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format file size to human readable string
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Get video duration from file
 * @param file - Video file
 * @returns Duration in seconds or null
 */
async function getVideoDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";

    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };

    video.onerror = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(null);
    };

    video.src = URL.createObjectURL(file);
  });
}

/**
 * Format duration to MM:SS
 * @param seconds - Duration in seconds
 * @returns Formatted string (e.g., "05:32")
 */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function FilePreview({
  file,
  onRemove,
  onUpload,
  isUploading = false,
}: FilePreviewProps) {
  const [duration, setDuration] = React.useState<number | null>(null);
  const [thumbnail, setThumbnail] = React.useState<string | null>(null);

  // Get video duration and thumbnail on mount
  React.useEffect(() => {
    const loadVideoMetadata = async () => {
      try {
        // Get duration
        const videoDuration = await getVideoDuration(file);
        setDuration(videoDuration);

        // Generate thumbnail
        const video = document.createElement("video");
        video.preload = "metadata";
        video.currentTime = 1; // Get frame at 1 second

        video.onloadeddata = () => {
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const thumbnailUrl = canvas.toDataURL("image/jpeg", 0.7);
            setThumbnail(thumbnailUrl);
          }

          window.URL.revokeObjectURL(video.src);
        };

        video.src = URL.createObjectURL(file);
      } catch (err) {
        console.error("Failed to load video metadata:", err);
      }
    };

    loadVideoMetadata();
  }, [file]);

  return (
    <Card className="p-4">
      <div className="flex items-start gap-4">
        {/* Thumbnail or Icon */}
        <div className="shrink-0">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={file.name}
              className="w-24 h-24 object-cover rounded-lg border"
            />
          ) : (
            <div className="w-24 h-24 bg-primary/10 rounded-lg flex items-center justify-center">
              <FileVideo className="w-10 h-10 text-primary" />
            </div>
          )}
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate" title={file.name}>
            {file.name}
          </div>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
            <span>{formatFileSize(file.size)}</span>
            {duration && (
              <>
                <span>•</span>
                <span>{formatDuration(duration)}</span>
              </>
            )}
          </div>

          {/* Video details */}
          <div className="mt-2 text-xs text-muted-foreground">
            {file.type || "Video file"}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="icon"
            onClick={onRemove}
            disabled={isUploading}
            title="Xóa file"
          >
            <X className="w-4 h-4" />
          </Button>
          <Button
            onClick={onUpload}
            disabled={isUploading}
            size="default"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Đang tải...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Tải lên
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}