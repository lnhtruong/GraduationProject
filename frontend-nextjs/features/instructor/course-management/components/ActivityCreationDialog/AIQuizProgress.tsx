"use client";

import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  stage: string;
  onCancel: () => void;
}

export function AIQuizProgress({ stage, onCancel }: Props) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-6 min-h-[300px]">
      <div className="relative flex items-center justify-center">
        {/* Pulsing Ripple rings */}
        <div className="absolute h-20 w-20 animate-ping rounded-full bg-primary/20" />
        <div className="absolute h-28 w-28 animate-pulse rounded-full bg-primary/10" />
        <div className="relative h-16 w-16 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center shadow-lg">
          <Sparkles className="h-8 w-8 text-primary animate-pulse" />
        </div>
      </div>

      <div className="space-y-2 max-w-md">
        <h3 className="text-lg font-bold text-foreground">Đang khởi tạo Quiz AI</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Chúng tôi đang phân tích nội dung video, trích xuất phụ đề và tạo các câu hỏi trắc nghiệm chất lượng cao bằng AI.
        </p>
        <p className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary border border-primary/20 animate-pulse mt-4">
          Tiến trình: {stage || "Đang kết nối worker..."}
        </p>
      </div>

      <div className="w-full max-w-xs bg-muted rounded-full h-1.5 overflow-hidden">
        <div className="bg-primary h-1.5 rounded-full w-2/3 animate-pulse" />
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={onCancel}
        className="text-xs text-muted-foreground hover:text-foreground mt-4 gap-1.5"
      >
        <X className="h-3.5 w-3.5" />
        Hủy quá trình
      </Button>
    </div>
  );
}
