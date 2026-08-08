"use client";

import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QuizEditor } from "../QuizEditor";
import {
  invalidateLessonQuizCache,
  useCreateQuiz,
  useQuizById,
  useUpdateQuiz,
} from "../../api/course-management.hooks";
import type { QuizEditorState } from "../../types";
import {
  buildQuizEditorState,
  buildQuizEditorKey,
} from "../../utils/quiz-editor-page.utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lessonTitle: string;
  lessonActivityId: number | null;
  quizId?: number | null;
}

export function OutsideQuizEditorDialog({
  open,
  onOpenChange,
  lessonTitle,
  lessonActivityId,
  quizId,
}: Props) {
  const queryClient = useQueryClient();
  const { data: quiz, isLoading } = useQuizById(
    quizId ?? null,
    open && quizId !== null && quizId !== undefined,
  );

  const existingQuiz = quiz ?? null;

  const createQuizMutation = useCreateQuiz();
  const updateQuizMutation = useUpdateQuiz();

  const editorState = useMemo(
    () => buildQuizEditorState(existingQuiz, lessonActivityId, "", false),
    [existingQuiz, lessonActivityId],
  );

  const handleSave = async (state: QuizEditorState) => {
    if (!lessonActivityId) {
      return;
    }

    const payload: QuizEditorState = {
      ...state,
      lessonActivityId,
      isInVideo: false,
    };

    if (existingQuiz) {
      await updateQuizMutation.mutateAsync({
        id: existingQuiz.id,
        data: payload,
      });
    } else {
      await createQuizMutation.mutateAsync(payload);
    }

    await invalidateLessonQuizCache(queryClient);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[92vh] w-[92vw] sm:max-w-2xl overflow-y-auto p-0 rounded-2xl border border-border/70 shadow-2xl transition-all duration-300"
      >
        <DialogHeader className="border-b border-border/60 px-5 py-4 pr-12 relative">
          <DialogTitle>Quiz sau bài học</DialogTitle>
          <DialogDescription>
            Chỉnh sửa quiz cho bài học: {lessonTitle}
          </DialogDescription>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 h-8 w-8 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground z-20"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </DialogHeader>

        <div className="p-4 sm:p-5">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang tải quiz...
            </div>
          ) : (
            <QuizEditor
              key={buildQuizEditorKey(
                lessonActivityId,
                quizId ?? existingQuiz?.id ?? null,
              )}
              quiz={editorState}
              onSave={handleSave}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
