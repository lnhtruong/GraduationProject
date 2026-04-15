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
}

export function QuestionList({
  questions,
  selectedQuestionId,
  onSelectQuestion,
  onAddQuestion,
  onRemoveQuestion,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Questions
          </p>
          <h3 className="text-lg font-semibold">{questions.length} câu hỏi</h3>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onAddQuestion}
        >
          + Thêm câu hỏi
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-2">
        {questions.map((question, index) => (
          <div
            key={question.id}
            role="button"
            tabIndex={0}
            className={`w-58 shrink-0 rounded-xl border px-3 py-2 text-left transition sm:w-62 ${
              selectedQuestionId === question.id
                ? "border-primary bg-primary/5"
                : "border-border/60 bg-background hover:border-primary/40"
            }`}
            onClick={() => onSelectQuestion(question.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelectQuestion(question.id);
              }
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">
                  Q{index + 1}
                </span>
                <p className="line-clamp-1 text-sm font-medium">
                  {question.prompt || "Câu hỏi chưa có nội dung"}
                </p>
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-destructive"
                onClick={(event) => {
                  event.stopPropagation();
                  onRemoveQuestion(question.id);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="outline" className="text-[11px]">
                {question.options.length} lựa chọn
              </Badge>
              {question.options.some((o) => o.isCorrect) ? (
                <Badge variant="secondary" className="text-[11px]">
                  Có đáp án đúng
                </Badge>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
