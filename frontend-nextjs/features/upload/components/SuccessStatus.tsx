import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Edit3, ListVideo, RotateCcw } from "lucide-react";

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

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold">
            {isSingleClip ? "Highlight đã sẵn sàng" : "Các highlight đã sẵn sàng"}
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {isFeedMode
              ? "Video đã được tạo xong và có thể dùng cho feed khóa học."
              : isSingleClip
                ? "Bạn có thể xem lại kết quả, tải xuống hoặc mở Studio để chỉnh tiếp."
                : `${clipsCount} đoạn đã được tạo. Hãy chọn đoạn phù hợp trong danh sách kết quả bên dưới.`}
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          {isFeedMode && onClose ? (
            <Button type="button" onClick={onClose}>
              Hoàn tất
            </Button>
          ) : null}

          <Button type="button" onClick={onViewResults}>
            {isSingleClip ? (
              <Edit3 className="mr-2 h-4 w-4" />
            ) : (
              <ListVideo className="mr-2 h-4 w-4" />
            )}
            {isSingleClip ? "Mở Studio" : "Xem kết quả"}
          </Button>

          {onStartNew ? (
            <Button type="button" onClick={onStartNew} variant="outline">
              <RotateCcw className="mr-2 h-4 w-4" />
              Tạo highlight khác
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
