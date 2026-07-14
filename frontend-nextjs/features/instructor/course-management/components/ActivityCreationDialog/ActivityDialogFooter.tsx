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
  isQuizAIDisabled?: boolean;
  quizAIDisabledReason?: string;
}

export function ActivityDialogFooter({
  activityTab,
  onCancel,
  onCreateAssignment,
  onCreateQuiz,
  isAssignmentPending,
  isQuizPending,
  isQuizAIPending,
  isQuizAIDisabled = false,
  quizAIDisabledReason,
}: Props) {
  return (
    <DialogFooter className="sticky bottom-0 z-10 border-t border-border/70 bg-background/95 px-4 py-4 backdrop-blur supports-backdrop-filter:bg-background/80 sm:px-6">
      <Button
        variant="outline"
        onClick={onCancel}
        aria-label="Hủy và đóng hộp thoại"
        className="h-10 w-full rounded-xl font-semibold sm:w-auto"
      >
        Hủy
      </Button>

      {activityTab === "assignment" ? (
        <Button
          onClick={onCreateAssignment}
          disabled={isAssignmentPending}
          className="h-10 w-full rounded-xl font-semibold shadow-md sm:w-auto"
        >
          {isAssignmentPending ? "Đang tạo..." : "Tạo bài tập"}
        </Button>
      ) : activityTab === "quiz-ai" ? (
        <Button
          type="submit"
          form="quiz-ai-form"
          disabled={isQuizAIPending || isQuizAIDisabled}
          title={isQuizAIDisabled ? quizAIDisabledReason : undefined}
          className="h-10 w-full gap-1.5 rounded-xl bg-primary font-semibold shadow-md hover:bg-primary/90 sm:w-auto"
        >
          {isQuizAIPending
            ? "Đang sinh..."
            : isQuizAIDisabled
              ? "Video chưa sẵn sàng"
              : "Sinh quiz AI"}
        </Button>
      ) : (
        <Button
          onClick={onCreateQuiz}
          disabled={isQuizPending}
          className="h-10 w-full rounded-xl font-semibold shadow-md sm:w-auto"
        >
          {isQuizPending ? "Đang tạo..." : "Tạo quiz"}
        </Button>
      )}
    </DialogFooter>
  );
}
