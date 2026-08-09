"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface HighlightEditConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
  markedCount: number;
}

export default function HighlightEditConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  isSubmitting = false,
  markedCount,
}: HighlightEditConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cập nhật highlight?</AlertDialogTitle>
          <AlertDialogDescription>
            StudyLoop sẽ tạo lại highlight không gồm {markedCount} đoạn đã chọn.
            Video gốc vẫn được giữ nguyên; bản highlight hiện tại sẽ cập nhật sau
            khi xử lý xong.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Để sau</AlertDialogCancel>
          <AlertDialogAction disabled={isSubmitting} onClick={onConfirm}>
            {isSubmitting ? "Đang bắt đầu..." : "Cập nhật highlight"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}