import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Clock, AlertCircle, Loader2 } from "lucide-react";
import type { UploadStatus } from "@/features/upload/types";

// ============================================================================
// TYPES
// ============================================================================

interface ProcessingStatusProps {
  status: UploadStatus;
  jobId: string | null;
  isDownloading?: boolean;
  error?: string | null;
  stage?: string; // Dynamic stage from backend
  progressPercent?: number; // Dynamic progress from backend (0-100)
}

interface StatusConfig {
  label: string;
  color: string;
  icon: React.ElementType;
  progress: number;
  description: string;
}

// ============================================================================
// STATUS CONFIGURATIONS
// ============================================================================

const STATUS_CONFIG: Record<UploadStatus, StatusConfig> = {
  idle: {
    label: "Sẵn sàng",
    color: "bg-gray-100 text-gray-800 border-gray-200",
    icon: Clock,
    progress: 0,
    description: "Chọn file video để bắt đầu",
  },
  uploading: {
    label: "Đang tải lên",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: Loader2,
    progress: 50,
    description: "Đang tải video lên server...",
  },
  pending: {
    label: "Đang chờ xử lý",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock,
    progress: 20,
    description: "Video đã được tải lên, đang xếp hàng để xử lý",
  },
  processing: {
    label: "Đang xử lý",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: Loader2,
    progress: 60,
    description: "Hệ thống đang phân tích và cắt video thành các clip ngắn",
  },
  completed: {
    label: "Hoàn thành",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle,
    progress: 100,
    description: "Video đã được xử lý thành công",
  },
  failed: {
    label: "Thất bại",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: AlertCircle,
    progress: 0,
    description: "Có lỗi xảy ra trong quá trình xử lý",
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function ProcessingStatus({
  status,
  isDownloading = false,
  error,
  stage,
  progressPercent,
}: ProcessingStatusProps) {
  // Don't render if idle
  if (status === "idle") return null;

  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  // Use backend stage if available, but use config progress (backend not ready yet)
  const displayStage = stage || config.description;
  const displayProgress = config.progress; // Use hardcoded progress until backend implements it

  // Icon color based on status
  const iconColor =
    status === "processing" || status === "uploading"
      ? "text-blue-600"
      : status === "completed"
        ? "text-green-600"
        : status === "pending"
          ? "text-yellow-600"
          : status === "failed"
            ? "text-red-600"
            : "text-gray-600";

  // Icon animation
  const iconAnimation =
    status === "processing" || status === "uploading" ? "animate-spin" : "";

  return (
    <div className="space-y-4 p-4 bg-card border rounded-lg">
      {/* Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Icon className={`w-5 h-5 ${iconColor} ${iconAnimation}`} />
          </div>
          <div>
            <h3 className="font-medium">{config.label}</h3>
            <p className="text-sm text-muted-foreground">{displayStage}</p>
          </div>
        </div>
        <Badge variant="outline" className={config.color}>
          {config.label}
        </Badge>
      </div>

      {/* Progress Bar */}
      {status !== "failed" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tiến độ</span>
            <span className="font-medium">{Math.round(displayProgress)}%</span>
          </div>
          <Progress value={displayProgress} className="h-2" />
        </div>
      )}

      {/* Error Message */}
      {status === "failed" && error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Additional Info */}
      <div className="space-y-2">
        {isDownloading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" />
            Đang tải kết quả về...
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          Cập nhật lần cuối: {new Date().toLocaleTimeString("vi-VN")}
        </div>
      </div>

      {/* Processing Steps */}
      {status === "processing" && (
        <div className="space-y-2 pt-2 border-t">
          <h4 className="text-sm font-medium">Các bước xử lý:</h4>
          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span>Phân tích nội dung video</span>
            </div>
            <div className="flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
              <span>Tạo highlight clips tự động</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3 text-gray-400" />
              <span>Xuất video và tạo file tải về</span>
            </div>
          </div>
        </div>
      )}

      {/* Pending Steps */}
      {status === "pending" && (
        <div className="space-y-2 pt-2 border-t">
          <h4 className="text-sm font-medium">Đang chờ:</h4>
          <div className="text-xs text-muted-foreground">
            Video của bạn đang trong hàng đợi. Thời gian xử lý tùy thuộc vào độ
            dài video và số lượng yêu cầu đang chờ.
          </div>
        </div>
      )}
    </div>
  );
}
