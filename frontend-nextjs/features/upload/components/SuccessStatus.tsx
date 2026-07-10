import { Download, Play, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface SuccessStatusProps {
  clipsCount: number;
  onViewResults: () => void;
  onStartNew?: () => void;
  mode?: "upload" | "feed";
  onClose?: () => void;
}

export default function SuccessStatus({
  clipsCount,
  onViewResults,
  onStartNew,
  mode = "upload",
  onClose,
}: SuccessStatusProps) {
  const isFeedMode = mode === "feed";
  const isSingleClip = clipsCount === 1;
  const primaryLabel = isSingleClip ? "Mở trong Studio" : "Xem các highlight";

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <h3 className="text-lg font-semibold">Highlight đã sẵn sàng</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {isFeedMode
              ? "Video highlight đã được lưu vào thư viện video của khóa học."
              : isSingleClip
                ? "Bạn có thể mở Studio để thêm Mascot, chữ hoặc chỉnh lại trước khi xuất bản."
                : `${clipsCount} đoạn highlight đã được tạo. Hãy chọn đoạn phù hợp nhất để tải xuống hoặc mở trong Studio.`}
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          {isFeedMode ? (
            <>
              {onClose ? (
                <Button onClick={onClose} size="default">
                  Hoàn tất
                </Button>
              ) : null}
              <Button onClick={onViewResults} variant="outline" size="default">
                <Play className="mr-2 h-4 w-4" />
                {primaryLabel}
              </Button>
              {onStartNew ? (
                <Button onClick={onStartNew} variant="ghost" size="default">
                  <Upload className="mr-2 h-4 w-4" />
                  Tải video mới
                </Button>
              ) : null}
            </>
          ) : (
            <>
              <Button onClick={onViewResults} size="default">
                <Play className="mr-2 h-4 w-4" />
                {primaryLabel}
              </Button>
              {onStartNew ? (
                <Button onClick={onStartNew} variant="outline" size="default">
                  <Upload className="mr-2 h-4 w-4" />
                  Tạo highlight khác
                </Button>
              ) : null}
            </>
          )}
        </div>
      </div>

      {clipsCount > 1 && !isFeedMode ? (
        <div className="mt-4 border-t pt-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Download className="h-3 w-3" />
            <span>Mỗi highlight được lưu riêng để bạn chọn và chỉnh tiếp.</span>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
