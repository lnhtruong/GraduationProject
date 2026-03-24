import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import ProcessingStatus from "./ProcessingStatus";
import SuccessStatus from "./SuccessStatus";
import type { UploadStatus } from "@/features/upload/types";

// ============================================================================
// TYPES
// ============================================================================

interface UploadProgressProps {
  progress: number | null;
  status: UploadStatus;
  jobId: string | null;
  isDownloading: boolean;
  clipsCount: number;
  error?: string | null;
  onViewResults: () => void;
  onStartNew?: () => void;
  stage?: string;
  progressPercent?: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function UploadProgress({
  progress,
  status,
  jobId,
  isDownloading,
  clipsCount,
  error,
  stage,
  progressPercent,
  onViewResults,
  onStartNew,
}: UploadProgressProps) {
  // Show upload progress bar
  if (progress !== null && status === "uploading") {
    return (
      <div className="space-y-3 p-4 bg-card border rounded-lg">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium">
              {(progress ?? 0) >= 99
                ? "Đang chuẩn bị xử lý..."
                : "Đang tải lên video..."}
            </p>
            <p className="text-xs text-muted-foreground">
              Vui lòng không đóng trang này
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tiến độ</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>
    );
  }

  // Show success status
  if (status === "completed" && clipsCount > 0) {
    return (
      <SuccessStatus
        clipsCount={clipsCount}
        onViewResults={onViewResults}
        onStartNew={onStartNew}
      />
    );
  }

  // Show processing status
  if (status !== "idle" && status !== "uploading") {
    return (
      <ProcessingStatus
        status={status}
        jobId={jobId}
        isDownloading={isDownloading}
        error={error}
        stage={stage}
        progressPercent={progressPercent}
      />
    );
  }

  // Idle state
  return null;
}
