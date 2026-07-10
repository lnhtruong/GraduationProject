"use client";

import { type ElementType, useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { UploadStatus } from "@/features/upload/types";
import { getUserFacingErrorMessage } from "@/lib/user-facing-error";
import { AlertCircle, CheckCircle, Clock, Loader2 } from "lucide-react";

function useAnimatedProgress(target: number): number {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    const ceiling = target === 100 ? 100 : Math.max(0, target - 1);
    const interval = window.setInterval(() => {
      setDisplayed((prev) => {
        if (prev > ceiling) return ceiling;
        if (prev >= ceiling) return prev;
        const remaining = ceiling - prev;
        const step = Math.max(0.02, remaining * 0.008);
        return Math.min(prev + step, ceiling);
      });
    }, 30);
    return () => window.clearInterval(interval);
  }, [target]);

  return Math.round(displayed);
}

interface ProcessingStatusProps {
  status: UploadStatus;
  jobId: string | null;
  isDownloading?: boolean;
  error?: string | null;
  stage?: string;
  progressPercent?: number;
}

interface StatusConfig {
  label: string;
  color: string;
  icon: ElementType;
  progress: number;
  description: string;
}

const STATUS_CONFIG: Record<UploadStatus, StatusConfig> = {
  idle: {
    label: "Sẵn sàng",
    color: "bg-gray-100 text-gray-800 border-gray-200",
    icon: Clock,
    progress: 0,
    description: "Chọn video để bắt đầu",
  },
  uploading: {
    label: "Đang tải lên",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: Loader2,
    progress: 50,
    description: "Đang tải video lên LearnHub",
  },
  pending: {
    label: "Đang chờ",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock,
    progress: 0,
    description: "Video đã được nhận và đang chờ AI xử lý",
  },
  processing: {
    label: "Đang cắt highlight",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: Loader2,
    progress: 60,
    description: "LearnHub đang phân tích nội dung và chọn đoạn đáng giữ",
  },
  completed: {
    label: "Hoàn thành",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle,
    progress: 100,
    description: "Video đã xử lý xong",
  },
  failed: {
    label: "Không thành công",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: AlertCircle,
    progress: 0,
    description: "Có lỗi xảy ra trong quá trình xử lý",
  },
};

const COLAB_STEPS = [
  "Nhận diện nội dung trong video",
  "Chọn đoạn đáng giữ lại",
  "Cắt và ghép highlight",
  "Lưu kết quả vào thư viện",
];

function normalizeStageLabel(stage?: string): string | undefined {
  if (!stage) return undefined;
  const raw = stage.replace(/^\d+\/\d+\s*:\s*/, "").trim().toLowerCase();

  if (/transcrib|speech|audio|subtitle/.test(raw)) {
    return "Nhận diện nội dung trong video";
  }
  if (/select|highlight|analy/.test(raw)) {
    return "Chọn đoạn đáng giữ lại";
  }
  if (/cut|clip|merge|render|stitch/.test(raw)) {
    return "Cắt và ghép highlight";
  }
  if (/upload|final|complete/.test(raw)) {
    return "Lưu kết quả vào thư viện";
  }

  return stage;
}

function ProcessingSteps({ stage }: { stage?: string }) {
  const currentStep = stage ? Number.parseInt(stage.split("/")[0], 10) : 0;

  return (
    <div className="space-y-2 border-t pt-3">
      <h4 className="text-sm font-medium">Các bước đang chạy</h4>
      <div className="space-y-1.5 text-xs">
        {COLAB_STEPS.map((label, index) => {
          const stepNum = index + 1;
          const isDone = stepNum < currentStep;
          const isActive = stepNum === currentStep;

          return (
            <div key={stepNum} className="flex items-center gap-2">
              {isDone ? (
                <CheckCircle className="h-3 w-3 shrink-0 text-green-500" />
              ) : isActive ? (
                <Loader2 className="h-3 w-3 shrink-0 animate-spin text-blue-500" />
              ) : (
                <Clock className="h-3 w-3 shrink-0 text-muted-foreground" />
              )}
              <span
                className={
                  isDone
                    ? "text-green-600 line-through"
                    : isActive
                      ? "font-medium text-blue-600"
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

export default function ProcessingStatus({
  status,
  isDownloading = false,
  error,
  stage,
  progressPercent,
}: ProcessingStatusProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  const stageMatch = stage?.match(/^(\d+)\/(\d+)/);
  const stageProgress = stageMatch
    ? Math.round((Number(stageMatch[1]) / Number(stageMatch[2])) * 100)
    : undefined;
  const targetProgress =
    progressPercent ??
    stageProgress ??
    (status === "pending" ? 0 : config.progress);
  const displayProgress = useAnimatedProgress(targetProgress);
  const displayStage =
    status === "failed" ? config.description : normalizeStageLabel(stage) || config.description;

  const safeErrorMessage = useMemo(
    () =>
      error
        ? getUserFacingErrorMessage(
            error,
            "Không thể xử lý video. Vui lòng thử lại.",
          )
        : null,
    [error],
  );

  if (status === "idle") return null;

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
  const iconAnimation =
    status === "processing" || status === "uploading" ? "animate-spin" : "";

  return (
    <div className="space-y-4 rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Icon className={`h-5 w-5 ${iconColor} ${iconAnimation}`} />
          <div>
            <h3 className="font-medium">{config.label}</h3>
            <p className="text-sm text-muted-foreground">{displayStage}</p>
          </div>
        </div>
        <Badge variant="outline" className={config.color}>
          {status === "failed" ? "Lỗi" : config.label}
        </Badge>
      </div>

      {status !== "failed" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tiến độ</span>
            <span className="font-medium">{Math.round(displayProgress)}%</span>
          </div>
          <Progress value={displayProgress} className="h-2" />
        </div>
      )}

      {status === "failed" && safeErrorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{safeErrorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        {isDownloading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Đang tải kết quả về...
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          Cập nhật lần cuối: {new Date().toLocaleTimeString("vi-VN")}
        </div>
      </div>

      {status === "processing" && <ProcessingSteps stage={stage} />}

      {status === "pending" && (
        <div className="space-y-2 border-t pt-3">
          <h4 className="text-sm font-medium">Đang chờ xử lý</h4>
          <div className="text-xs text-muted-foreground">
            Thời gian xử lý phụ thuộc vào độ dài video và số lượng yêu cầu đang chờ.
          </div>
        </div>
      )}
    </div>
  );
}
