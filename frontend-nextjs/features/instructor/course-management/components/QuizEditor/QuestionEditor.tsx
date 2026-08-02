"use client";

import { useRef } from "react";
import { Plus, Trash2, Crosshair } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { QuizEditorQuestion, QuizEditorOption } from "../../types";
import { parseVideoTimestampToSeconds } from "../../utils/quiz-timeline.utils";
import { EvidenceVideoPlayer } from "./EvidenceVideoPlayer";

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
  question: QuizEditorQuestion | null;
  onUpdateQuestion: (
    questionId: number,
    updater: (question: QuizEditorQuestion) => QuizEditorQuestion,
  ) => void;
  onAddOption: (questionId: number) => void;
  onRemoveOption: (questionId: number, optionId: string) => void;
  videoUrl?: string | null;
  videoDurationSeconds?: number;
}

export function QuestionEditor({
  question,
  onUpdateQuestion,
  onAddOption,
  onRemoveOption,
  videoUrl,
  videoDurationSeconds,
}: Props) {
  const evidenceVideoRef = useRef<HTMLVideoElement | null>(null);
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
                className={`flex items-start gap-3 rounded-xl border p-2.5 transition-all duration-200 bg-background/60 focus-within:bg-background ${
                  option.isCorrect
                    ? "border-green-500/30 bg-green-500/[0.02] focus-within:border-green-500/50"
                    : "border-border/60 focus-within:border-primary/50"
                }`}
              >
                <Textarea
                  value={option.label}
                  onChange={(event) =>
                    updateOption(option.id, (current) => ({
                      ...current,
                      label: event.target.value,
                    }))
                  }
                  placeholder="Nhập nội dung câu trả lời..."
                  rows={1}
                  className="min-h-[38px] py-2 resize-none border-none bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-1 placeholder:text-muted-foreground/50 flex-1 min-w-0"
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
                  className={`flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold border transition-all duration-200 mt-0.5 ${
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
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors rounded-lg mt-0.5"
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
            placeholder="Giải thích tại sao đáp án trên lại đúng..."
            className="min-h-16 rounded-lg border-border focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:border-primary/50 resize-y"
          />
        </div>

        <div className="grid gap-2 pt-2 border-t border-border/40">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
            Bằng chứng video (Tùy chọn)
          </Label>
          <EvidenceVideoPlayer
            videoUrl={videoUrl}
            videoDurationSeconds={videoDurationSeconds}
            seekToSeconds={parseVideoTimestampToSeconds(
              question.evidenceTimestamp,
            )}
            onVideoRefChange={(element) => {
              evidenceVideoRef.current = element;
            }}
          />
          <div className="flex gap-2">
            <Input
              value={question.evidenceTimestamp ?? ""}
              onChange={(event) =>
                onUpdateQuestion(question.id, (current) => ({
                  ...current,
                  evidenceTimestamp: event.target.value,
                }))
              }
              placeholder="HH:MM:SS,mmm"
              className={`rounded-lg font-mono text-sm ${
                question.evidenceTimestamp &&
                !VIDEO_TIMESTAMP_PATTERN.test(question.evidenceTimestamp.trim())
                  ? "border-destructive focus-visible:ring-destructive/30"
                  : "border-border focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:border-primary/50"
              }`}
            />
            {videoUrl ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                title="Lấy thời điểm hiện tại của video"
                onClick={() =>
                  onUpdateQuestion(question.id, (current) => ({
                    ...current,
                    evidenceTimestamp: formatSecondsToTimestamp(
                      evidenceVideoRef.current?.currentTime ?? 0,
                    ),
                  }))
                }
                className="h-10 shrink-0 px-2.5 rounded-lg border-border/80 bg-background hover:bg-muted/40"
              >
                <Crosshair className="h-3.5 w-3.5" />
              </Button>
            ) : null}
          </div>
          {question.evidenceTimestamp &&
          !VIDEO_TIMESTAMP_PATTERN.test(question.evidenceTimestamp.trim()) ? (
            <p className="text-xs text-destructive">
              Định dạng không hợp lệ. Dùng HH:MM:SS,mmm (ví dụ 00:01:23,500).
            </p>
          ) : (
            <p className="text-xs text-muted-foreground/70">
              Mốc thời gian trong video chứng minh đáp án — để trống nếu không có.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
