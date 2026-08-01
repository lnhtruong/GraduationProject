"use client";

import { useState } from "react";
import { Flag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSubmitReport } from "../api/report.hooks";
import type { ReportTargetType } from "../types";
import { EvidenceImagePicker } from "@/features/image/components/EvidenceImagePicker";

interface Props {
  open: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: number;
  targetLabel: string;
}

const MAX_REASON = 2000;
const MIN_REASON = 5;

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const message: string | undefined = error.response?.data?.message;
    if (status === 409) return message ?? "Báo cáo đã tồn tại hoặc nội dung không còn hợp lệ.";
    if (status === 403) return message ?? "Bạn không thể báo cáo nội dung này.";
    if (status === 404) return "Không tìm thấy nội dung cần báo cáo.";
    if (status === 400) return message ?? "Dữ liệu báo cáo không hợp lệ.";
  }
  return "Gửi báo cáo thất bại. Vui lòng thử lại.";
}

export function ReportDialog({ open, onClose, targetType, targetId, targetLabel }: Props) {
  const [reason, setReason] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [evidenceImageIds, setEvidenceImageIds] = useState<number[]>([]);
  const submit = useSubmitReport();

  const handleClose = () => {
    setReason("");
    setErrorMsg(null);
    setEvidenceImageIds([]);
    onClose();
  };

  const handleSubmit = async () => {
    if (reason.trim().length < MIN_REASON) return;
    setErrorMsg(null);
    try {
      await submit.mutateAsync({
        targetType,
        targetId,
        reason: reason.trim(),
        ...(evidenceImageIds.length > 0 ? { evidenceImageIds } : {}),
      });
      toast.success("Đã gửi báo cáo. Chúng tôi sẽ xem xét sớm nhất có thể.");
      handleClose();
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    }
  };

  const charCount = reason.length;
  const isValid = charCount >= MIN_REASON;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-4 w-4 text-destructive" />
            Báo cáo {targetLabel}
          </DialogTitle>
          <DialogDescription>
            Mô tả lý do báo cáo để chúng tôi có thể xem xét nhanh nhất.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-1">
          <Textarea
            placeholder="Nhập lý do báo cáo (ít nhất 5 ký tự)..."
            className="h-28 resize-none text-sm"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value.slice(0, MAX_REASON));
              setErrorMsg(null);
            }}
            disabled={submit.isPending}
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {!isValid && charCount > 0 && (
                <span className="text-destructive">Tối thiểu {MIN_REASON} ký tự</span>
              )}
            </span>
            <span className={charCount > MAX_REASON * 0.9 ? "text-amber-500" : ""}>
              {charCount}/{MAX_REASON}
            </span>
          </div>

          <EvidenceImagePicker
            type="report"
            value={evidenceImageIds}
            onChange={setEvidenceImageIds}
            disabled={submit.isPending}
          />

          {errorMsg && (
            <p className="rounded-lg bg-destructive/8 px-3 py-2 text-xs text-destructive">
              {errorMsg}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={handleClose} disabled={submit.isPending}>
            Huỷ
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || submit.isPending}
            className="gap-2"
          >
            {submit.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Gửi báo cáo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
