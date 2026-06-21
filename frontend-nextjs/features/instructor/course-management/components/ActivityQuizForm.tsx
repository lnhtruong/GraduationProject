"use client";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { CirclePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { QuizEditorState } from "../types";
import { useQuizEditor } from "../hooks/useQuizEditor";

interface Props {
  initialInVideo: boolean;
  defaultTimestamp?: string;
  onSubmit: (state: QuizEditorState) => Promise<void> | void;
}

export interface ActivityQuizFormHandle {
  submit: () => Promise<boolean>;
}

export const ActivityQuizForm = forwardRef<ActivityQuizFormHandle, Props>(
  function ActivityQuizForm(
    { initialInVideo, defaultTimestamp = "", onSubmit }: Props,
    ref,
  ) {
    const {
      state,
      setState,
      addQuestion,
      removeQuestion,
      updateQuestion,
      addOption,
      removeOption,
      updateTitle,
      updateDescription,
      updatePassingScore,
    } = useQuizEditor(null);

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
      setState((prev) => ({
        ...prev,
        isInVideo: initialInVideo,
        questions: prev.questions.map((question) => ({
          ...question,
          videoTimestamp: initialInVideo
            ? question.videoTimestamp || defaultTimestamp
            : "",
        })),
      }));
    }, [defaultTimestamp, initialInVideo, setState]);

    const updateOption = (
      questionId: number,
      optionId: string,
      updater: (option: any) => any,
    ) => {
      updateQuestion(questionId, (question) => ({
        ...question,
        options: question.options.map((option) =>
          option.id === optionId ? updater(option) : option,
        ),
      }));
    };

    const validateQuiz = () => {
      if (!state.title.trim()) {
        toast.error("Tiêu đề quiz không được để trống");
        return false;
      }

      for (const question of state.questions) {
        if (!question.prompt.trim()) {
          toast.error("Mỗi câu hỏi cần có nội dung");
          return false;
        }

        if (!question.options.every((option) => option.label.trim())) {
          toast.error("Mỗi lựa chọn cần có nội dung");
          return false;
        }

        if (!question.options.some((option) => option.isCorrect)) {
          toast.error("Mỗi câu hỏi phải có 1 đáp án đúng");
          return false;
        }
      }

      return true;
    };

    const submit = async () => {
      if (!validateQuiz()) {
        return false;
      }

      setIsSubmitting(true);
      try {
        await onSubmit(state);
        return true;
      } finally {
        setIsSubmitting(false);
      }
    };

    useImperativeHandle(ref, () => ({
      submit,
    }));

    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm space-y-5">
          <h3 className="text-sm font-bold text-foreground pb-3 border-b border-border/40">
            Thông tin chung về Quiz
          </h3>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="grid gap-1.5 md:col-span-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  Tiêu đề Quiz <span className="text-destructive">*</span>
                </Label>
                <Input
                  className="h-10 border-border focus-visible:ring-1 focus-visible:ring-primary/30 rounded-xl"
                  placeholder="Nhập tiêu đề cho bài kiểm tra này..."
                  value={state.title}
                  onChange={(event) => updateTitle(event.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  Điểm đạt (%) <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  className="h-10 border-border focus-visible:ring-1 focus-visible:ring-primary/30 rounded-xl"
                  placeholder="80"
                  value={state.passingScore}
                  onChange={(event) =>
                    updatePassingScore(Number(event.target.value || 0))
                  }
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">Mô tả chi tiết</Label>
              <Textarea
                className="min-h-24 resize-y border-border focus-visible:ring-1 focus-visible:ring-primary/30 rounded-xl"
                placeholder="Nhập hướng dẫn làm bài hoặc thông tin tổng quan..."
                value={state.description}
                onChange={(event) => updateDescription(event.target.value)}
              />
            </div>

            {state.isInVideo && defaultTimestamp ? (
              <div className="flex items-center gap-1.5 text-xs text-primary font-medium mt-1.5 pl-1 select-none">
                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                <span>Quiz này được cấu hình xuất hiện ở mốc {defaultTimestamp} trong video.</span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-2.5 pt-2">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Bộ câu hỏi cho Quiz
            </h3>
            <p className="text-xs text-muted-foreground">
              Đã thêm {state.questions.length} câu hỏi.
            </p>
          </div>
          <Button
            type="button"
            variant="default"
            size="sm"
            className="h-9 px-4 text-xs font-semibold shadow-sm"
            onClick={addQuestion}
          >
            <CirclePlus className="mr-1.5 h-4 w-4" />
            Thêm câu hỏi mới
          </Button>
        </div>

        <div className="space-y-4">
          {state.questions.map((question, index) => (
            <div key={question.id} className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm space-y-5 transition-all duration-200">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary shadow-inner">
                    {index + 1}
                  </span>
                  <p className="text-sm font-bold text-foreground/90">Câu hỏi {index + 1}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2.5 text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  onClick={() => removeQuestion(question.id)}
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" />
                  Xóa câu hỏi
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid gap-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    Nội dung câu hỏi <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    className="min-h-20 resize-y border-border focus-visible:ring-1 focus-visible:ring-primary/30 rounded-xl"
                    placeholder="Nhập câu hỏi ví dụ: Khái niệm X nghĩa là gì?"
                    value={question.prompt}
                    onChange={(event) =>
                      updateQuestion(question.id, (current) => ({
                        ...current,
                        prompt: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-border/40 pb-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      Lựa chọn câu trả lời <span className="text-destructive">*</span>
                    </Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 px-2.5 text-xs font-medium bg-background hover:bg-muted/40 border-border/80 rounded-lg"
                      onClick={() => addOption(question.id)}
                    >
                      <CirclePlus className="mr-1.5 h-3.5 w-3.5 text-primary" />
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
                            updateOption(question.id, option.id, (current) => ({
                              ...current,
                              label: event.target.value,
                            }))
                          }
                          className="h-9 border-none bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-1 placeholder:text-muted-foreground/50 rounded-none"
                          placeholder="Nhập nội dung câu trả lời..."
                        />

                        {/* Styled Radio button */}
                        <button
                          type="button"
                          onClick={() =>
                            updateQuestion(question.id, (current) => ({
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
                          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          onClick={() => removeOption(question.id, option.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-1.5 pt-2 border-t border-border/40">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    Giải thích đáp án (Tùy chọn)
                  </Label>
                  <Textarea
                    className="min-h-16 resize-y border-border focus-visible:ring-1 focus-visible:ring-primary/30 rounded-xl"
                    placeholder="Giải thích tại sao đáp án trên lại đúng..."
                    value={question.explanation}
                    onChange={(event) =>
                      updateQuestion(question.id, (current) => ({
                        ...current,
                        explanation: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  },
);
