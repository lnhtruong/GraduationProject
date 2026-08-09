"use client";

import { type ElementType, useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  jobType?: string;
}

interface StatusConfig {
  label: string;
  color: string;
  icon: ElementType;
  progress: number;
  description: string;
}

interface StageInfo {
  label: string;
  progress: number;
  activeStep: number;
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
    description: "Đang tải video lên StudyLoop",
  },
  pending: {
    label: "Đang chờ",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock,
    progress: 3,
    description: "Video đã được nhận và đang chờ xử lý",
  },
  processing: {
    label: "Đang tạo highlight",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: Loader2,
    progress: 60,
    description: "StudyLoop đang phân tích nội dung và chọn đoạn đáng giữ",
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

const SINGLE_HIGHLIGHT_STEPS = [
  "Chuẩn bị transcript và video",
  "Chọn nội dung phù hợp",
  "Render phụ đề vào video",
  "Lưu highlight vào thư viện",
];

const MULTI_HIGHLIGHT_STEPS = [
  "Chuẩn bị transcript và video",
  "Lập dàn ý và render video theo chủ đề",
  "Lưu các highlight vào thư viện",
];

const SINGLE_STAGE_MAP: Record<string, StageInfo> = {
  queued: {
    label: "Đang chờ worker xử lý",
    progress: 3,
    activeStep: 0,
  },
  "1/4": {
    label: "Đang tải hoặc tạo transcript",
    progress: 18,
    activeStep: 1,
  },
  "1b/4": {
    label: "Đang tải video để render",
    progress: 28,
    activeStep: 1,
  },
  "2/4": {
    label: "Đang chọn nội dung phù hợp",
    progress: 45,
    activeStep: 2,
  },
  "3/4": {
    label: "Đang render video và gắn phụ đề",
    progress: 72,
    activeStep: 3,
  },
  "4/4": {
    label: "Đang tải highlight lên thư viện",
    progress: 90,
    activeStep: 4,
  },
};

const MULTI_STAGE_MAP: Record<string, StageInfo> = {
  queued: {
    label: "Đang chờ worker xử lý",
    progress: 3,
    activeStep: 0,
  },
  "1/3": {
    label: "Đang tải hoặc tạo transcript",
    progress: 18,
    activeStep: 1,
  },
  "1b/3": {
    label: "Đang tải video để render",
    progress: 28,
    activeStep: 1,
  },
  "2/3": {
    label: "Đang lập dàn ý và render video theo chủ đề",
    progress: 60,
    activeStep: 2,
  },
  "3/3": {
    label: "Đang tải transcript và lưu các highlight",
    progress: 90,
    activeStep: 3,
  },
};

function normalizeStage(stage?: string): string {
  return stage?.trim() ?? "";
}

function getStageKey(stage?: string): string | null {
  const normalized = normalizeStage(stage);
  if (!normalized) return null;
  if (/^queued$/i.test(normalized)) return "queued";

  const match = normalized.match(/^(\d+b?\/\d+)/i);
  return match?.[1].toLowerCase() ?? null;
}

function getStageTotal(stage?: string): number | null {
  const key = getStageKey(stage);
  if (!key) return null;

  const total = key.match(/\/(\d+)$/)?.[1];
  return total ? Number(total) : null;
}

function isMultiHighlightStage(stage?: string): boolean {
  const total = getStageTotal(stage);
  return total === 3;
}

function isMultiHighlightJob(jobType?: string, stage?: string): boolean {
  const normalizedType = jobType?.trim().toLowerCase();
  if (normalizedType) return normalizedType === "highlight-multi";
  return isMultiHighlightStage(stage);
}

function fallbackStageInfo(stage?: string, isMultiHighlight = false): StageInfo | undefined {
  const normalized = normalizeStage(stage);
  if (!normalized) return undefined;

  const raw = normalized.replace(/^\d+b?\/\d+\s*:\s*/i, "").trim().toLowerCase();

  if (/gửi yêu cầu|gui yeu cau|request|queued|queue|waiting|chờ|cho/.test(raw)) {
    return {
      label: "Đang gửi yêu cầu tạo highlight",
      progress: 5,
      activeStep: 0,
    };
  }
  if (/download.*srt|transcrib|transcript|speech|audio|subtitle/.test(raw)) {
    return {
      label: "Đang tải hoặc tạo transcript",
      progress: 18,
      activeStep: 1,
    };
  }

  if (/download.*video|video.*render/.test(raw)) {
    return {
      label: "Đang tải video để render",
      progress: 28,
      activeStep: 1,
    };
  }

  if (/outlin|topic/.test(raw)) {
    return {
      label: "Đang lập dàn ý và render video theo chủ đề",
      progress: 60,
      activeStep: isMultiHighlight ? 2 : 3,
    };
  }

  if (/select|highlight|analy/.test(raw)) {
    return {
      label: "Đang chọn nội dung phù hợp",
      progress: 45,
      activeStep: 2,
    };
  }

  if (/render|burn|clip|merge|stitch/.test(raw)) {
    return {
      label: isMultiHighlight
        ? "Đang lập dàn ý và render video theo chủ đề"
        : "Đang render video và gắn phụ đề",
      progress: isMultiHighlight ? 60 : 72,
      activeStep: isMultiHighlight ? 2 : 3,
    };
  }

  if (/upload|final|complete|library|persist|save/.test(raw)) {
    return {
      label: isMultiHighlight
        ? "Đang tải transcript và lưu các highlight"
        : "Đang tải highlight lên thư viện",
      progress: 90,
      activeStep: isMultiHighlight ? 3 : 4,
    };
  }

  return {
    label: normalized,
    progress: isMultiHighlight ? 60 : 45,
    activeStep: isMultiHighlight ? 2 : 2,
  };
}

function getStageInfo(stage?: string, jobType?: string): StageInfo | undefined {
  const key = getStageKey(stage);
  const isMultiHighlight = isMultiHighlightJob(jobType, stage);
  const map = isMultiHighlight ? MULTI_STAGE_MAP : SINGLE_STAGE_MAP;

  if (key && map[key]) {
    return map[key];
  }

  return fallbackStageInfo(stage, isMultiHighlight);
}

function resolveTargetProgress(
  status: UploadStatus,
  statusProgress: number,
  stageProgress?: number,
  progressPercent?: number,
) {
  if (status === "failed") return 0;
  if (status === "completed") return 100;

  const explicitValues = [stageProgress, progressPercent].filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value),
  );
  const values = explicitValues.length > 0 ? explicitValues : [statusProgress];

  return Math.max(0, Math.min(100, Math.max(...values)));
}

