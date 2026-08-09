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

/** FR-003: overwriting the current video is irreversible — requires explicit confirmation. */
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
          <AlertDialogTitle>Áp dụng thay đổi?</AlertDialogTitle>
          <AlertDialogDescription>
            {markedCount} đoạn sẽ bị bỏ khỏi highlight. Video hiện tại sẽ bị
            thay thế bằng video mới — thao tác này không thể hoàn tác.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Hủy</AlertDialogCancel>
          <AlertDialogAction disabled={isSubmitting} onClick={onConfirm}>
            {isSubmitting ? "Đang áp dụng..." : "Áp dụng"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
