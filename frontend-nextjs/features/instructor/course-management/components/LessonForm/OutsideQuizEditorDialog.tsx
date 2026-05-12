"use client";

import { useMemo } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QuizEditor } from "../QuizEditor";
import {
  useCreateQuiz,
  useQuizzesByLessonActivityId,
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
}

export function OutsideQuizEditorDialog({
  open,
  onOpenChange,
  lessonTitle,
  lessonActivityId,
}: Props) {
  const { data: quizzes, isLoading } = useQuizzesByLessonActivityId(
    lessonActivityId,
    open && lessonActivityId !== null,
  );

  const existingQuiz = quizzes?.[0] ?? null;

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

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[96vw] max-w-5xl overflow-y-auto p-0">
        <DialogHeader className="border-b border-border/60 px-5 py-4">
          <DialogTitle>Quiz sau bài học</DialogTitle>
          <DialogDescription>
            Chỉnh sửa quiz cho bài học: {lessonTitle}
          </DialogDescription>
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
                existingQuiz?.id ?? null,
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
