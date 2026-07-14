"use client";

import { LoaderCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  stage: string;
  onCancel: () => void;
}

export function AIQuizProgress({ stage, onCancel }: Props) {
  const getProgressPercent = (stageText: string): number => {
    if (!stageText) return 5;

    const lower = stageText.toLowerCase();

    if (
      lower.includes("gửi yêu cầu") ||
      lower.includes("đang gửi") ||
      lower.includes("yêu cầu") ||
      lower.includes("kết nối") ||
      lower.includes("khởi tạo")
    ) {
      return 5;
    }

    const match = stageText.match(/(\d+)\/(\d+)/);
    if (match) {
      const current = parseInt(match[1], 10);
      const total = parseInt(match[2], 10);
      if (total > 0) {
        const pct = Math.round((current / total) * 100);
        return Math.min(Math.max(pct, 5), 95);
      }
    }

    if (lower.includes("download")) return 20;
    if (lower.includes("transcribe") || lower.includes("speech") || lower.includes("dịch")) return 45;
    if (lower.includes("generate") || lower.includes("sinh") || lower.includes("tạo")) return 70;
    if (lower.includes("filter") || lower.includes("lọc")) return 90;
    if (lower.includes("complete") || lower.includes("hoàn thành")) return 95;

    return 15;
  };

  const percent = getProgressPercent(stage);

  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center space-y-6 p-8 text-center">
      <div className="relative flex items-center justify-center">
        <div className="absolute h-20 w-20 rounded-full bg-primary/10" />
        <div
          className="absolute h-20 w-20 rounded-full border-2 border-dashed border-primary/35 animate-spin"
          style={{ animationDuration: "8s" }}
        />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-primary/20 bg-primary text-primary-foreground shadow-lg shadow-primary/20">
          <LoaderCircle className="h-7 w-7 animate-spin" />
        </div>
      </div>

      <div className="max-w-md space-y-2">
        <h3 className="text-lg font-bold text-foreground">Đang tạo quiz từ video</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Hệ thống đang đọc nội dung video và chuẩn bị câu hỏi để bạn duyệt trước khi lưu.
        </p>
        <p className="mt-4 inline-block rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
          Trạng thái: {stage || "Đang kết nối..."}
        </p>
      </div>

      <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-muted">
        <div
          className="h-1.5 rounded-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={onCancel}
        className="mt-4 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" />
        Hủy
      </Button>
    </div>
  );
}
