import { Loader2 } from "lucide-react";
import ProcessingStatus from "./ProcessingStatus";
import SuccessStatus from "./SuccessStatus";

interface UploadProgressProps {
  progress: number | null;
  status: string | null;
  jobId: string | null;
  isDownloading: boolean;
  clipsCount: number;
  onViewResults: () => void;
  onStartNew?: () => void;
}

export default function UploadProgress({
  progress,
  status,
  jobId,
  isDownloading,
  clipsCount,
  onViewResults,
  onStartNew,
}: UploadProgressProps) {
  if (progress !== null) {
    return (
      <div className="space-y-2">
        <div className="flex items-center text-xs text-muted-foreground">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          <p>Đang tải lên </p>
        </div>
      </div>
    );
  }

  if (status === "completed" && clipsCount > 0) {
    return (
      <SuccessStatus
        clipsCount={clipsCount}
        onViewResults={onViewResults}
        onStartNew={onStartNew}
      />
    );
  }

  if (status) {
    return (
      <ProcessingStatus
        status={status}
        jobId={jobId}
        isDownloading={isDownloading}
      />
    );
  }

  return (
    <div className="text-sm text-muted-foreground">Sẵn sàng để tải lên</div>
  );
}
