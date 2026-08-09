"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
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
  INFERENCE_JOB_STORAGE_TTL_MS,
  clearPersistedInferenceJob,
  readPersistedInferenceJob,
  watchInferenceJob,
  writePersistedInferenceJob,
} from "@/features/_shared/realtime/inference-job-watcher";
import { highlightEditApi } from "../api/highlight-edit.api";
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

interface HighlightEditSheetProps {
  video: EditableHighlightVideo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditApplied?: () => void;
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
        const jobStatus = String((status as Record<string, unknown>).status ?? "");
        if (
          jobStatus === "completed" ||
          ["failed", "error", "cancelled", "canceled"].includes(jobStatus)
        ) {
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
    if (!jobId || !resolvedUserId || !isRunning) return;

    const handleDone = () => {
      setIsRunning(false);
      setJobId(null);
      onOpenChange(false);
      onEditApplied?.();
      toast.success("Đã cập nhật highlight.");
    };
    const handleFailed = () => {
      setIsRunning(false);
      setJobId(null);
      toast.error("Cập nhật highlight thất bại. Video hiện tại vẫn được giữ nguyên.");
    };

    const watcher = watchInferenceJob({
      userId: resolvedUserId,
      pollStatus: () => highlightEditApi.getJobStatus(jobId),
      onPollStatus: (status) => {
        const record = status as Record<string, unknown>;
        const jobStatus = String(record.status ?? "");
        if (jobStatus === "completed") handleDone();
        else if (["failed", "error", "cancelled", "canceled"].includes(jobStatus)) {
          handleFailed();
        }
      },
    });

    return () => watcher.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, resolvedUserId, isRunning]);

  const handleConfirm = () => {
    if (!videoId) return;
    startMutation.mutate({
      videoId,
      removeRanges: selection.toPayloadRanges(),
    });
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="flex w-full max-w-[600px] flex-col gap-3 sm:max-w-[600px]"
        >
          <SheetHeader className="pb-2 pr-10">
            <SheetTitle>Tinh chỉnh highlight</SheetTitle>
            <SheetDescription>
              Chọn các đoạn muốn bỏ khỏi highlight hiện tại. StudyLoop sẽ tạo
              lại bản highlight mới từ video gốc.
            </SheetDescription>
          </SheetHeader>

          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-4 pb-4">
            {isRunning && (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <p>Đang cập nhật highlight, có thể mất vài phút.</p>
                <p>Bạn có thể đóng cửa sổ này và quay lại sau.</p>
              </div>
            )}

            {!isRunning && selection.isLoading && (
              <div className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang tải danh sách đoạn...
              </div>
            )}

            {!isRunning && selection.error && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                {selection.error}
              </div>
            )}

            {!isRunning && !selection.isLoading && !selection.error && (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                  <span>{selection.lines.length} đoạn trong highlight</span>
                  <span>{selection.markedCount} đoạn sẽ bỏ</span>
                </div>
                <HighlightEditList
                  lines={selection.lines}
                  displayTimes={selection.displayTimes}
                  selection={selection}
                />
                <Button
                  type="button"
                  className="w-full"
                  disabled={
                    selection.markedCount === 0 || !selection.hasRemainingSegment
                  }
                  onClick={() => setConfirmOpen(true)}
                >
                  Cập nhật highlight · bỏ {selection.markedCount} đoạn
                </Button>
                {!selection.hasRemainingSegment && (
                  <p className="text-xs text-destructive">
                    Cần giữ lại ít nhất 1 đoạn trong highlight.
                  </p>
                )}
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