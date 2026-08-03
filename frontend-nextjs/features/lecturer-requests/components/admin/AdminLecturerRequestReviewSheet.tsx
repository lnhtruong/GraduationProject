"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, User, Calendar } from "lucide-react";
import { LecturerRequestStatusBadge } from "../LecturerRequestStatusBadge";
import { useReviewLecturerRequest } from "../../api/lecturer-requests.hooks";
import type { LecturerRequest } from "../../types/lecturer-request.types";
import { EvidenceImageGallery } from "@/features/image/components/EvidenceImageGallery";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface AdminLecturerRequestReviewSheetProps {
  request: LecturerRequest | null;
  open: boolean;
  onClose: () => void;
}

export function AdminLecturerRequestReviewSheet({
  request,
  open,
  onClose,
}: AdminLecturerRequestReviewSheetProps) {
  const [reviewNote, setReviewNote] = useState("");
  const reviewMutation = useReviewLecturerRequest();

  const handleClose = () => {
    if (reviewMutation.isPending) return;
    setReviewNote("");
    onClose();
  };

  const handleReview = async (approve: boolean) => {
    if (!request) return;
    try {
      await reviewMutation.mutateAsync({
        id: request.id,
        dto: { approve, reviewNote: reviewNote.trim() || undefined },
      });
      toast.success(approve ? "Đã duyệt yêu cầu thành công." : "Đã từ chối yêu cầu.");
      setReviewNote("");
      onClose();
    } catch {
      toast.error("Có lỗi xảy ra. Vui lòng thử lại.");
    }
  };

  if (!request) return null;

  const user = request.requester;
  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.email ||
    `User #${request.userId}`;
  const initials = fullName.slice(0, 2).toUpperCase();

  return (
    <Sheet open={open} onOpenChange={(v) => !v && handleClose()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="border-b border-border/50 px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <SheetTitle className="text-base">Chi tiết yêu cầu #{request.id}</SheetTitle>
            <LecturerRequestStatusBadge status={request.status} />
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="space-y-6 px-6 py-5">
            {/* Requester info */}
            <div className="flex items-center gap-4 rounded-xl bg-muted/40 px-4 py-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary overflow-hidden">
                {user?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatarUrl} alt={fullName} className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{fullName}</p>
                <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            {/* Date */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 shrink-0" />
              <span>Gửi lúc {formatDate(request.created_at)}</span>
            </div>

            {/* Confirm message */}
            {request.confirm ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Lý do / Giới thiệu
                </div>
                <div className="rounded-xl bg-muted/30 px-4 py-3 text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                  {request.confirm}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Người dùng không cung cấp lý do.
              </p>
            )}

            {request.evidenceImages && request.evidenceImages.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Ảnh minh chứng ({request.evidenceImages.length})</p>
                <EvidenceImageGallery
                  images={request.evidenceImages}
                  className="grid grid-cols-2 gap-2"
                  imageClassName="h-28 w-full object-cover"
                />
              </div>
            )}

            {/* Review note (existing, if rejected) */}
            {request.status === "rejected" && request.reviewNote && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-destructive">Phản hồi từ admin</p>
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {request.reviewNote}
                </div>
              </div>
            )}

            {/* Review note input (only when pending) */}
            {request.status === "pending" && (
              <div className="space-y-2">
                <Label htmlFor="reviewNote" className="text-sm">
                  Ghi chú phản hồi{" "}
                  <span className="font-normal text-muted-foreground">(tuỳ chọn)</span>
                </Label>
                <Textarea
                  id="reviewNote"
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="Nhập ghi chú cho người dùng (sẽ hiển thị khi từ chối)..."
                  className="min-h-24 resize-none"
                  maxLength={2000}
                  disabled={reviewMutation.isPending}
                />
                <p className="text-right text-xs text-muted-foreground">
                  {reviewNote.length}/2000
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        {request.status === "pending" && (
          <div className="flex items-center justify-end gap-2 border-t border-border/50 px-6 py-4">
            <Button
              variant="outline"
              className="gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={reviewMutation.isPending}
              onClick={() => handleReview(false)}
            >
              {reviewMutation.isPending ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              Từ chối
            </Button>
            <Button
              className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
              disabled={reviewMutation.isPending}
              onClick={() => handleReview(true)}
            >
              {reviewMutation.isPending ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Chấp nhận
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
