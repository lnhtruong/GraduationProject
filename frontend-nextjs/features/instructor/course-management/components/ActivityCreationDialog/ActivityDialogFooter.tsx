"use client";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";

interface Props {
  activityTab: "quiz" | "assignment";
  onCancel: () => void;
  onCreateAssignment: () => void;
  onCreateQuiz: () => void;
  isAssignmentPending: boolean;
  isQuizPending: boolean;
}

export function ActivityDialogFooter({
  activityTab,
  onCancel,
  onCreateAssignment,
  onCreateQuiz,
  isAssignmentPending,
  isQuizPending,
}: Props) {
  const isPending =
    (activityTab === "assignment" ? isAssignmentPending : isQuizPending) ||
    isAssignmentPending ||
    isQuizPending;

  return (
    <DialogFooter className="sticky bottom-0 z-10 border-t border-border/70 bg-background/95 px-4 py-4 backdrop-blur supports-backdrop-filter:bg-background/80 sm:px-6">
      <Button variant="outline" onClick={onCancel} className="w-full sm:w-auto">
        Hủy
      </Button>
      {activityTab === "assignment" ? (
        <Button
          onClick={onCreateAssignment}
          disabled={isAssignmentPending}
          className="w-full sm:w-auto"
        >
          {isAssignmentPending ? "Đang tạo..." : "Tạo bài tập"}
        </Button>
      ) : (
        <Button
          onClick={onCreateQuiz}
          disabled={isPending}
          className="w-full sm:w-auto"
        >
          {isQuizPending || isAssignmentPending ? "Đang tạo..." : "Tạo quiz"}
        </Button>
      )}
    </DialogFooter>
  );
}