function ProcessingSteps({
  stage,
  jobType,
}: {
  stage?: string;
  jobType?: string;
}) {
  const isMultiHighlight = isMultiHighlightJob(jobType, stage);
  const steps = isMultiHighlight ? MULTI_HIGHLIGHT_STEPS : SINGLE_HIGHLIGHT_STEPS;
  const activeStep = getStageInfo(stage, jobType)?.activeStep ?? 0;

  return (
    <div className="space-y-2 border-t pt-3">
      <h4 className="text-sm font-medium">Các bước đang chạy</h4>
      <div className="space-y-1.5 text-xs">
        {steps.map((label, index) => {
          const stepNum = index + 1;
          const isDone = activeStep > 0 && stepNum < activeStep;
          const isActive = stepNum === activeStep;

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
  jobType,
}: ProcessingStatusProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  const stageInfo = getStageInfo(stage, jobType);
  const isMultiHighlight = isMultiHighlightJob(jobType, stage);
  const targetProgress = resolveTargetProgress(
    status,
    status === "pending" ? STATUS_CONFIG.pending.progress : config.progress,
    stageInfo?.progress,
    progressPercent,
  );
  const displayProgress = useAnimatedProgress(targetProgress);
  const displayLabel =
    status === "processing" && isMultiHighlight
      ? "Đang tạo nhiều highlight"
      : config.label;
  const displayStage =
    status === "failed"
      ? config.description
      : stageInfo?.label || config.description;

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${iconColor} ${iconAnimation}`} />
          <div className="min-w-0">
            <h3 className="font-medium">{displayLabel}</h3>
            <p className="text-sm text-muted-foreground">{displayStage}</p>
          </div>
        </div>
        {status === "failed" && (
          <span className="w-fit shrink-0 rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-700">
            Lỗi
          </span>
        )}
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

      {isDownloading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Đang chuẩn bị kết quả...
        </div>
      )}

      {status === "processing" && (
        <ProcessingSteps stage={stage} jobType={jobType} />
      )}

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
