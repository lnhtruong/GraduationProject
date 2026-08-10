"use client";

import * as React from "react";
import { AlertCircle, CheckCircle2, Loader2, Scissors } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { createMutationHooks } from "@/features/_shared/react-query-factories";
import {
  INFERENCE_JOB_SSE_RECONNECT_MS,
  INFERENCE_JOB_STORAGE_TTL_MS,
  clearPersistedInferenceJob,
  readPersistedInferenceJob,
  watchInferenceJob,
  writePersistedInferenceJob,
} from "@/features/_shared/realtime/inference-job-watcher";
import { highlightEditApi } from "../api/highlight-edit.api";
import type {
  VideoCompletedPayload,
  VideoErrorPayload,
} from "@/features/_shared/realtime/media-upload-stream";
import { useHighlightEditSelection } from "../hooks/useHighlightEditSelection";
import HighlightEditList from "./HighlightEditList";
import HighlightEditConfirmDialog from "./HighlightEditConfirmDialog";

export interface EditableHighlightVideo {
  id: number;
  srt_raw_url?: string | null;
  srtRawUrl?: string | null;
  editing_job_id?: string | null;
}

const HIGHLIGHT_EDIT_JOB_STORAGE = {
  key: "learnhub:active-highlight-edit-job",
  storage: "local" as const,
  ttlMs: INFERENCE_JOB_STORAGE_TTL_MS,
};

const useStartHighlightEditMutation = createMutationHooks<
  string,
  Parameters<typeof highlightEditApi.startJob>[0]
>("highlight-edit", "start-edit-job", highlightEditApi.startJob);

