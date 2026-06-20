"use client";

import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { QuizEditorQuestion, QuizEditorOption } from "../../types";

interface Props {
  question: QuizEditorQuestion | null;
  onUpdateQuestion: (
    questionId: number,
    updater: (question: QuizEditorQuestion) => QuizEditorQuestion,
  ) => void;
  onAddOption: (questionId: number) => void;
  onRemoveOption: (questionId: number, optionId: string) => void;
}

export function QuestionEditor({
  question,
  onUpdateQuestion,
  onAddOption,
  onRemoveOption,
}: Props) {
  if (!question) {
    return (
      <Card className="border-border/60">
        <CardContent className="p-6 text-sm text-muted-foreground text-center py-12">
          Chọn một câu hỏi ở danh sách phía trên để bắt đầu chỉnh sửa.
        </CardContent>
      </Card>
    );
  }

  const updateOption = (
    optionId: string,
    updater: (option: QuizEditorOption) => QuizEditorOption,
  ) => {
    onUpdateQuestion(question.id, (current) => ({
      ...current,
      options: current.options.map((option) =>
        option.id === optionId ? updater(option) : option,
      ),
    }));
  };

  return (
    <Card className="border-border/60 shadow-sm border-t-2 border-t-primary/30">
      <CardContent className="space-y-5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-3">
          <h4 className="font-bold text-sm uppercase tracking-wider text-foreground">Chỉnh sửa câu hỏi chi tiết</h4>
        </div>

        <div className="grid gap-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Nội dung câu hỏi</Label>
          <Textarea
            value={question.prompt}
            onChange={(event) =>
              onUpdateQuestion(question.id, (current) => ({
                ...current,
                prompt: event.target.value,
              }))
            }
            placeholder="Nhập nội dung câu hỏi..."
            className="min-h-20 rounded-lg border-border focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:border-primary/50 resize-y"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-border/40 pb-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Các lựa chọn câu trả lời</p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onAddOption(question.id)}
              className="h-7 px-2.5 text-xs font-medium bg-background hover:bg-muted/40 border-border/80 rounded-lg"
            >
              <Plus className="mr-1 h-3.5 w-3.5 text-primary" />
              Thêm lựa chọn
            </Button>
          </div>

          <div className="grid gap-2.5">
            {question.options.map((option) => (
              <div
                key={option.id}
                className={`flex items-center gap-3 rounded-xl border p-2.5 transition-all duration-200 bg-background/60 focus-within:bg-background ${
                  option.isCorrect
                    ? "border-green-500/30 bg-green-500/[0.02] focus-within:border-green-500/50"
                    : "border-border/60 focus-within:border-primary/50"
                }`}
              >
                <Input
                  value={option.label}
                  onChange={(event) =>
                    updateOption(option.id, (current) => ({
                      ...current,
                      label: event.target.value,
                    }))
                  }
                  placeholder="Nhập nội dung câu trả lời..."
                  className="h-9 border-none bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-1 placeholder:text-muted-foreground/50 flex-1 min-w-0"
                />
                
                {/* Styled Radio button */}
                <button
                  type="button"
                  onClick={() =>
                    onUpdateQuestion(question.id, (current) => ({
                      ...current,
                      options: current.options.map((item) => ({
                        ...item,
                        isCorrect: item.id === option.id,
                      })),
                    }))
                  }
                  className={`flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold border transition-all duration-200 ${
                    option.isCorrect
                      ? "bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400 shadow-sm"
                      : "bg-background border-border hover:bg-muted/40 text-muted-foreground"
                  }`}
                >
                  <span className={`flex h-3.5 w-3.5 items-center justify-center rounded-full border transition-all ${
                    option.isCorrect
                      ? "border-green-500 bg-green-500 text-white"
                      : "border-muted-foreground/40"
                  }`}>
                    {option.isCorrect && <span className="h-1 w-1 rounded-full bg-white" />}
                  </span>
                  Đúng
                </button>

                {/* Delete option */}
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors rounded-lg"
                  onClick={() => onRemoveOption(question.id, option.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-2 pt-2 border-t border-border/40">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Giải thích đáp án (Tùy chọn)</Label>
          <Textarea
            value={question.explanation}
            onChange={(event) =>
              onUpdateQuestion(question.id, (current) => ({
                ...current,
                explanation: event.target.value,
              }))
            }
            placeholder="Giải giải thích tại sao đáp án trên lại đúng..."
            className="min-h-16 rounded-lg border-border focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:border-primary/50 resize-y"
          />
        </div>
      </CardContent>
    </Card>
  );
}
