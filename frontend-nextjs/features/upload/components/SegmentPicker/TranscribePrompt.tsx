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
      <AlertDialogContent className="max-w-[min(calc(100vw-2rem),32rem)] rounded-2xl p-6">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl">Tạo phụ đề cho video?</AlertDialogTitle>
          <AlertDialogDescription className="text-[15px] leading-6">
            StudyLoop cần phụ đề để xác định chính xác các đoạn bạn muốn giữ hoặc tránh. Quá trình chạy nền, có thể mất vài phút và chỉ cần thực hiện một lần cho video này. Không tốn credit; bạn vẫn có thể tiếp tục thiết lập trong lúc chờ.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel className="h-11" disabled={isStarting}>Để sau</AlertDialogCancel>
          <AlertDialogAction className="h-11" disabled={isStarting} onClick={onConfirm}>
            {isStarting ? "Đang tạo phụ đề..." : "Tạo phụ đề"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
