"use client";

import { useEffect } from "react";
import { Save } from "lucide-react";
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
  showSaveButton?: boolean;
  onStateChange?: (state: QuizEditorState) => void;
}

export function QuizEditor({
  quiz,
  onSave,
  showSaveButton = true,
  onStateChange,
}: Props) {
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
    updateIsInVideo,
  } = useQuizEditor(quiz);

  useEffect(() => {
    onStateChange?.(state);
  }, [onStateChange, state]);

  const handleSave = async () => {
    await onSave?.(state);
    toast.success("Đã lưu quiz");
  };

  return (
    <div className="space-y-4">
      <Card className="border-border/60 bg-muted/15">
        <CardContent className="min-w-0 space-y-4 p-4 sm:p-5">
          <QuestionList
            questions={state.questions}
            selectedQuestionId={selectedQuestionId}
            onSelectQuestion={setSelectedQuestionId}
            onAddQuestion={addQuestion}
            onRemoveQuestion={removeQuestion}
            saveAction={
              showSaveButton ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => void handleSave()}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Lưu quiz
                </Button>
              ) : null
            }
          />

          <QuizMetadataForm
            title={state.title}
            onTitleChange={updateTitle}
            passingScore={state.passingScore}
            onPassingScoreChange={updatePassingScore}
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
        onUpdateQuestion={updateQuestion}
        onAddOption={addOption}
        onRemoveOption={removeOption}
      />
    </div>
  );
}
