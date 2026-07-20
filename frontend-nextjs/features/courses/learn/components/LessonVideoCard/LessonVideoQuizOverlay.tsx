import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, CircleHelp, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InVideoQuizPoint, AfterLessonQuizQuestion } from "../../utils";

interface LessonVideoQuizOverlayProps {
  activeQuizPoint: InVideoQuizPoint | null;
  inVideoAnswers: Record<string, number>;
  inVideoSubmitted: Record<string, boolean>;
  inVideoScore: boolean | null;
  onSelectInVideoAnswer: (quizPointId: string, optionIndex: number) => void;
  onSubmitInVideoQuiz: () => void;

  showAfterLessonOverlay: boolean;
  afterLessonQuiz: AfterLessonQuizQuestion[];
  afterLessonAnswers: Record<string, number>;
  afterLessonSubmitted: boolean;
  afterLessonScore: {
    correct: number;
    total: number;
    percent: number;
  } | null;
  afterLessonPassed: boolean;
  afterLessonCorrectAnswers: Record<string, number>;
  hasNextLesson: boolean;
  nextLessonCountdown: number | null;
  nextLessonTitle?: string;
  onSelectAfterLessonAnswer: (questionId: string, optionIndex: number) => void;
  onSubmitAfterLessonQuiz: () => void;
  onAdvanceToNextLesson: () => void;
  onRetryAfterLessonQuiz: () => void;
}

