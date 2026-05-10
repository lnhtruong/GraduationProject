"use client";

import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Clock, AlertCircle, Loader2 } from "lucide-react";
import type { UploadStatus } from "@/features/upload/types";

// ============================================================================
// ANIMATED PROGRESS HOOK
// Smoothly crawls toward the target milestone instead of jumping.
//
// Behaviour per stage (4-step pipeline, each segment = 25%):
//   - When target increases (new stage), instantly jump to the *previous* milestone
//     (e.g. target 25→50 means we're starting segment 2, so reset to 25%)
//   - Then crawl at ~1% per second toward (target - 1%), slowing down near the ceiling
//   - At target === 100 (final stage), allow reaching 100%
// ============================================================================

function useAnimatedProgress(target: number, segmentSize = 25): number {
  const [displayed, setDisplayed] = useState(0);

  // Jump to segment start when a new stage arrives
  useEffect(() => {
    setDisplayed((prev) => {
      if (target > prev) return Math.max(0, target - segmentSize);
      return prev;
    });
  }, [target, segmentSize]);

  // Crawl toward ceiling (target-1% for intermediate, 100% for last)
  useEffect(() => {
    const ceiling = target === 100 ? 100 : target - 1;
    const interval = setInterval(() => {
      setDisplayed((prev) => {
        if (prev >= ceiling) return prev;
        const remaining = ceiling - prev;
        // Ease-out: covers ~24% in ~24s, slows near ceiling
        const step = Math.max(0.02, remaining * 0.008);
        return Math.min(prev + step, ceiling);
      });
    }, 30);
    return () => clearInterval(interval);
  }, [target]);

  return Math.round(displayed);
}

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
    progress: 0,
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
// PROCESSING STEPS
// Labels match what Colab backend sends in the "stage" field ("X/Y: ...")
// ============================================================================

const COLAB_STEPS = [
  "Phiên âm nội dung video",
  "Chọn highlight bằng AI",
  "Cắt & ghép video",
  "Tải lên & hoàn tất",
];

function ProcessingSteps({ stage }: { stage?: string }) {
  // Parse current step from "X/Y: Label" format, e.g. "2/4: Selecting Highlights with AI"
  const currentStep = stage ? parseInt(stage.split("/")[0]) : 0;

  return (
    <div className="space-y-2 pt-2 border-t">
      <h4 className="text-sm font-medium">Các bước xử lý:</h4>
      <div className="space-y-1 text-xs">
        {COLAB_STEPS.map((label, index) => {
          const stepNum = index + 1;
          const isDone = stepNum < currentStep;
          const isActive = stepNum === currentStep;

          return (
            <div key={stepNum} className="flex items-center gap-2">
              {isDone ? (
                <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />
              ) : isActive ? (
                <Loader2 className="w-3 h-3 animate-spin text-blue-500 shrink-0" />
              ) : (
                <Clock className="w-3 h-3 text-gray-400 shrink-0" />
              )}
              <span
                className={
                  isDone
                    ? "text-green-600 line-through"
                    : isActive
                      ? "text-blue-600 font-medium"
                      : "text-muted-foreground"
                }
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

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

  // Use backend stage/progress when available, fall back to config defaults
  const displayStage = stage || config.description;

  // Derive milestone from "X/Y: ..." stage string (Colab doesn't send numeric progress)
  // e.g. "2/4: Selecting Highlights" → 50%
  const stageMatch = stage?.match(/^(\d+)\/(\d+)/);
  const stageProgress = stageMatch
    ? Math.round((parseInt(stageMatch[1]) / parseInt(stageMatch[2])) * 100)
    : undefined;

  // Target for the animated bar: explicit WS progress > stage milestone > status default
  const targetProgress =
    progressPercent ??
    stageProgress ??
    (status === "pending" ? 0 : config.progress);

  // Smoothly crawl toward targetProgress instead of jumping to it
  const displayProgress = useAnimatedProgress(targetProgress);

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

      {/* Processing Steps — driven by stage string "X/Y: Label" from Colab polling */}
      {status === "processing" && <ProcessingSteps stage={stage} />}

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
