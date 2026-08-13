"use client";

import { useEffect, useRef } from "react";
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
  videoUrl?: string | null;
  videoDurationSeconds?: number;
  initialSelectedQuestionId?: number | null;
  visibleQuestionIds?: number[];
}

export function QuizEditor({
  quiz,
  onSave,
  showSaveButton = true,
  onStateChange,
  videoUrl,
  videoDurationSeconds,
  initialSelectedQuestionId,
  visibleQuestionIds,
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
  } = useQuizEditor(quiz, initialSelectedQuestionId);
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    onStateChange?.(state);
  }, [onStateChange, state]);


  const openedFromTimelineMarker = Boolean(visibleQuestionIds?.length) || (initialSelectedQuestionId !== null && initialSelectedQuestionId !== undefined);
  const visibleQuestionIdSet = visibleQuestionIds?.length ? new Set(visibleQuestionIds) : null;
  const visibleQuestions = visibleQuestionIdSet
    ? state.questions.filter((question) => visibleQuestionIdSet.has(question.id))
    : openedFromTimelineMarker && selectedQuestion
      ? [selectedQuestion]
      : state.questions;
  const handleSave = async () => {
    await onSave?.(state);
    toast.success("Đã lưu quiz");
  };

  const handleSelectQuestion = (questionId: number) => {
    setSelectedQuestionId(questionId);
    window.requestAnimationFrame(() => {
      editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <div className="space-y-4">
      <Card className="border-border/60 bg-muted/15">
        <CardContent className="min-w-0 space-y-4 p-4 sm:p-5">
          <QuestionList
            questions={visibleQuestions}
            selectedQuestionId={selectedQuestionId}
            onSelectQuestion={handleSelectQuestion}
            onAddQuestion={addQuestion}
            onRemoveQuestion={removeQuestion}
            title={openedFromTimelineMarker ? "Câu hỏi tại mốc này" : undefined}
            countLabel={openedFromTimelineMarker ? `${visibleQuestions.length} câu đang sửa` : undefined}
            showAddButton={!openedFromTimelineMarker}
            showRemoveButtons={!openedFromTimelineMarker}
            getQuestionLabel={
              openedFromTimelineMarker
                ? (question) =>
                    `Câu ${state.questions.findIndex((q) => q.id === question.id) + 1}`
                : undefined
            }
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
          />
        </CardContent>
      </Card>

      <div ref={editorRef} />
      <QuestionEditor
        question={selectedQuestion}
        onUpdateQuestion={updateQuestion}
        onAddOption={addOption}
        onRemoveOption={removeOption}
        videoUrl={videoUrl}
        videoDurationSeconds={videoDurationSeconds}
        isInVideo={state.isInVideo}
      />
    </div>
  );
}