export function LessonVideoQuizOverlay({
  activeQuizPoint,
  inVideoAnswers,
  inVideoSubmitted,
  inVideoScore,
  onSelectInVideoAnswer,
  onSubmitInVideoQuiz,
  showAfterLessonOverlay,
  afterLessonQuiz,
  afterLessonAnswers,
  afterLessonSubmitted,
  afterLessonScore,
  afterLessonPassed,
  afterLessonCorrectAnswers,
  hasNextLesson,
  nextLessonCountdown,
  nextLessonTitle,
  onSelectAfterLessonAnswer,
  onSubmitAfterLessonQuiz,
  onAdvanceToNextLesson,
  onRetryAfterLessonQuiz,
}: LessonVideoQuizOverlayProps) {
  return (
    <>
      {/* 1. In-Video Quiz Overlay */}
      <AnimatePresence>
        {activeQuizPoint && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-3 sm:p-5 flex justify-center items-start"
          >
            <div className="relative w-full sm:w-[92%] max-w-full sm:max-w-4xl mx-auto my-auto rounded-3xl border border-white/15 bg-slate-950/78 p-4 sm:p-6 shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl">
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  Kiểm tra nhanh
                </p>
                <h3 className="mt-3 text-lg font-semibold leading-snug text-white sm:text-xl whitespace-pre-wrap break-words">
                  {activeQuizPoint.question}
                </h3>
              </div>

              <div className="mt-5 space-y-3">
                {activeQuizPoint.options.map((option, optionIndex) => {
                  const isSelected = inVideoAnswers[activeQuizPoint.id] === optionIndex;
                  const submitted = Boolean(inVideoSubmitted[activeQuizPoint.id]);
                  const hasCorrectAnswer = activeQuizPoint.answerIndex !== null;
                  const isCorrectAnswer = submitted && hasCorrectAnswer && activeQuizPoint.answerIndex === optionIndex;
                  const isWrongSelection =
                    submitted && isSelected && hasCorrectAnswer && activeQuizPoint.answerIndex !== optionIndex;

                  let cardClasses =
                    "border-white/15 bg-white/5 text-white hover:border-white/35 hover:bg-white/10";
                  let indicatorClasses = "border-white/25 bg-white/[0.02] text-white/75";

                  if (isCorrectAnswer) {
                    cardClasses =
                      "border-success/80 bg-success/15 text-success shadow-[0_0_0_1px_rgba(34,197,94,0.18)]";
                    indicatorClasses = "border-success bg-success text-success-foreground font-bold";
                  } else if (isWrongSelection) {
                    cardClasses =
                      "border-destructive/80 bg-destructive/15 text-destructive shadow-[0_0_0_1px_rgba(239,68,68,0.2)]";
                    indicatorClasses = "border-destructive bg-destructive text-destructive-foreground font-bold";
                  } else if (isSelected && !submitted) {
                    cardClasses =
                      "border-primary bg-primary/15 text-primary shadow-[0_0_18px_rgba(245,158,11,0.16)]";
                    indicatorClasses = "border-primary bg-primary text-primary-foreground font-bold";
                  }

                  return (
                    <button
                      key={`${activeQuizPoint.id}-${optionIndex}`}
                      type="button"
                      disabled={submitted}
                      className={`flex min-w-0 w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all duration-200 ${cardClasses}`}
                      onClick={() => onSelectInVideoAnswer(activeQuizPoint.id, optionIndex)}
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm transition-colors ${indicatorClasses}`}
                      >
                        {String.fromCharCode(65 + optionIndex)}
                      </div>
                      <span className="flex-1 min-w-0 break-words text-sm font-medium sm:text-base">
                        {option}
                      </span>
                      {isCorrectAnswer ? <CheckCircle2 className="h-5 w-5 text-success" /> : null}
                      {isWrongSelection ? <XCircle className="h-5 w-5 text-destructive" /> : null}
                    </button>
                  );
                })}
              </div>

              {inVideoSubmitted[activeQuizPoint.id] ? (
                <div
                  className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
                    inVideoScore === null
                      ? "border-white/20 bg-white/8 text-white/80"
                      : inVideoScore
                      ? "border-success/40 bg-success/12 text-success"
                      : "border-destructive/40 bg-destructive/12 text-destructive"
                  }`}
                >
                  {inVideoScore === null ? (
                    <p className="font-medium">Đang ghi nhận câu trả lời...</p>
                  ) : inVideoScore ? (
                    <p className="font-medium">Bạn làm đúng.</p>
                  ) : (
                    <p className="font-medium">
                      Sai rồi. Đáp án đúng là:{" "}
                      {activeQuizPoint.answerIndex !== null
                        ? activeQuizPoint.options[activeQuizPoint.answerIndex]
                        : "chưa có đáp án đúng"}
                    </p>
                  )}
                </div>
              ) : null}

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                <div className="flex items-center gap-2 text-xs text-white/75">
                  <CircleHelp className="h-3.5 w-3.5 text-white/70" />
                  Chọn đáp án để tiếp tục video
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    className="rounded-lg border border-white/25 bg-white/10 px-4 text-white shadow-none hover:bg-white/20 disabled:border-white/10 disabled:bg-white/5 disabled:text-white/50"
                    disabled={
                      inVideoAnswers[activeQuizPoint.id] === undefined ||
                      Boolean(inVideoSubmitted[activeQuizPoint.id])
                    }
                    onClick={onSubmitInVideoQuiz}
                  >
                    {inVideoSubmitted[activeQuizPoint.id] ? "Đã ghi nhận" : "Kiểm tra đáp án"}
                  </Button>
                  {inVideoScore !== null ? (
                    <span className={`flex items-center gap-1 text-xs ${inVideoScore ? "text-success" : "text-destructive"}`}>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {inVideoScore ? "Đúng" : "Sai, thử lại nhé"}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. After-Lesson Quiz Overlay */}
      <AnimatePresence>
        {showAfterLessonOverlay && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-3 sm:p-5 flex justify-center items-start"
          >
            <div className="relative w-full sm:w-[92%] max-w-full sm:max-w-4xl mx-auto my-auto rounded-3xl border border-white/15 bg-slate-950/78 p-4 sm:p-6 shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl">
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  Kiểm tra nhanh
                </p>
                <h3 className="mt-3 text-lg font-semibold leading-snug text-white sm:text-xl">
                  Quiz sau bài học
                </h3>
              </div>

              <div className="mt-5 space-y-4">
                {afterLessonQuiz.length ? (
                  <>
                    {afterLessonQuiz.map((question, questionIndex) => (
                      <div key={question.id} className="rounded-2xl border border-white/12 bg-white/5 p-3 text-white">
                        <p className="mb-2 text-sm font-medium text-white whitespace-pre-wrap break-words">
                          Câu {questionIndex + 1}: {question.question}
                        </p>
                        <div className="mt-4 space-y-3">
                          {question.options.map((option, optionIndex) => {
                            const isSelected = afterLessonAnswers[question.id] === optionIndex;
                            const correctAnswerIndex = afterLessonCorrectAnswers[question.id] !== undefined
                               ? afterLessonCorrectAnswers[question.id]
                               : question.answerIndex;
                            const isCorrectAnswer = afterLessonSubmitted && correctAnswerIndex === optionIndex;
                            const isWrongSelection =
                              afterLessonSubmitted && isSelected && correctAnswerIndex !== optionIndex;

                            let cardClasses =
                              "border-white/15 bg-white/5 text-white hover:border-white/35 hover:bg-white/10";
                            let indicatorClasses = "border-white/25 bg-white/[0.02] text-white/75";

                            if (isCorrectAnswer) {
                              cardClasses =
                                "border-success/80 bg-success/15 text-success shadow-[0_0_0_1px_rgba(34,197,94,0.18)]";
                              indicatorClasses = "border-success bg-success text-success-foreground font-bold";
                            } else if (isWrongSelection) {
                              cardClasses =
                                "border-destructive/80 bg-destructive/15 text-destructive shadow-[0_0_0_1px_rgba(239,68,68,0.2)]";
                              indicatorClasses = "border-destructive bg-destructive text-destructive-foreground font-bold";
                            } else if (isSelected && !afterLessonSubmitted) {
                              cardClasses =
                                "border-primary bg-primary/15 text-primary shadow-[0_0_18px_rgba(245,158,11,0.16)]";
                              indicatorClasses = "border-primary bg-primary text-primary-foreground font-bold";
                            }

                            return (
                              <button
                                key={`${question.id}-${optionIndex}`}
                                type="button"
                                disabled={afterLessonSubmitted}
                                className={`flex min-w-0 w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all duration-200 ${cardClasses}`}
                                onClick={() => onSelectAfterLessonAnswer(question.id, optionIndex)}
                              >
                                <div
                                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm transition-colors ${indicatorClasses}`}
                                >
                                  {String.fromCharCode(65 + optionIndex)}
                                </div>
                                <span className="flex-1 min-w-0 break-words text-base font-medium">
                                  {option}
                                </span>
                                {isCorrectAnswer ? <CheckCircle2 className="h-6 w-6 text-success" /> : null}
                                {isWrongSelection ? <XCircle className="h-6 w-6 text-destructive" /> : null}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                      <div className="flex items-center gap-2 text-xs text-white/75">
                        <CircleHelp className="h-3.5 w-3.5 text-white/70" />
                        Chọn đáp án để tiếp tục
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          className="rounded-lg border border-white/25 bg-white/10 px-4 text-white shadow-none hover:bg-white/20 disabled:border-white/10 disabled:bg-white/5 disabled:text-white/50"
                          onClick={onSubmitAfterLessonQuiz}
                        >
                          Kiểm tra đáp án
                        </Button>
                        {afterLessonScore ? (
                          <span
                            className={`flex items-center gap-1 text-xs ${
                              afterLessonScore.percent >= (afterLessonQuiz[0]?.passingScore ?? 70) ? "text-success" : "text-destructive"
                            }`}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {afterLessonScore.correct}/{afterLessonScore.total} câu đúng ({afterLessonScore.percent}%)
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {afterLessonScore && afterLessonPassed ? (
                      <div className="rounded-2xl border border-success/20 bg-success/10 p-3 text-sm text-white">
                        <p className="font-semibold text-success">Hoàn thành rất tốt</p>
                        <p className="mt-1 text-xs text-success-foreground/90">
                          {hasNextLesson
                            ? `Tự chuyển sang bài tiếp theo sau ${nextLessonCountdown ?? 5}s.`
                            : "Bạn đã hoàn thành bài cuối của khóa."}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Button
                            size="sm"
                            className="bg-success text-success-foreground hover:bg-success/90"
                            onClick={onAdvanceToNextLesson}
                          >
                            {hasNextLesson ? "Học bài tiếp theo ngay" : "Ôn lại bài đầu tiên"}
                          </Button>
                          <span className="text-xs text-success-foreground/80">
                            {nextLessonTitle ?? "Đây là bài cuối của khóa học"}
                          </span>
                        </div>
                      </div>
                    ) : null}

                    {afterLessonScore && !afterLessonPassed ? (
                      <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-white">
                        <p className="font-semibold text-destructive">Chưa đạt điểm yêu cầu</p>
                        <p className="mt-1 text-xs text-white/70">
                          Bạn cần trả lời đúng tối thiểu {afterLessonQuiz[0]?.passingScore ?? 70}% câu hỏi để hoàn thành bài học này.
                        </p>
                        <div className="mt-2">
                          <Button
                            size="sm"
                            className="bg-white/10 hover:bg-white/20 text-white border border-white/25 rounded-lg shadow-none"
                            onClick={onRetryAfterLessonQuiz}
                          >
                            Làm lại bài kiểm tra
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/15 bg-white/3 p-3 text-sm text-white/70">
                    Bài học này chưa có quiz sau bài học từ API.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
