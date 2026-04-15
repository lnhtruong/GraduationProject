"use client";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { CirclePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
      <div className="space-y-4">
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Thông tin quiz</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Tiêu đề quiz</label>
                <Input
                  value={state.title}
                  onChange={(event) => updateTitle(event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Điểm đạt</label>
                <Input
                  type="number"
                  value={state.passingScore}
                  onChange={(event) =>
                    updatePassingScore(Number(event.target.value || 0))
                  }
                />
              </div>
            </div>

            <div className="grid gap-3">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Mô tả</label>
                <Textarea
                  className="min-h-20"
                  value={state.description}
                  onChange={(event) => updateDescription(event.target.value)}
                />
              </div>
            </div>

            {state.isInVideo && defaultTimestamp ? (
              <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                Quiz trong video: mốc mặc định đang dùng là {defaultTimestamp}.
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold">
            Bộ câu hỏi ({state.questions.length})
          </h3>
          <Button type="button" variant="outline" onClick={addQuestion}>
            <CirclePlus className="mr-2 h-4 w-4" />
            Thêm câu hỏi
          </Button>
        </div>

        <div className="space-y-3">
          {state.questions.map((question, index) => (
            <Card key={question.id} className="border-border/60">
              <CardContent className="space-y-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold">Câu {index + 1}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => removeQuestion(question.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium">
                    Nội dung câu hỏi
                  </label>
                  <Textarea
                    className="min-h-20"
                    value={question.prompt}
                    onChange={(event) =>
                      updateQuestion(question.id, (current) => ({
                        ...current,
                        prompt: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium">Lựa chọn</p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => addOption(question.id)}
                    >
                      Thêm lựa chọn
                    </Button>
                  </div>

                  {question.options.map((option) => (
                    <div
                      key={option.id}
                      className="grid gap-2 rounded-xl border border-border/60 bg-muted/15 p-3 md:grid-cols-[1fr_auto_auto] md:items-center"
                    >
                      <Input
                        value={option.label}
                        onChange={(event) =>
                          updateOption(question.id, option.id, (current) => ({
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
                            updateQuestion(question.id, (current) => ({
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
                        className="h-8 w-8 justify-self-start text-destructive md:justify-self-auto"
                        onClick={() => removeOption(question.id, option.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium">
                    Giải thích đáp án
                  </label>
                  <Textarea
                    className="min-h-16"
                    value={question.explanation}
                    onChange={(event) =>
                      updateQuestion(question.id, (current) => ({
                        ...current,
                        explanation: event.target.value,
                      }))
                    }
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  },
);
