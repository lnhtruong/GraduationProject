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
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Cập nhật highlight?</AlertDialogTitle>
          <AlertDialogDescription>
            StudyLoop sẽ tạo lại highlight và bỏ {markedCount} đoạn đã chọn.
            Video gốc vẫn được giữ nguyên.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="cursor-pointer" disabled={isSubmitting}>
            Để sau
          </AlertDialogCancel>
          <AlertDialogAction
            className="cursor-pointer"
            disabled={isSubmitting}
            onClick={onConfirm}
          >
            {isSubmitting ? "Đang bắt đầu..." : "Cập nhật"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}