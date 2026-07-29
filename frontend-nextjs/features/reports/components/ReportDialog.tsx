"use client";

import { useState } from "react";
import { Flag, ImagePlus, Loader2, X } from "lucide-react";
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
  const submit = useSubmitReport();

  const handleClose = () => {
    setReason("");
    setErrorMsg(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (reason.trim().length < MIN_REASON) return;
    setErrorMsg(null);
    try {
      const evidenceNote = evidenceFiles.length
        ? "\n\nMinh chứng đã chọn: " + evidenceFiles.map((file) => file.name).join(", ")
        : "";
      await submit.mutateAsync({
        targetType,
        targetId,
        reason: reason.trim() + evidenceNote,
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

          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Ảnh minh chứng</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Frontend đã hỗ trợ chọn ảnh; backend upload minh chứng sẽ nối API sau.
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" asChild disabled={submit.isPending}>
                <label className="cursor-pointer gap-2">
                  <ImagePlus className="h-3.5 w-3.5" />
                  Chọn ảnh
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(event) => {
                      const files = Array.from(event.target.files ?? []).slice(0, 5);
                      setEvidenceFiles(files);
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
              </Button>
            </div>
            {evidenceFiles.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {evidenceFiles.map((file) => (
                  <span
                    key={file.name}
                    className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs"
                  >
                    <span className="truncate">{file.name}</span>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() =>
                        setEvidenceFiles((current) =>
                          current.filter((item) => item.name !== file.name),
                        )
                      }
                      aria-label={"Gỡ " + file.name}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : null}
          </div>

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
