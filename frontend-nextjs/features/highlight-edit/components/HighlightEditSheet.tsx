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

/** Minimal shape this Sheet needs — satisfied by both `features/video`'s
 * full `Video` type (library) and `CourseFeedVideo` (instructor feed
 * management), so this component doesn't force either surface to construct
 * a fake full `Video` object just to open it. */
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
  /** Called once an edit completes so the caller can refetch its video list/card. */
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
      toast.error("Không thể bắt đầu chỉnh sửa. Vui lòng thử lại.");
    },
  });

  // Resume a persisted edit job for this video (e.g. after a page reload),
  // or pick up the server's own in-flight indicator (editing_job_id).
  // `editing_job_id` in particular can be a STALE snapshot (the caller's
  // `video` prop from before the last edit's post-completion refetch
  // landed) — so before committing to the "isRunning" UI, check the job's
  // actual current status once; only resume watching if it's genuinely
  // still active. This is what prevents an immediate, spurious "vừa cập
  // nhật xong" toast on reopening a video whose prop just hasn't caught up
  // yet.
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
        if (jobStatus === "completed" || ["failed", "error", "cancelled", "canceled"].includes(jobStatus)) {
          // Already resolved before we ever started watching — stale hint,
          // not a fresh event. Clean up silently, no toast.
          clearPersistedInferenceJob({ ...HIGHLIGHT_EDIT_JOB_STORAGE });
          return;
        }
        setJobId(candidateJobId);
        setIsRunning(true);
      })
      .catch(() => {
        // Can't confirm status (e.g. job expired server-side) — don't get
        // stuck showing a "running" UI for something we can't verify.
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
      // Close rather than refetch-in-place: `video` is a snapshot the caller
      // passed in when the Sheet opened, so its `srt_raw_url` is now stale
      // (the edit wrote a NEW url to the DB row, not back to this same one —
      // see contracts.md). Closing forces a fresh `video` object on next
      // open, once the caller's onEditApplied refetch has landed — this is
      // what makes repeated editing (US2) correct, not `selection.refetch()`
      // alone, which would just re-fetch this same stale URL.
      onOpenChange(false);
      onEditApplied?.();
      toast.success("Đã cập nhật highlight.");
    };
    const handleFailed = () => {
      setIsRunning(false);
      setJobId(null);
      toast.error("Chỉnh sửa thất bại. Video cũ vẫn được giữ nguyên.");
    };

    const watcher = watchInferenceJob({
      userId: resolvedUserId,
      pollStatus: () => highlightEditApi.getJobStatus(jobId),
      onPollStatus: (status) => {
        const record = status as Record<string, unknown>;
        const jobStatus = String(record.status ?? "");
        if (jobStatus === "completed") handleDone();
        else if (["failed", "error", "cancelled", "canceled"].includes(jobStatus))
          handleFailed();
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
          className="flex w-full flex-col gap-4 sm:max-w-xl"
        >
          <SheetHeader>
            <SheetTitle>Chỉnh sửa đoạn</SheetTitle>
            <SheetDescription>
              Đánh dấu những đoạn muốn bỏ khỏi highlight này rồi áp dụng. Video
              hiện tại sẽ được thay thế bằng video mới.
            </SheetDescription>
          </SheetHeader>

          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden px-4 pb-4">
            {isRunning && (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <p>Đang áp dụng thay đổi, có thể mất vài phút.</p>
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
              <p className="text-sm text-destructive">{selection.error}</p>
            )}

            {!isRunning && !selection.isLoading && !selection.error && (
              <>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{selection.lines.length} đoạn trong highlight</span>
                  <span>{selection.markedCount} đoạn đã đánh dấu bỏ</span>
                </div>
                <HighlightEditList
                  lines={selection.lines}
                  displayTimes={selection.displayTimes}
                  selection={selection}
                />
                <Button
                  type="button"
                  disabled={
                    selection.markedCount === 0 || !selection.hasRemainingSegment
                  }
                  onClick={() => setConfirmOpen(true)}
                >
                  Áp dụng ({selection.markedCount})
                </Button>
                {!selection.hasRemainingSegment && (
                  <p className="text-xs text-destructive">
                    Phải giữ lại ít nhất 1 đoạn.
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
