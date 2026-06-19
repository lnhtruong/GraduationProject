"use client";

import { Sparkles, Brain, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  stage: string;
  onCancel: () => void;
}

export function AIQuizProgress({ stage, onCancel }: Props) {
  const getProgressPercent = (stageText: string): number => {
    if (!stageText) return 5;
    
    const lower = stageText.toLowerCase();
    
    // Check initial connection/request stages first to prevent matching "sinh" or "generate" keywords
    if (
      lower.includes("gửi yêu cầu") || 
      lower.includes("đang gửi") || 
      lower.includes("yêu cầu") || 
      lower.includes("kết nối") ||
      lower.includes("khởi tạo")
    ) {
      return 5;
    }
    
    // Try to parse fraction like "1/4" or "2/3"
    const match = stageText.match(/(\d+)\/(\d+)/);
    if (match) {
      const current = parseInt(match[1], 10);
      const total = parseInt(match[2], 10);
      if (total > 0) {
        const pct = Math.round((current / total) * 100);
        // Clamp between 5% and 95%
        return Math.min(Math.max(pct, 5), 95);
      }
    }
    
    // Keyword fallbacks
    if (lower.includes("download")) return 20;
    if (lower.includes("transcribe") || lower.includes("speech") || lower.includes("dịch")) return 45;
    if (lower.includes("generate") || lower.includes("sinh")) return 70;
    if (lower.includes("filter") || lower.includes("lọc")) return 90;
    if (lower.includes("complete") || lower.includes("hoàn thành")) return 95;
    
    return 15; // default fallback
  };

  const percent = getProgressPercent(stage);

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-6 min-h-[300px]">
      <div className="relative flex items-center justify-center">
        {/* Glowing Brand Background */}
        <div className="absolute h-24 w-24 rounded-full bg-primary opacity-20 blur-xl animate-pulse" />
        
        {/* Rotating Dashed Outer Ring */}
        <div 
          className="absolute h-20 w-20 rounded-full border-2 border-dashed border-primary/30 animate-spin" 
          style={{ animationDuration: '8s' }} 
        />
        
        {/* Pulsing Ripple rings */}
        <div className="absolute h-16 w-16 animate-ping rounded-full bg-primary/10" />

        {/* Inner container with website's primary brand color */}
        <div className="relative h-16 w-16 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/25 border border-primary/20">
          <Brain className="h-8 w-8 text-primary-foreground animate-pulse" />
          <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-yellow-300 animate-bounce" style={{ animationDuration: '2s' }} />
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
        <div 
          className="bg-primary h-1.5 rounded-full transition-all duration-500 ease-out" 
          style={{ width: `${percent}%` }}
        />
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
