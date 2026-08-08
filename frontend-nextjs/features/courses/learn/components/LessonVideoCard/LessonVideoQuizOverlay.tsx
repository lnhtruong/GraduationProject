import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, CircleHelp, X, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InVideoQuizPoint, AfterLessonQuizQuestion } from "../../utils";
import type { QuizAnswerExplanation } from "../../hooks/useCourseLearnPlayer";
import { parseVideoTimestampToSeconds } from "../../utils/quiz-utils";
import { EvidencePreviewPlayer } from "./EvidencePreviewPlayer";

interface LessonVideoQuizOverlayProps {
  activeQuizPoint: InVideoQuizPoint | null;
  isQuizOverlayDismissed: boolean;
  isQuizSolved: (point: InVideoQuizPoint) => boolean;
  reviewingQuizPoints: InVideoQuizPoint[] | null;
  onCloseQuizGroupReview: () => void;
  inVideoAnswers: Record<string, number>;
  inVideoSubmitted: Record<string, boolean>;
  inVideoScore: boolean | null;
  inVideoCorrectAnswers: Record<string, number>;
  inVideoExplanations: Record<string, QuizAnswerExplanation>;
  onSelectInVideoAnswer: (quizPointId: string, optionIndex: number) => void;
  onSubmitInVideoQuiz: () => void;
  onContinueAfterInVideoQuiz: () => void;
  onDismissQuizOverlay: () => void;

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
  afterLessonExplanations: Record<string, QuizAnswerExplanation>;
  videoUrl?: string;
  hasNextLesson: boolean;
  nextLessonCountdown: number | null;
  nextLessonTitle?: string;
  onSelectAfterLessonAnswer: (questionId: string, optionIndex: number) => void;
  onSubmitAfterLessonQuiz: () => void;
  onAdvanceToNextLesson: () => void;
  onRetryAfterLessonQuiz: () => void;
}

function getOptionClasses({
  selected,
  submitted,
  correct,
  wrong,
}: {
  selected: boolean;
  submitted: boolean;
  correct: boolean;
  wrong: boolean;
}) {
  if (correct) {
    return {
      card: "border-success/80 bg-success/15 text-success shadow-[0_0_0_1px_rgba(34,197,94,0.18)]",
      indicator: "border-success bg-success text-success-foreground font-bold",
    };
  }

  if (wrong) {
    return {
      card: "border-destructive/80 bg-destructive/15 text-destructive shadow-[0_0_0_1px_rgba(239,68,68,0.2)]",
      indicator:
        "border-destructive bg-destructive text-destructive-foreground font-bold",
    };
  }

  if (selected && !submitted) {
    return {
      card: "border-primary bg-primary/15 text-primary shadow-[0_0_18px_rgba(245,158,11,0.16)]",
      indicator: "border-primary bg-primary text-primary-foreground font-bold",
    };
  }

  return {
    card: "border-white/15 bg-white/5 text-white hover:border-white/35 hover:bg-white/10",
    indicator: "border-white/25 bg-white/[0.02] text-white/75",
  };
}

