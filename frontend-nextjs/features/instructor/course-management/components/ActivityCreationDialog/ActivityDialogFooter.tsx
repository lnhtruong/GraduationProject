"use client";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";

interface Props {
  activityTab: "quiz" | "quiz-ai" | "assignment";
  onCancel: () => void;
  onCreateAssignment: () => void;
  onCreateQuiz: () => void;
  isAssignmentPending: boolean;
  isQuizPending: boolean;
  isQuizAIPending: boolean;
}

export function ActivityDialogFooter({
  activityTab,
  onCancel,
  onCreateAssignment,
  onCreateQuiz,
  isAssignmentPending,
  isQuizPending,
  isQuizAIPending,
}: Props) {
  return (
    <DialogFooter className="sticky bottom-0 z-10 border-t border-border/70 bg-background/95 px-4 py-4 backdrop-blur supports-backdrop-filter:bg-background/80 sm:px-6">
      <Button
        variant="outline"
        onClick={onCancel}
        aria-label="Hủy và đóng hộp thoại"
        className="w-full sm:w-auto h-10 rounded-xl font-semibold"
      >
        Hủy
      </Button>
      {activityTab === "assignment" ? (
        <Button
          onClick={onCreateAssignment}
          disabled={isAssignmentPending}
          className="w-full sm:w-auto h-10 rounded-xl font-semibold shadow-md"
        >
          {isAssignmentPending ? "Đang tạo..." : "Tạo bài tập"}
        </Button>
      ) : activityTab === "quiz-ai" ? (
        <Button
          type="submit"
          form="quiz-ai-form"
          disabled={isQuizAIPending}
          className="w-full sm:w-auto h-10 rounded-xl font-semibold shadow-md bg-primary hover:bg-primary/90 gap-1.5"
        >
          {isQuizAIPending ? "Đang sinh..." : "Sinh quiz AI ✨"}
        </Button>
      ) : (
        <Button
          onClick={onCreateQuiz}
          disabled={isQuizPending}
          className="w-full sm:w-auto h-10 rounded-xl font-semibold shadow-md"
        >
          {isQuizPending ? "Đang tạo..." : "Tạo quiz"}
        </Button>
      )}
    </DialogFooter>
  );
}