type HighlightEditEventEnvelope = {
  data?: Record<string, unknown>;
  result?: Record<string, unknown>;
  jobId?: string | number;
  job_id?: string | number;
  videoId?: string | number;
  video_id?: string | number;
  type?: string;
  status?: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readEventJobId(payload: HighlightEditEventEnvelope): string | null {
  const data = asRecord(payload.data) ?? {};
  const result = asRecord(payload.result) ?? asRecord(data.result) ?? {};
  const raw = result.job_id ?? result.jobId ?? data.job_id ?? data.jobId ?? payload.job_id ?? payload.jobId;
  return raw == null ? null : String(raw);
}

function readEventVideoId(payload: HighlightEditEventEnvelope): string | null {
  const data = asRecord(payload.data) ?? {};
  const result = asRecord(payload.result) ?? asRecord(data.result) ?? {};
  const raw = result.video_id ?? result.videoId ?? data.video_id ?? data.videoId ?? payload.video_id ?? payload.videoId;
  return raw == null ? null : String(raw);
}

function readEventType(payload: HighlightEditEventEnvelope): string {
  const data = asRecord(payload.data) ?? {};
  const result = asRecord(payload.result) ?? asRecord(data.result) ?? {};
  return String(result.type ?? data.type ?? payload.type ?? "").trim().toLowerCase();
}

function readStatus(payload: unknown): string {
  const record = asRecord(payload) ?? {};
  const data = asRecord(record.data) ?? {};
  const result = asRecord(record.result) ?? asRecord(data.result) ?? {};
  return String(result.status ?? data.status ?? record.status ?? "").trim().toLowerCase();
}

function isCompletedStatus(status: string) {
  return ["completed", "complete", "success", "succeeded"].includes(status);
}

function isFailedStatus(status: string) {
  return ["failed", "error", "cancelled", "canceled"].includes(status);
}

function isHighlightEditCompletion(
  payload: VideoCompletedPayload,
  expected: { jobId: string; videoId: number },
) {
  const envelope = payload as unknown as HighlightEditEventEnvelope;
  if (readEventType(envelope) !== "highlight_edit") return false;

  const eventJobId = readEventJobId(envelope);
  if (eventJobId) return eventJobId === expected.jobId;

  return readEventVideoId(envelope) === String(expected.videoId);
}

function isHighlightEditError(
  payload: VideoErrorPayload,
  expectedJobId: string,
) {
  const envelope = payload as unknown as HighlightEditEventEnvelope;
  if (readEventType(envelope) !== "highlight_edit") return false;
  return readEventJobId(envelope) === expectedJobId;
}

interface HighlightEditSheetProps {
  video: EditableHighlightVideo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditApplied?: () => void | Promise<void>;
}

export default function HighlightEditSheet({
  video,
  open,
  onOpenChange,
  onEditApplied,
}: HighlightEditSheetProps) {
  const { user } = useAuth();
  const resolvedUserId = user?.id;
  const videoId = video?.id ?? null;
  const srtUrl = video?.srt_raw_url ?? video?.srtRawUrl ?? null;

  const selection = useHighlightEditSelection(open ? srtUrl : null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [jobId, setJobId] = React.useState<string | null>(null);
  const [isRunning, setIsRunning] = React.useState(false);
  const completionHandledRef = React.useRef(false);
  const onOpenChangeRef = React.useRef(onOpenChange);
  const onEditAppliedRef = React.useRef(onEditApplied);

  React.useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  }, [onOpenChange]);

  React.useEffect(() => {
    onEditAppliedRef.current = onEditApplied;
  }, [onEditApplied]);

  const startMutation = useStartHighlightEditMutation({
    onSuccess: (newJobId) => {
      setJobId(newJobId);
      setIsRunning(true);
      setConfirmOpen(false);
    },
    onError: () => {
      toast.error("Không thể bắt đầu cập nhật highlight. Vui lòng thử lại.");
    },
  });

  React.useEffect(() => {
    if (!videoId || !resolvedUserId) return;
    const persisted = readPersistedInferenceJob({
      ...HIGHLIGHT_EDIT_JOB_STORAGE,
      userId: resolvedUserId,
      contextId: videoId,
    });
    const candidateJobId = persisted?.jobId ?? video?.editing_job_id ?? null;
    if (!candidateJobId) return;

    let cancelled = false;
    highlightEditApi
      .getJobStatus(candidateJobId)
      .then((status) => {
        if (cancelled) return;
        const jobStatus = readStatus(status);
        if (isCompletedStatus(jobStatus) || isFailedStatus(jobStatus)) {
          clearPersistedInferenceJob({ ...HIGHLIGHT_EDIT_JOB_STORAGE });
          return;
        }
        setJobId(candidateJobId);
        setIsRunning(true);
      })
      .catch(() => {
        if (!cancelled) clearPersistedInferenceJob({ ...HIGHLIGHT_EDIT_JOB_STORAGE });
      });

    return () => {
      cancelled = true;
    };
  }, [videoId, resolvedUserId, video?.editing_job_id]);

  React.useEffect(() => {
    if (!resolvedUserId || !videoId) return;
    if (isRunning && jobId) {
      writePersistedInferenceJob(
        { ...HIGHLIGHT_EDIT_JOB_STORAGE, userId: resolvedUserId, contextId: videoId },
        { jobId, status: "pending", contextId: videoId },
      );
    } else {
      clearPersistedInferenceJob({ ...HIGHLIGHT_EDIT_JOB_STORAGE });
    }
  }, [resolvedUserId, videoId, isRunning, jobId]);

  React.useEffect(() => {
    if (!jobId || !resolvedUserId || !isRunning || !videoId) return;

    const activeVideoId = videoId;
    completionHandledRef.current = false;

    const handleDone = () => {
      if (completionHandledRef.current) return;
      completionHandledRef.current = true;
      setIsRunning(false);
      setJobId(null);
      onOpenChangeRef.current(false);
      void Promise.resolve(onEditAppliedRef.current?.()).catch(() => {
        toast.error("Đã cập nhật highlight, nhưng chưa tải lại được bản mới. Vui lòng tải lại trang nếu preview chưa đổi.");
      });
      toast.success("Đã cập nhật highlight.");
    };
    const handleFailed = () => {
      if (completionHandledRef.current) return;
      completionHandledRef.current = true;
      setIsRunning(false);
      setJobId(null);
      toast.error("Cập nhật highlight thất bại. Video hiện tại vẫn được giữ nguyên.");
    };

    const watcher = watchInferenceJob({
      userId: resolvedUserId,
      pollStatus: () => highlightEditApi.getJobStatus(jobId),
      onPollStatus: (status) => {
        const jobStatus = readStatus(status);
        if (isCompletedStatus(jobStatus)) handleDone();
        else if (isFailedStatus(jobStatus)) handleFailed();
      },
      reconnectMs: INFERENCE_JOB_SSE_RECONNECT_MS,
      onCompleted: (payload) => {
        if (isHighlightEditCompletion(payload, { jobId, videoId: activeVideoId })) handleDone();
      },
      onError: (payload) => {
        if (isHighlightEditError(payload, jobId)) handleFailed();
      },
    });

    return () => watcher.close();
  }, [jobId, resolvedUserId, isRunning, videoId]);

  const handleConfirm = () => {
    if (!videoId) return;
    const removeRanges = selection.toPayloadRanges();
    if (removeRanges.length === 0) {
      toast.error("Chọn ít nhất 1 đoạn cần bỏ khỏi highlight.");
      return;
    }
    if (!selection.hasRemainingSegment) {
      toast.error("Cần giữ lại ít nhất 1 đoạn trong highlight.");
      return;
    }

    startMutation.mutate({
      videoId,
      removeRanges,
    });
  };

  const canSubmit = selection.markedCount > 0 && selection.hasRemainingSegment;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="flex w-full max-w-[640px] flex-col gap-0 overflow-hidden p-0 sm:max-w-[640px]"
        >
          <SheetHeader className="border-b px-4 py-4 pr-12 text-left sm:px-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Scissors className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <SheetTitle className="text-lg font-semibold">
                  Tinh chỉnh highlight
                </SheetTitle>
                <SheetDescription className="mt-1 leading-5">
                  Chọn đoạn muốn bỏ. StudyLoop sẽ tạo lại highlight từ video gốc.
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="flex min-h-0 flex-1 flex-col bg-muted/15">
            {isRunning && (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center text-sm text-muted-foreground">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Đang cập nhật highlight</p>
                  <p className="mt-1 max-w-sm">
                    Bạn có thể đóng cửa sổ này. Kết quả sẽ tự cập nhật khi xử lý xong.
                  </p>
                </div>
              </div>
            )}

            {!isRunning && selection.isLoading && (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                Đang tải các đoạn trong highlight...
              </div>
            )}

            {!isRunning && selection.error && (
              <div className="m-4 rounded-xl border border-destructive/30 bg-background p-4 text-sm text-destructive shadow-sm">
                <div className="flex gap-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-medium">Chưa thể mở tinh chỉnh</p>
                    <p className="mt-1 text-destructive/85">{selection.error}</p>
                  </div>
                </div>
              </div>
            )}

            {!isRunning && !selection.isLoading && !selection.error && (
              <>
                <div className="shrink-0 border-b bg-background px-4 py-3 sm:px-5">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-lg border bg-muted/30 px-3 py-2">
                      <p className="text-xs text-muted-foreground">Trong highlight</p>
                      <p className="mt-0.5 font-semibold">{selection.lines.length} đoạn</p>
                    </div>
                    <div className="rounded-lg border bg-muted/30 px-3 py-2">
                      <p className="text-xs text-muted-foreground">Sẽ bỏ</p>
                      <p className="mt-0.5 font-semibold text-primary">
                        {selection.markedCount} đoạn
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex min-h-0 flex-1 flex-col px-4 py-3 sm:px-5">
                  <HighlightEditList
                    lines={selection.lines}
                    displayTimes={selection.displayTimes}
                    selection={selection}
                  />
                </div>

                <div className="shrink-0 border-t bg-background px-4 py-3 shadow-[0_-8px_24px_rgba(15,23,42,0.06)] sm:px-5">
                  {!selection.hasRemainingSegment && (
                    <div className="mb-2 flex items-start gap-2 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      Cần giữ lại ít nhất 1 đoạn trong highlight.
                    </div>
                  )}
                  {selection.markedCount === 0 && selection.hasRemainingSegment && (
                    <div className="mb-2 flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                      Bấm biểu tượng X ở đoạn bạn muốn bỏ.
                    </div>
                  )}
                  <Button
                    type="button"
                    className="h-11 w-full cursor-pointer rounded-lg font-semibold"
                    disabled={!canSubmit}
                    onClick={() => setConfirmOpen(true)}
                  >
                    Cập nhật highlight{selection.markedCount > 0 ? ` · bỏ ${selection.markedCount} đoạn` : ""}
                  </Button>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <HighlightEditConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={handleConfirm}
        isSubmitting={startMutation.isPending}
        markedCount={selection.markedCount}
      />
    </>
  );
}