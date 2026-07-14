import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import ProcessingStatus from "./ProcessingStatus";
import SuccessStatus from "./SuccessStatus";
import type { UploadStatus } from "@/features/upload/types";

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
  jobType?: string;
  mode?: "upload" | "feed";
  onClose?: () => void;
}

export default function UploadProgress({
  progress,
  status,
  jobId,
  isDownloading,
  clipsCount,
  error,
  stage,
  progressPercent,
  jobType,
  onViewResults,
  onStartNew,
  mode,
  onClose,
}: UploadProgressProps) {
  if (progress !== null && status === "uploading") {
    return (
      <div className="space-y-3 rounded-xl border bg-card p-4">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium">
              {(progress ?? 0) >= 99
                ? "Đang chuẩn bị phân tích video..."
                : "Đang tải video lên StudyLoop..."}
            </p>
            <p className="text-xs text-muted-foreground">
              Vui lòng giữ trang này mở cho đến khi upload hoàn tất.
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tiến độ upload</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>
    );
  }

  if (status === "completed" && clipsCount > 0 && mode === "feed") {
    return (
      <SuccessStatus
        clipsCount={clipsCount}
        onViewResults={onViewResults}
        onStartNew={onStartNew}
        mode={mode}
        onClose={onClose}
      />
    );
  }

  if (status === "pending" || status === "processing" || status === "failed") {
    return (
      <ProcessingStatus
        status={status}
        jobId={jobId}
        isDownloading={isDownloading}
        error={error}
        stage={stage}
        progressPercent={progressPercent}
        jobType={jobType}
      />
    );
  }

  return null;
}
