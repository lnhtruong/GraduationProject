import { CheckCircle, Play, Upload, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// ============================================================================
// TYPES
// ============================================================================

interface SuccessStatusProps {
  clipsCount: number;
  onViewResults: () => void;
  onStartNew?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function SuccessStatus({
  clipsCount,
  onViewResults,
  onStartNew,
}: SuccessStatusProps) {
  return (
    <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 dark:from-green-950/20 dark:to-emerald-950/20 dark:border-green-800">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Icon */}
        <div className="shrink-0">
          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
            <CheckCircle className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-green-800 dark:text-green-300">
            Xử lý thành công! 🎉
          </h3>
          <p className="text-sm text-green-700 dark:text-green-400 mt-1">
            {clipsCount === 1
              ? "Video đã được xử lý và sẵn sàng xem."
              : `${clipsCount} clips đã được tạo và sẵn sàng xem.`}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            onClick={onViewResults}
            className="bg-green-600 hover:bg-green-700 text-white"
            size="default"
          >
            <Play className="w-4 h-4 mr-2" />
            Xem kết quả
          </Button>
          {onStartNew && (
            <Button onClick={onStartNew} variant="outline" size="default">
              <Upload className="w-4 h-4 mr-2" />
              Tải video mới
            </Button>
          )}
        </div>
      </div>

      {/* Additional info */}
      {clipsCount > 1 && (
        <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-400">
            <Download className="w-3 h-3" />
            <span>Bạn có thể tải xuống từng clip hoặc chỉnh sửa trong trình biên tập</span>
          </div>
        </div>
      )}
    </Card>
  );
}