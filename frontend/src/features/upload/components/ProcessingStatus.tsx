import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertCircle, Loader2 } from "lucide-react";

interface ProcessingStatusProps {
  status: string | null;
  jobId: string | null;
  isDownloading?: boolean;
}

const statusConfig = {
  pending: {
    label: "Đang chờ xử lý",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock,
    progress: 10,
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

export default function ProcessingStatus({
  status,
  isDownloading = false,
}: ProcessingStatusProps) {
  if (!status) return null;

  const config = statusConfig[status as keyof typeof statusConfig] || {
    label: status,
    color: "bg-gray-100 text-gray-800 border-gray-200",
    icon: Clock,
    progress: 50,
    description: `Trạng thái: ${status}`,
  };

  const Icon = config.icon;

  return (
    <div className="space-y-4 p-4 bg-card border rounded-lg">
      {/* Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Icon
              className={`w-5 h-5 ${
                status === "processing" ? "animate-spin" : ""
              } ${
                config.color.includes("blue")
                  ? "text-blue-600"
                  : config.color.includes("green")
                  ? "text-green-600"
                  : config.color.includes("yellow")
                  ? "text-yellow-600"
                  : config.color.includes("red")
                  ? "text-red-600"
                  : "text-gray-600"
              }`}
            />
          </div>
          <div>
            <h3 className="font-medium">{config.label}</h3>
            <p className="text-sm text-muted-foreground">
              {config.description}
            </p>
          </div>
        </div>
        <Badge variant="outline" className={config.color}>
          {config.label}
        </Badge>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Tiến độ</span>
          <span className="font-medium">{config.progress}%</span>
        </div>
        <Progress value={config.progress} className="h-2" />
      </div>

      {/* Additional Info */}
      <div className="space-y-2">
        {isDownloading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" />
            Đang tải kết quả về...
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          Cập nhật lần cuối: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Processing Steps (for processing status) */}
      {status === "processing" && (
        <div className="space-y-2 pt-2 border-t">
          <h4 className="text-sm font-medium">Các bước xử lý:</h4>
          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3 h-3 text-green-500" />
              Phân tích nội dung video
            </div>
            <div className="flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
              Tạo highlight clips tự động
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3 text-gray-400" />
              Xuất video và tạo file tải về
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
