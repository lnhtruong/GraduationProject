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
    <Card className="p-6 bg-accent/10 border-accent/30">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Icon */}
        <div className="shrink-0">
          <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center shadow-lg">
            <CheckCircle className="w-6 h-6 text-accent-foreground" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-accent">
            Xử lý thành công!
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {clipsCount === 1
              ? "Video đã được xử lý và sẵn sàng xem."
              : `${clipsCount} clips đã được tạo và sẵn sàng xem.`}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            onClick={onViewResults}
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
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
        <div className="mt-4 pt-4 border-t border-accent/20">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Download className="w-3 h-3" />
            <span>
              Bạn có thể tải xuống từng clip hoặc chỉnh sửa trong trình biên tập
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
