import { CheckCircle, Play, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SuccessStatusProps {
  clipsCount: number;
  onViewResults: () => void;
  onStartNew?: () => void;
}

export default function SuccessStatus({
  onViewResults,
  onStartNew,
}: SuccessStatusProps) {
  return (
    <div className="p-6 bg-accent border rounded-lg">
      <div className="flex items-center gap-4">
        <div className="shrink-0">
          <div className="w-12 h-12 bg-auto rounded-full flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-primary" />
          </div>
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-semibold text-primary">
            Video đã được xử lý thành công!
          </h3>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={onViewResults} className="bg-primary text-white">
            <Play className="w-4 h-4 mr-2" />
            Xem kết quả
          </Button>
          {onStartNew && (
            <Button onClick={onStartNew} variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Tải video mới
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
