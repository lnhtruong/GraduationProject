"use client";

import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { QuizEditorQuestion, QuizEditorOption } from "../../types";

interface Props {
  question: QuizEditorQuestion | null;
  isInVideo: boolean;
  onUpdateQuestion: (
    questionId: number,
    updater: (question: QuizEditorQuestion) => QuizEditorQuestion,
  ) => void;
  onAddOption: (questionId: number) => void;
  onRemoveOption: (questionId: number, optionId: string) => void;
}

export function QuestionEditor({
  question,
  isInVideo,
  onUpdateQuestion,
  onAddOption,
  onRemoveOption,
}: Props) {
  if (!question) {
    return (
      <Card className="border-border/60">
        <CardContent className="p-6 text-sm text-muted-foreground">
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
    <Card className="border-border/60">
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="font-semibold">Chỉnh câu hỏi</h4>
          <Badge variant="outline">ID {question.id}</Badge>
        </div>

        <div className="grid gap-2">
          <Label className="text-sm font-medium">Nội dung câu hỏi</Label>
          <Textarea
            value={question.prompt}
            onChange={(event) =>
              onUpdateQuestion(question.id, (current) => ({
                ...current,
                prompt: event.target.value,
              }))
            }
            placeholder="Nhập nội dung câu hỏi"
            className="min-h-24"
          />
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">Các lựa chọn</p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onAddOption(question.id)}
            >
              <Plus className="mr-1 h-4 w-4" />
              Thêm lựa chọn
            </Button>
          </div>

          {question.options.map((option) => (
            <div
              key={option.id}
              className="grid gap-2 rounded-xl border border-border/60 bg-muted/20 p-3 md:grid-cols-[1fr_auto_auto] md:items-center"
            >
              <Input
                value={option.label}
                onChange={(event) =>
                  updateOption(option.id, (current) => ({
                    ...current,
                    label: event.target.value,
                  }))
                }
                placeholder="Nội dung lựa chọn"
              />
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="radio"
                  name={`correct-${question.id}`}
                  checked={option.isCorrect}
                  onChange={() =>
                    onUpdateQuestion(question.id, (current) => ({
                      ...current,
                      options: current.options.map((item) => ({
                        ...item,
                        isCorrect: item.id === option.id,
                      })),
                    }))
                  }
                />
                Đúng
              </label>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-destructive"
                onClick={() => onRemoveOption(question.id, option.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="grid gap-2">
          <Label className="text-sm font-medium">Giải thích đáp án</Label>
          <Textarea
            value={question.explanation}
            onChange={(event) =>
              onUpdateQuestion(question.id, (current) => ({
                ...current,
                explanation: event.target.value,
              }))
            }
            placeholder="Giải thích đáp án"
            className="min-h-20"
          />
        </div>

        {isInVideo && (
          <div className="grid gap-2">
            <Label className="text-sm font-medium">
              Mốc thời gian video (HH:MM:SS.mmm)
            </Label>
            <Input
              value={question.videoTimestamp ?? ""}
              onChange={(event) =>
                onUpdateQuestion(question.id, (current) => ({
                  ...current,
                  videoTimestamp: event.target.value,
                }))
              }
              placeholder="00:00:10.000"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
