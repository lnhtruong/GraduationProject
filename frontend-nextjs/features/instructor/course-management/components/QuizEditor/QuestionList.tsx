"use client";

import { GripVertical, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { QuizEditorQuestion } from "../../types";

interface Props {
  questions: QuizEditorQuestion[];
  selectedQuestionId: number | null;
  onSelectQuestion: (questionId: number) => void;
  onAddQuestion: () => void;
  onRemoveQuestion: (questionId: number) => void;
  saveAction?: React.ReactNode;
}

export function QuestionList({
  questions,
  selectedQuestionId,
  onSelectQuestion,
  onAddQuestion,
  onRemoveQuestion,
  saveAction,
}: Props) {
  return (
    <div className="w-full min-w-0 space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Questions
          </p>
          <h3 className="text-lg font-semibold">{questions.length} câu hỏi</h3>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onAddQuestion}
            className="w-full sm:w-auto"
          >
            + Thêm câu hỏi
          </Button>
          {saveAction}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pb-1 sm:pb-2">
        {questions.map((question, index) => {
          const isSelected = selectedQuestionId === question.id;

          return (
            <div
              key={question.id}
              role="button"
              tabIndex={0}
              className={`rounded-xl border text-left transition ${
                isSelected
                  ? "w-full border-primary bg-primary/5 px-3 py-2 sm:w-56"
                  : "w-20 border-border/60 bg-background px-2 py-2 hover:border-primary/40"
              }`}
              onClick={() => onSelectQuestion(question.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelectQuestion(question.id);
                }
              }}
            >
              <div
                className={`flex justify-between ${
                  isSelected ? "items-start gap-2" : "items-center gap-1"
                }`}
              >
                <div
                  className={`flex min-w-0 ${
                    isSelected
                      ? "flex-1 items-center gap-2"
                      : "items-center gap-1"
                  }`}
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Q{index + 1}
                  </span>
                  {isSelected ? (
                    <p className="line-clamp-1 text-sm font-medium">
                      {question.prompt || "Câu hỏi chưa có nội dung"}
                    </p>
                  ) : null}
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className={`shrink-0 text-destructive ${
                    isSelected ? "h-7 w-7" : "h-6 w-6"
                  }`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onRemoveQuestion(question.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {isSelected ? (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="text-[11px]">
                    {question.options.length} lựa chọn
                  </Badge>
                  {question.options.some((o) => o.isCorrect) ? (
                    <Badge variant="secondary" className="text-[11px]">
                      Có đáp án đúng
                    </Badge>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
