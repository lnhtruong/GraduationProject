"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { CirclePlus, Crosshair, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

import type { QuizEditorOption, QuizEditorState } from "../types";
import { useQuizEditor } from "../hooks/useQuizEditor";
import { parseVideoTimestampToSeconds } from "../utils/quiz-timeline.utils";
import { EvidenceVideoPlayer } from "./QuizEditor/EvidenceVideoPlayer";

const VIDEO_TIMESTAMP_PATTERN = /^\d{2}:\d{2}:\d{2}[,.]\d{3}$/;
function formatSecondsToTimestamp(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const totalMillis = Math.round(safe * 1000);
  const wholeSeconds = Math.floor(totalMillis / 1000);
  const hours = Math.floor(wholeSeconds / 3600);
  const minutes = Math.floor((wholeSeconds % 3600) / 60);
  const seconds = wholeSeconds % 60;
  const millis = totalMillis % 1000;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")},${String(millis).padStart(3, "0")}`;
}

interface Props {
  initialInVideo: boolean;
  defaultTimestamp?: string;
  onSubmit: (state: QuizEditorState) => Promise<void> | void;
  videoUrl?: string | null;
  videoDurationSeconds?: number;
}

export interface ActivityQuizFormHandle {
  submit: () => Promise<boolean>;
}

export const ActivityQuizForm = forwardRef<ActivityQuizFormHandle, Props>(
  function ActivityQuizForm(
    {
      initialInVideo,
      defaultTimestamp = "",
      onSubmit,
      videoUrl,
      videoDurationSeconds,
    }: Props,
    ref,
  ) {
    const evidenceVideoRefs = useRef(new Map<number, HTMLVideoElement | null>());
    const [enabledEvidenceQuestionIds, setEnabledEvidenceQuestionIds] = useState<Set<number>>(
      () => new Set(),
    );

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

    useEffect(() => {
      setState((prev) => ({
        ...prev,
        isInVideo: initialInVideo,
        questions: prev.questions.map((question) => ({
          ...question,
          videoTimestamp: initialInVideo
            ? question.videoTimestamp || defaultTimestamp
            : "",
          evidenceTimestamp: initialInVideo ? question.evidenceTimestamp : "",
        })),
      }));
    }, [defaultTimestamp, initialInVideo, setState]);

    const updateOption = (
      questionId: number,
      optionId: string,
      updater: (option: QuizEditorOption) => QuizEditorOption,
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
        if (
          question.evidenceTimestamp?.trim() &&
          !VIDEO_TIMESTAMP_PATTERN.test(question.evidenceTimestamp.trim())
        ) {
          toast.error("Mốc minh chứng cần đúng định dạng HH:MM:SS,mmm");
          return false;
        }

      }

      return true;
    };

    const submit = async () => {
      if (!validateQuiz()) {
        return false;
      }

      await onSubmit(state);
      return true;
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
                        className={`flex items-start gap-3 rounded-xl border p-2.5 transition-all duration-200 bg-background/60 focus-within:bg-background ${
                          option.isCorrect
                            ? "border-green-500/30 bg-green-500/[0.02] focus-within:border-green-500/50"
                            : "border-border/60 focus-within:border-primary/50"
                        }`}
                      >
                        <Textarea
                          value={option.label}
                          onChange={(event) =>
                            updateOption(question.id, option.id, (current) => ({
                              ...current,
                              label: event.target.value,
                            }))
                          }
                          className="min-h-[38px] py-2 resize-none border-none bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-1 placeholder:text-muted-foreground/50 rounded-none flex-1 min-w-0"
                          placeholder="Nhập nội dung câu trả lời..."
                          rows={1}
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
                          className={`flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold border transition-all duration-200 mt-0.5 ${
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
                          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors mt-0.5"
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
                    Giải thích đáp án
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
                {state.isInVideo ? (
                  <div className="grid gap-3 rounded-xl border border-border/60 bg-muted/10 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Minh chứng video
                        </Label>
                        <p className="mt-0.5 text-xs text-muted-foreground/70">
                          Tùy chọn, chỉ bật khi đáp án cần dẫn chứng khác mốc quiz.
                        </p>
                      </div>
                      <Switch
                        checked={enabledEvidenceQuestionIds.has(question.id)}
                        onCheckedChange={(checked) => {
                          setEnabledEvidenceQuestionIds((current) => {
                            const next = new Set(current);
                            if (checked) {
                              next.add(question.id);
                            } else {
                              next.delete(question.id);
                            }
                            return next;
                          });
                          updateQuestion(question.id, (current) => ({
                            ...current,
                            evidenceTimestamp: checked
                              ? current.evidenceTimestamp || current.videoTimestamp || defaultTimestamp
                              : "",
                          }));
                        }}
                        aria-label="Bật minh chứng video"
                      />
                    </div>

                    {enabledEvidenceQuestionIds.has(question.id) ? (
                      <div className="grid gap-3">
                        {videoUrl ? (
                          <EvidenceVideoPlayer
                            videoUrl={videoUrl}
                            videoDurationSeconds={videoDurationSeconds}
                            seekToSeconds={parseVideoTimestampToSeconds(
                              question.evidenceTimestamp,
                            )}
                            onVideoRefChange={(element) => {
                              evidenceVideoRefs.current.set(question.id, element);
                            }}
                          />
                        ) : null}
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Input
                            value={question.evidenceTimestamp ?? ""}
                            onChange={(event) =>
                              updateQuestion(question.id, (current) => ({
                                ...current,
                                evidenceTimestamp: event.target.value,
                              }))
                            }
                            placeholder="HH:MM:SS,mmm"
                            className={`h-10 rounded-lg bg-background font-mono text-sm ${
                              question.evidenceTimestamp?.trim() &&
                              !VIDEO_TIMESTAMP_PATTERN.test(question.evidenceTimestamp.trim())
                                ? "border-destructive focus-visible:ring-destructive/30"
                                : "border-border focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:border-primary/50"
                            }`}
                          />
                          {videoUrl ? (
                            <Button
                              type="button"
                              size="sm"
                              title="Lấy thời điểm hiện tại của video"
                              onClick={() =>
                                updateQuestion(question.id, (current) => ({
                                  ...current,
                                  evidenceTimestamp: formatSecondsToTimestamp(
                                    evidenceVideoRefs.current.get(question.id)?.currentTime ?? 0,
                                  ),
                                }))
                              }
                              className="h-10 w-full shrink-0 cursor-pointer gap-2 rounded-lg bg-primary px-3 font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:bg-primary/90 hover:text-primary-foreground hover:shadow-md sm:w-auto"
                            >
                              <Crosshair className="h-3.5 w-3.5" />
                              Lấy mốc
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  },
);
