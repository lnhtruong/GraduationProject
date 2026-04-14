"use client";

import { Check, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { QuizEditorState } from "../types";
import { useQuizEditor } from "../hooks/useQuizEditor";
import { QuestionEditor } from "./QuizEditor/QuestionEditor";
import { QuestionList } from "./QuizEditor/QuestionList";
import { QuizMetadataForm } from "./QuizEditor/QuizMetadataForm";

interface Props {
  quiz?: QuizEditorState | null;
  onSave?: (state: QuizEditorState) => Promise<void> | void;
}

export function QuizEditor({ quiz, onSave }: Props) {
  const {
    state,
    selectedQuestionId,
    selectedQuestion,
    updateQuestion,
    addQuestion,
    removeQuestion,
    addOption,
    removeOption,
    setSelectedQuestionId,
    updateTitle,
    updateDescription,
    updatePassingScore,
    updateTimeLimitMinutes,
    updateIsInVideo,
  } = useQuizEditor(quiz);

  const handleSave = async () => {
    await onSave?.(state);
    toast.success("Đã lưu quiz");
  };

  return (
    <div className="space-y-4">
      <Card className="border-border/60 bg-muted/15">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <QuestionList
              questions={state.questions}
              selectedQuestionId={selectedQuestionId}
              onSelectQuestion={setSelectedQuestionId}
              onAddQuestion={addQuestion}
              onRemoveQuestion={removeQuestion}
            />
            <Button type="button" size="sm" onClick={() => void handleSave()}>
              <Save className="mr-2 h-4 w-4" />
              Lưu quiz
            </Button>
          </div>

          <QuizMetadataForm
            title={state.title}
            onTitleChange={updateTitle}
            passingScore={state.passingScore}
            onPassingScoreChange={updatePassingScore}
            timeLimitMinutes={state.timeLimitMinutes}
            onTimeLimitChange={updateTimeLimitMinutes}
            description={state.description}
            onDescriptionChange={updateDescription}
            isInVideo={state.isInVideo}
            onIsInVideoChange={updateIsInVideo}
            totalQuestions={state.questions.length}
          />
        </CardContent>
      </Card>

      <QuestionEditor
        question={selectedQuestion}
        isInVideo={state.isInVideo}
        onUpdateQuestion={updateQuestion}
        onAddOption={addOption}
        onRemoveOption={removeOption}
      />

      <div className="rounded-xl border border-dashed border-border/70 bg-background p-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Check className="h-3.5 w-3.5 text-primary" />
          Luồng chuẩn: Khóa học → Bài học → Chỉnh quiz.
        </span>
      </div>
    </div>
  );
}
