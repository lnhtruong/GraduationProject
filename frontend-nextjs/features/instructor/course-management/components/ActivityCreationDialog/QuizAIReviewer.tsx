"use client";

import { useRef } from "react";
import { CheckCircle2, RefreshCw, Trash2, Undo2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useAllQuizQuestionsQuery,
  useDeleteQuizQuestionMutation,
  useRestoreQuizQuestionsMutation,
  useFilterQuizQuestionsMutation,
} from "../../api/ai-quiz.hooks";

interface Props {
  quizId: number;
  lessonVideoUrl?: string;
  onComplete: () => void;
}

export function QuizAIReviewer({ quizId, lessonVideoUrl, onComplete }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { data, isLoading } = useAllQuizQuestionsQuery(quizId);
  const deleteMutation = useDeleteQuizQuestionMutation(quizId);
  const restoreMutation = useRestoreQuizQuestionsMutation(quizId);
  const filterMutation = useFilterQuizQuestionsMutation(quizId);

  const activeQuestions = data?.active ?? [];
  const deletedQuestions = data?.deleted ?? [];

  const handleSeek = (timestamp: string | null) => {
    if (!timestamp || !videoRef.current) return;
    // Format timestamp "HH:MM:SS.mmm" or "HH:MM:SS,mmm" to seconds
    const [base = "00:00:00", decimal = "0"] = timestamp.replace(",", ".").split(".");
    const [h = "0", m = "0", s = "0"] = base.split(":");
    const seconds = Number(h) * 3600 + Number(m) * 60 + Number(s) + Number(decimal) / 1000;
    
    videoRef.current.currentTime = seconds;
    videoRef.current.play().catch(() => {});
  };

  const handleToggleQuestion = async (questionId: number, active: boolean) => {
    if (active) {
      // If currently active -> delete it
      await deleteMutation.mutateAsync(questionId);
    } else {
      // If currently deleted -> restore it
      await restoreMutation.mutateAsync([questionId]);
    }
  };

  const handleSaveAndComplete = async () => {
    const keepIds = activeQuestions.map((q) => q.id);
    await filterMutation.mutateAsync(keepIds);
    onComplete();
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center gap-2">
        <RefreshCw className="h-5 w-5 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Đang tải danh sách câu hỏi AI...</span>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5 h-full min-h-0">
      {/* Question List (Left 3 columns) */}
      <div className="lg:col-span-3 flex flex-col min-h-0">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-foreground">Duyệt & Lọc câu hỏi AI</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Chọn các câu hỏi bạn muốn giữ lại. Những câu không được chọn sẽ bị loại bỏ.
            </p>
          </div>
          <Badge variant="outline" className="rounded-full bg-primary/5 text-primary border-primary/20">
            Đã chọn {activeQuestions.length}/{activeQuestions.length + deletedQuestions.length}
          </Badge>
        </div>

        <ScrollArea className="flex-1 pr-3 max-h-[55vh]">
          {activeQuestions.length === 0 && deletedQuestions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Không tìm thấy câu hỏi nào.
            </div>
          ) : (
            <div className="space-y-4">
              {activeQuestions.map((q, idx) => (
                <Card key={q.id} className="border-border bg-card shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {idx + 1}
                        </span>
                        <Badge 
                          variant="secondary" 
                          className={`rounded-full text-[10px] uppercase font-bold ${
                            q.point >= 2
                              ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                              : q.point >= 1.5
                                ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          }`}
                        >
                          {q.point >= 2 ? "Khó" : q.point >= 1.5 ? "Vừa" : "Dễ"} ({q.point}đ)
                        </Badge>
                        {q.videoTimestamp && (
                          <button
                            type="button"
                            onClick={() => handleSeek(q.videoTimestamp)}
                            className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] font-bold text-sky-500 border border-sky-500/20 hover:bg-sky-500/20 transition-colors"
                          >
                            📍 {q.videoTimestamp.split(".")[0].slice(3)}
                          </button>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleQuestion(q.id, true)}
                        className="h-7 w-7 text-muted-foreground hover:text-destructive rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <p className="text-sm font-semibold text-foreground leading-relaxed">
                      {q.quesText}
                    </p>

                    <div className="grid gap-2 sm:grid-cols-2 mt-2">
                      {q.options.map((opt) => (
                        <div
                          key={opt.id}
                          className={`flex items-start gap-2 rounded-xl border p-3 text-xs font-medium leading-normal ${
                            opt.isCorrect
                              ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400"
                              : "border-border bg-muted/20 text-muted-foreground"
                          }`}
                        >
                          <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${
                            opt.isCorrect ? "bg-emerald-500 text-white" : "bg-muted-foreground/20"
                          }`}>
                            {opt.isCorrect ? "✓" : ""}
                          </span>
                          <span className="break-words">{opt.optionText}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Video & Deleted Questions (Right 2 columns) */}
      <div className="lg:col-span-2 flex flex-col gap-4 min-h-0">
        {/* Video Player */}
        {lessonVideoUrl ? (
          <div className="rounded-2xl border border-border bg-black overflow-hidden shadow-lg aspect-video shrink-0">
            <video
              ref={videoRef}
              src={lessonVideoUrl}
              className="w-full h-full object-contain"
              controls
              playsInline
            />
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground bg-muted/10 shrink-0">
            Bài học không có video xem trước.
          </div>
        )}

        {/* Deleted Drawer Section */}
        <div className="flex-1 flex flex-col min-h-0 border border-border/80 bg-muted/10 rounded-2xl p-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
            <span>Câu hỏi đã loại bỏ ({deletedQuestions.length})</span>
          </h4>

          <ScrollArea className="flex-1 max-h-[25vh] lg:max-h-none">
            {deletedQuestions.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground/80 py-8">Chưa loại bỏ câu nào.</p>
            ) : (
              <div className="space-y-3">
                {deletedQuestions.map((q) => (
                  <div key={q.id} className="flex items-start justify-between gap-3 rounded-xl border border-dashed border-border bg-background p-3 text-xs">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-muted-foreground line-clamp-2">{q.quesText}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleQuestion(q.id, false)}
                      className="h-7 rounded-lg border-primary/20 text-primary hover:bg-primary/5 flex items-center gap-1 font-semibold px-2"
                    >
                      <Undo2 className="h-3 w-3" />
                      Hoàn tác
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Action Button */}
        <Button
          onClick={handleSaveAndComplete}
          disabled={activeQuestions.length === 0 || filterMutation.isPending}
          className="w-full h-11 rounded-xl font-bold shadow-md shrink-0 flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="h-4 w-4" />
          {filterMutation.isPending ? "Đang lưu..." : "Lưu & Hoàn tất Quiz AI"}
        </Button>
      </div>
    </div>
  );
}