export function LessonVideoQuizOverlay({
  activeQuizPoint,
  isQuizOverlayDismissed,
  isQuizSolved,
  reviewingQuizPoints,
  onCloseQuizGroupReview,
  inVideoAnswers,
  inVideoSubmitted,
  inVideoScore,
  inVideoCorrectAnswers,
  inVideoExplanations,
  onSelectInVideoAnswer,
  onSubmitInVideoQuiz,
  onContinueAfterInVideoQuiz,
  onDismissQuizOverlay,
  showAfterLessonOverlay,
  afterLessonQuiz,
  afterLessonAnswers,
  afterLessonSubmitted,
  afterLessonScore,
  afterLessonPassed,
  afterLessonCorrectAnswers,
  afterLessonExplanations,
  videoUrl,
  hasNextLesson,
  nextLessonCountdown,
  nextLessonTitle,
  onSelectAfterLessonAnswer,
  onSubmitAfterLessonQuiz,
  onAdvanceToNextLesson,
  onRetryAfterLessonQuiz,
}: LessonVideoQuizOverlayProps) {
  const [previewingKey, setPreviewingKey] = useState<string | null>(null);

  const isReviewingSolvedQuiz = activeQuizPoint
    ? isQuizSolved(activeQuizPoint)
    : false;

  const inVideoCorrectAnswerIndex = activeQuizPoint
    ? (inVideoCorrectAnswers[activeQuizPoint.id] ?? activeQuizPoint.answerIndex)
    : null;
  const inVideoExplanationEntry = activeQuizPoint
    ? inVideoExplanations[activeQuizPoint.id]
    : undefined;

  return (
    <>
      <AnimatePresence>
        {activeQuizPoint && !isQuizOverlayDismissed ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-3 sm:p-5"
          >
            <div className="relative mx-auto my-auto w-full max-w-full rounded-3xl border border-white/15 bg-slate-950/78 p-4 text-white shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:w-[92%] sm:max-w-4xl sm:p-6">
              <button
                type="button"
                onClick={
                  isReviewingSolvedQuiz
                    ? onContinueAfterInVideoQuiz
                    : onDismissQuizOverlay
                }
                aria-label={
                  isReviewingSolvedQuiz
                    ? "Đóng xem lại"
                    : "Đóng, video sẽ không tiếp tục cho tới khi làm quiz"
                }
                title={
                  isReviewingSolvedQuiz
                    ? "Đóng xem lại"
                    : "Đóng — video sẽ không tiếp tục cho tới khi bạn làm quiz"
                }
                className="absolute right-3 top-3 z-10 rounded-full border border-white/20 bg-white/10 p-1.5 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  Kiểm tra nhanh
                </p>
                <h3 className="mt-3 whitespace-pre-wrap break-words text-lg font-semibold leading-snug sm:text-xl">
                  {activeQuizPoint.question}
                </h3>
              </div>

              <div className="mt-5 space-y-3">
                {activeQuizPoint.options.map((option, optionIndex) => {
                  const selected =
                    inVideoAnswers[activeQuizPoint.id] === optionIndex;
                  const submitted = Boolean(
                    inVideoSubmitted[activeQuizPoint.id],
                  );
                  const hasCorrectAnswer = inVideoCorrectAnswerIndex !== null;
                  const correct =
                    submitted &&
                    hasCorrectAnswer &&
                    inVideoCorrectAnswerIndex === optionIndex;
                  const wrong =
                    submitted &&
                    selected &&
                    hasCorrectAnswer &&
                    inVideoCorrectAnswerIndex !== optionIndex;
                  const classes = getOptionClasses({
                    selected,
                    submitted,
                    correct,
                    wrong,
                  });

                  return (
                    <button
                      key={`${activeQuizPoint.id}-${optionIndex}`}
                      type="button"
                      disabled={submitted}
                      className={`flex min-w-0 w-full cursor-pointer items-center gap-3 rounded-xl border-2 p-3 text-left transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-90 sm:gap-4 sm:p-4 ${classes.card}`}
                      onClick={() =>
                        onSelectInVideoAnswer(activeQuizPoint.id, optionIndex)
                      }
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm transition-colors ${classes.indicator}`}
                      >
                        {String.fromCharCode(65 + optionIndex)}
                      </div>
                      <span className="min-w-0 flex-1 break-words text-sm font-medium sm:text-base">
                        {option}
                      </span>
                      {correct ? (
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      ) : null}
                      {wrong ? (
                        <XCircle className="h-5 w-5 text-destructive" />
                      ) : null}
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
                      {inVideoCorrectAnswerIndex !== null
                        ? activeQuizPoint.options[inVideoCorrectAnswerIndex]
                        : "chưa có đáp án đúng"}
                    </p>
                  )}
                  {inVideoExplanationEntry?.explanation ? (
                    <p className="mt-2 text-xs text-white/80 whitespace-pre-wrap break-words">
                      {inVideoExplanationEntry.explanation}
                    </p>
                  ) : null}
                  {inVideoExplanationEntry?.evidenceTimestamp ? (
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewingKey((prev) =>
                          prev === "in_video" ? null : "in_video",
                        )
                      }
                      className="mt-2 inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-white/20 transition-colors"
                    >
                       {previewingKey === "in_video" ? "Đóng lại" : "Xem lại đoạn video"}
                    </button>
                  ) : null}
                  {previewingKey === "in_video" && inVideoExplanationEntry?.evidenceTimestamp ? (
                    <EvidencePreviewPlayer
                      videoUrl={videoUrl}
                      startSeconds={
                        parseVideoTimestampToSeconds(
                          inVideoExplanationEntry.evidenceTimestamp,
                        ) ?? 0
                      }
                      onClose={() => setPreviewingKey(null)}
                    />
                  ) : null}
                </div>
              ) : null}

              <div className="mt-6 flex flex-col items-stretch gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-xs text-white/75">
                  <CircleHelp className="h-3.5 w-3.5 text-white/70" />
                  {isReviewingSolvedQuiz
                    ? "Xem lại câu hỏi đã trả lời"
                    : "Chọn đáp án để tiếp tục video"}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                  {!isReviewingSolvedQuiz ? (
                    <Button
                      size="sm"
                      className="w-full rounded-lg border border-white/25 bg-white/10 px-4 text-white shadow-none hover:bg-white/20 disabled:border-white/10 disabled:bg-white/5 disabled:text-white/50 sm:w-auto"
                      disabled={
                        inVideoAnswers[activeQuizPoint.id] === undefined ||
                        Boolean(inVideoSubmitted[activeQuizPoint.id])
                      }
                      onClick={onSubmitInVideoQuiz}
                    >
                      {inVideoSubmitted[activeQuizPoint.id]
                        ? "Đã ghi nhận"
                        : "Kiểm tra đáp án"}
                    </Button>
                  ) : null}
                  {inVideoScore !== null ? (
                    <span
                      className={`flex items-center gap-1 text-xs ${
                        inVideoScore ? "text-success" : "text-destructive"
                      }`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {inVideoScore ? "Đúng" : "Sai"}
                    </span>
                  ) : null}
                  {inVideoScore !== null ? (
                    <Button
                      size="sm"
                      className="w-full rounded-lg bg-primary px-4 text-primary-foreground shadow-none hover:bg-primary/90 sm:w-auto"
                      onClick={onContinueAfterInVideoQuiz}
                    >
                      {isReviewingSolvedQuiz ? "Đóng" : "Tiếp tục video"}
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {reviewingQuizPoints ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-3 sm:p-5"
          >
            <div className="relative mx-auto my-auto w-full max-w-full rounded-3xl border border-white/15 bg-slate-950/78 p-4 text-white shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:w-[92%] sm:max-w-4xl sm:p-6">
              <button
                type="button"
                onClick={onCloseQuizGroupReview}
                aria-label="Đóng xem lại"
                title="Đóng xem lại"
                className="absolute right-3 top-3 z-10 rounded-full border border-white/20 bg-white/10 p-1.5 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  Xem lại câu hỏi đã trả lời
                </p>
                <h3 className="mt-3 text-lg font-semibold leading-snug sm:text-xl">
                  {reviewingQuizPoints.length > 1
                    ? `${reviewingQuizPoints.length} câu hỏi tại mốc này`
                    : "Câu hỏi tại mốc này"}
                </h3>
              </div>

              <div className="mt-5 space-y-4">
                {reviewingQuizPoints.map((point, pointIndex) => {
                  const correctAnswerIndex =
                    inVideoCorrectAnswers[point.id] ?? point.answerIndex;
                  const explanationEntry = inVideoExplanations[point.id];
                  const reviewPreviewKey = `review_${point.id}`;

                  return (
                    <div
                      key={point.id}
                      className="rounded-2xl border border-white/12 bg-white/5 p-3"
                    >
                      <p className="mb-2 whitespace-pre-wrap break-words text-sm font-medium">
                        {reviewingQuizPoints.length > 1
                          ? `Câu ${pointIndex + 1}: ${point.question}`
                          : point.question}
                      </p>
                      <div className="mt-4 space-y-3">
                        {point.options.map((option, optionIndex) => {
                          const selected =
                            inVideoAnswers[point.id] === optionIndex;
                          const correct = correctAnswerIndex === optionIndex;
                          const wrong =
                            selected && correctAnswerIndex !== optionIndex;
                          const classes = getOptionClasses({
                            selected,
                            submitted: true,
                            correct,
                            wrong,
                          });

                          return (
                            <div
                              key={`${point.id}-${optionIndex}`}
                              className={`flex min-w-0 w-full items-center gap-4 rounded-xl border-2 p-4 text-left ${classes.card}`}
                            >
                              <div
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm ${classes.indicator}`}
                              >
                                {String.fromCharCode(65 + optionIndex)}
                              </div>
                              <span className="min-w-0 flex-1 break-words text-sm font-medium sm:text-base">
                                {option}
                              </span>
                              {correct ? (
                                <CheckCircle2 className="h-5 w-5 text-success" />
                              ) : null}
                              {wrong ? (
                                <XCircle className="h-5 w-5 text-destructive" />
                              ) : null}
                            </div>
                          );
                        })}
                      </div>

                      {explanationEntry?.explanation ? (
                        <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
                          <p className="text-xs text-white/80 whitespace-pre-wrap break-words">
                            {explanationEntry.explanation}
                          </p>
                          {explanationEntry.evidenceTimestamp ? (
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewingKey((prev) =>
                                  prev === reviewPreviewKey
                                    ? null
                                    : reviewPreviewKey,
                                )
                              }
                              className="mt-2 inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-white/20 transition-colors"
                            >
                              {previewingKey === reviewPreviewKey
                                ? "Đóng lại"
                                : "Xem lại đoạn video"}
                            </button>
                          ) : null}
                          {previewingKey === reviewPreviewKey ? (
                            <EvidencePreviewPlayer
                              videoUrl={videoUrl}
                              startSeconds={
                                parseVideoTimestampToSeconds(
                                  explanationEntry.evidenceTimestamp,
                                ) ?? 0
                              }
                              onClose={() => setPreviewingKey(null)}
                            />
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex justify-end border-t border-white/10 pt-4">
                <Button
                  size="sm"
                  className="w-full rounded-lg bg-primary px-4 text-primary-foreground shadow-none hover:bg-primary/90 sm:w-auto"
                  onClick={onCloseQuizGroupReview}
                >
                  Đóng
                </Button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {showAfterLessonOverlay ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-3 sm:p-5"
          >
            <div className="relative mx-auto my-auto w-full max-w-full rounded-3xl border border-white/15 bg-slate-950/78 p-4 text-white shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:w-[92%] sm:max-w-4xl sm:p-6">
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  Kiểm tra nhanh
                </p>
                <h3 className="mt-3 text-lg font-semibold leading-snug sm:text-xl">
                  Quiz sau bài học
                </h3>
              </div>

              <div className="mt-5 space-y-4">
                {afterLessonQuiz.length ? (
                  <>
                    {afterLessonQuiz.map((question, questionIndex) => (
                      <div
                        key={question.id}
                        className="rounded-2xl border border-white/12 bg-white/5 p-3"
                      >
                        <p className="mb-2 whitespace-pre-wrap break-words text-sm font-medium">
                          Câu {questionIndex + 1}: {question.question}
                        </p>
                        <div className="mt-4 space-y-3">
                          {question.options.map((option, optionIndex) => {
                            const selected =
                              afterLessonAnswers[question.id] === optionIndex;
                            const correctAnswerIndex =
                              afterLessonCorrectAnswers[question.id] ??
                              question.answerIndex;
                            const correct =
                              afterLessonSubmitted &&
                              correctAnswerIndex === optionIndex;
                            const wrong =
                              afterLessonSubmitted &&
                              selected &&
                              correctAnswerIndex !== optionIndex;
                            const classes = getOptionClasses({
                              selected,
                              submitted: afterLessonSubmitted,
                              correct,
                              wrong,
                            });

                            return (
                              <button
                                key={`${question.id}-${optionIndex}`}
                                type="button"
                                disabled={afterLessonSubmitted}
                                className={`flex min-w-0 w-full cursor-pointer items-center gap-3 rounded-xl border-2 p-3 text-left transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-90 sm:gap-4 sm:p-4 ${classes.card}`}
                                onClick={() =>
                                  onSelectAfterLessonAnswer(
                                    question.id,
                                    optionIndex,
                                  )
                                }
                              >
                                <div
                                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm transition-colors ${classes.indicator}`}
                                >
                                  {String.fromCharCode(65 + optionIndex)}
                                </div>
                                <span className="min-w-0 flex-1 break-words text-base font-medium">
                                  {option}
                                </span>
                                {correct ? (
                                  <CheckCircle2 className="h-6 w-6 text-success" />
                                ) : null}
                                {wrong ? (
                                  <XCircle className="h-6 w-6 text-destructive" />
                                ) : null}
                              </button>
                            );
                          })}
                        </div>

                        {afterLessonSubmitted && afterLessonExplanations[question.id]?.explanation ? (
                          <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
                            <p className="text-xs text-white/80 whitespace-pre-wrap break-words">
                              {afterLessonExplanations[question.id]?.explanation}
                            </p>
                            {afterLessonExplanations[question.id]?.evidenceTimestamp ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewingKey((prev) =>
                                    prev === `after_lesson_${question.id}`
                                      ? null
                                      : `after_lesson_${question.id}`,
                                  )
                                }
                                className="mt-2 inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-white/20 transition-colors"
                              >
                                {" "}
                                {previewingKey === `after_lesson_${question.id}`
                                  ? "Đóng lại"
                                  : "Xem lại đoạn video"}
                              </button>
                            ) : null}
                            {previewingKey === `after_lesson_${question.id}` ? (
                              <EvidencePreviewPlayer
                                videoUrl={videoUrl}
                                startSeconds={
                                  parseVideoTimestampToSeconds(
                                    afterLessonExplanations[question.id]!
                                      .evidenceTimestamp,
                                  ) ?? 0
                                }
                                onClose={() => setPreviewingKey(null)}
                              />
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    ))}

                    <div className="flex flex-col items-stretch gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2 text-xs text-white/75">
                        <CircleHelp className="h-3.5 w-3.5 text-white/70" />
                        Chọn đáp án để tiếp tục
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                        <Button
                          size="sm"
                          className="w-full rounded-lg border border-white/25 bg-white/10 px-4 text-white shadow-none hover:bg-white/20 disabled:border-white/10 disabled:bg-white/5 disabled:text-white/50 sm:w-auto"
                          disabled={afterLessonSubmitted}
                          onClick={onSubmitAfterLessonQuiz}
                        >
                          Kiểm tra đáp án
                        </Button>
                        {afterLessonScore ? (
                          <span
                            className={`flex items-center gap-1 text-xs ${
                              afterLessonScore.percent >=
                              (afterLessonQuiz[0]?.passingScore ?? 70)
                                ? "text-success"
                                : "text-destructive"
                            }`}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {afterLessonScore.correct}/{afterLessonScore.total}{" "}
                            câu đúng ({afterLessonScore.percent}%)
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {afterLessonScore && afterLessonPassed ? (
                      <div className="rounded-2xl border border-success/20 bg-success/10 p-3 text-sm">
                        <p className="font-semibold text-success">
                          Hoàn thành rất tốt
                        </p>
                        <p className="mt-1 text-xs text-success-foreground/90">
                          {hasNextLesson
                            ? `Tự chuyển sang bài tiếp theo sau ${
                                nextLessonCountdown ?? 5
                              }s.`
                            : "Bạn đã hoàn thành bài cuối của khóa."}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Button
                            size="sm"
                            className="bg-success text-success-foreground hover:bg-success/90"
                            onClick={onAdvanceToNextLesson}
                          >
                            {hasNextLesson
                              ? "Học bài tiếp theo ngay"
                              : "Ôn lại bài đầu tiên"}
                          </Button>
                          <span className="text-xs text-success-foreground/80">
                            {nextLessonTitle ??
                              "Đây là bài cuối của khóa học"}
                          </span>
                        </div>
                      </div>
                    ) : null}

                    {afterLessonScore && !afterLessonPassed ? (
                      <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-3 text-sm">
                        <p className="font-semibold text-destructive">
                          Chưa đạt điểm yêu cầu
                        </p>
                        <p className="mt-1 text-xs text-white/70">
                          Bạn cần trả lời đúng tối thiểu{" "}
                          {afterLessonQuiz[0]?.passingScore ?? 70}% câu hỏi để
                          hoàn thành bài học này.
                        </p>
                        <div className="mt-2">
                          <Button
                            size="sm"
                            className="rounded-lg border border-white/25 bg-white/10 text-white shadow-none hover:bg-white/20"
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
        ) : null}
      </AnimatePresence>
    </>
  );
}
