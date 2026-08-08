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

interface TranscribePromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isStarting?: boolean;
}

export default function TranscribePrompt({
  open,
  onOpenChange,
  onConfirm,
  isStarting = false,
}: TranscribePromptProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Video này chưa có phụ đề</AlertDialogTitle>
          <AlertDialogDescription>
            Để chọn đoạn ưu tiên/loại bỏ, video cần được chuyển thành phụ đề
            (transcribe) trước. Quá trình này chạy nền và có thể mất vài phút
            tới hàng chục phút tùy độ dài video — bạn có thể tiếp tục điền
            form hoặc rời trang trong lúc chờ.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isStarting}>Không</AlertDialogCancel>
          <AlertDialogAction disabled={isStarting} onClick={onConfirm}>
            {isStarting ? "Đang bắt đầu..." : "Có, transcribe ngay"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
