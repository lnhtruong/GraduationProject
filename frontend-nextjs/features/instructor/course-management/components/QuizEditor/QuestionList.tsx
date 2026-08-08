"use client";

import { Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { QuizEditorQuestion } from "../../types";

interface Props {
  questions: QuizEditorQuestion[];
  selectedQuestionId: number | null;
  onSelectQuestion: (questionId: number) => void;
  onAddQuestion: () => void;
  onRemoveQuestion: (questionId: number) => void;
  saveAction?: React.ReactNode;
  title?: string;
  countLabel?: string;
  showAddButton?: boolean;
  showRemoveButtons?: boolean;
  getQuestionLabel?: (question: QuizEditorQuestion, index: number) => string;
}

export function QuestionList({
  questions,
  selectedQuestionId,
  onSelectQuestion,
  onAddQuestion,
  onRemoveQuestion,
  saveAction,
  title = "Danh sách câu hỏi",
  countLabel,
  showAddButton = true,
  showRemoveButtons = true,
  getQuestionLabel,
}: Props) {
  return (
    <div className="w-full min-w-0 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <h3 className="text-lg font-bold mt-0.5">{countLabel ?? `${questions.length} câu hỏi`}</h3>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
          {showAddButton ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onAddQuestion}
              className="w-full sm:w-auto h-9 rounded-xl font-bold gap-1.5 shadow-xs"
            >
              <Plus className="h-4 w-4 text-primary" />
              Thêm câu hỏi
            </Button>
          ) : null}
          {saveAction}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 pb-2 max-h-[200px] overflow-y-auto pr-1">
        {questions.map((question, index) => {
          const isSelected = selectedQuestionId === question.id;

          return (
            <div
              key={question.id}
              role="button"
              tabIndex={0}
              className={`w-36 sm:w-44 h-20 rounded-xl border p-3 flex flex-col justify-between cursor-pointer select-none transition-all duration-200 ${
                isSelected
                  ? "border-primary bg-primary/[0.04] shadow-xs"
                  : "border-border/60 bg-background hover:border-primary/40 hover:bg-muted/10"
              }`}
              onClick={() => onSelectQuestion(question.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelectQuestion(question.id);
                }
              }}
            >
              <div className="flex items-center justify-between w-full">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  isSelected ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                }`}>
                  {getQuestionLabel?.(question, index) ?? `Câu ${index + 1}`}
                </span>
                
                {showRemoveButtons ? (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-5 w-5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    onClick={(event) => {
                      event.stopPropagation();
                      onRemoveQuestion(question.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                ) : null}
              </div>

              <div className="flex items-end justify-between gap-1.5 w-full">
                <p className="text-[11px] text-muted-foreground font-medium line-clamp-1 flex-1">
                  {question.prompt || "Chưa nhập nội dung..."}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
