import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  CircleHelp,
  Loader2,
  Pause,
  Play,
  PlayCircle,
  Sparkles,
  XCircle,
} from "lucide-react";
import { type MouseEvent, type RefObject, type SyntheticEvent } from "react";
import {
  formatTime,
  InVideoQuizPoint,
  type AfterLessonQuizQuestion,
} from "../utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

interface Props {
  selectedLessonVideoUrl?: string;
  currentLessonDurationLabel: string;
  selectedLessonDuration: number;
  currentTime: number;
  progressPercent: number;
  isPlaying: boolean;
  activeQuizPoint: InVideoQuizPoint | null;
  inVideoQuizPoints: InVideoQuizPoint[];
  inVideoAnswers: Record<string, number>;
  inVideoSubmitted: Record<string, boolean>;
  inVideoScore: boolean | null;
  afterLessonQuiz: AfterLessonQuizQuestion[];
  afterLessonAnswers: Record<string, number>;
  afterLessonSubmitted: boolean;
  afterLessonScore: {
    correct: number;
    total: number;
    percent: number;
  } | null;
  afterLessonPassed: boolean;
  hasNextLesson: boolean;
  nextLessonCountdown: number | null;
  isTransitioningNext: boolean;
  nextLessonTitle?: string;
  showAfterLessonOverlay: boolean;
  videoRef: RefObject<HTMLVideoElement | null>;
  isQuizSolved: (point: InVideoQuizPoint) => boolean;
  onTogglePlayback: () => void;
  onTimeUpdate: (event: SyntheticEvent<HTMLVideoElement>) => void;
  onVideoEnded: () => void;
  onVideoMetadataLoaded: (duration: number) => void;
  onSelectInVideoAnswer: (quizPointId: string, optionIndex: number) => void;
  onSelectAfterLessonAnswer: (questionId: string, optionIndex: number) => void;
  onSubmitAfterLessonQuiz: () => void;
  onAdvanceToNextLesson: () => void;
  onSubmitInVideoQuiz: () => void;
  onJumpToQuizPoint: (point: InVideoQuizPoint) => void;
  onOverlayScrubClick: (event: MouseEvent<HTMLDivElement>) => void;
  onSeekChange: (nextTime: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setCurrentTime: (time: number) => void;
  setLastVideoTime: (time: number) => void;
}

export function LessonVideoCard({
  selectedLessonVideoUrl,
  currentLessonDurationLabel,
  selectedLessonDuration,
  currentTime,
  progressPercent,
  isPlaying,
  activeQuizPoint,
  inVideoQuizPoints,
  inVideoAnswers,
  inVideoSubmitted,
  inVideoScore,
  afterLessonQuiz,
  afterLessonAnswers,
  afterLessonSubmitted,
  afterLessonScore,
  afterLessonPassed,
  hasNextLesson,
  nextLessonCountdown,
  isTransitioningNext,
  nextLessonTitle,
  showAfterLessonOverlay,
  videoRef,
  isQuizSolved,
  onTogglePlayback,
  onTimeUpdate,
  onVideoEnded,
  onVideoMetadataLoaded,
  onSelectInVideoAnswer,
  onSelectAfterLessonAnswer,
  onSubmitAfterLessonQuiz,
  onAdvanceToNextLesson,
  onSubmitInVideoQuiz,
  onJumpToQuizPoint,
  onOverlayScrubClick,
  onSeekChange,
  setIsPlaying,
  setCurrentTime,
  setLastVideoTime,
}: Props) {
  const playerBlocked = Boolean(activeQuizPoint) || showAfterLessonOverlay;

  return (
    <Card className="overflow-hidden border-border/70 bg-card/90 shadow-sm">
      <CardContent className="space-y-4 p-3 sm:p-4">
        <div className="overflow-hidden rounded-3xl border border-border bg-muted/30 p-2 shadow-inner">
          <div className="relative aspect-video overflow-hidden rounded-2xl border border-border bg-black">
            {selectedLessonVideoUrl ? (
              <video
                ref={videoRef}
                className={`h-full w-full cursor-pointer object-contain transition duration-300 ${activeQuizPoint ? "blur-[1.5px] brightness-75" : ""}`}
                src={selectedLessonVideoUrl}
                playsInline
                preload="metadata"
                onClick={onTogglePlayback}
                onPlay={(event) => {
                  if (activeQuizPoint) {
                    event.currentTarget.pause();
                    return;
                  }
                  setIsPlaying(true);
                }}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={onTimeUpdate}
                onEnded={onVideoEnded}
                onLoadedMetadata={(event) => {
                  onVideoMetadataLoaded(event.currentTarget.duration);
                  setCurrentTime(event.currentTarget.currentTime);
                  setLastVideoTime(event.currentTarget.currentTime);
                }}
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.15),transparent_65%)] text-center text-white">
                <div className="mb-3 rounded-full border border-white/25 bg-white/10 p-4 backdrop-blur-sm">
                  <PlayCircle className="h-12 w-12 text-white" />
                </div>
                <p className="text-base font-medium">
                  Bài học chưa có video gắn kèm
                </p>
                <p className="mt-1 text-xs text-white/80">
                  Thời lượng bài: {currentLessonDurationLabel}
                </p>
              </div>
            )}

            <AnimatePresence>
              {activeQuizPoint ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97, y: 8 }}
                  className="absolute inset-0 z-45 flex items-center justify-center bg-black/50 p-3 backdrop-blur-[2px] sm:p-5"
                >
                  <div className="relative w-[92%] max-w-2xl rounded-3xl border border-white/15 bg-slate-950/78 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:p-6">
                    <div className="text-center">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
                        Kiem tra nhanh
                      </p>
                      <h3 className="mt-3 text-lg font-semibold leading-snug text-white sm:text-xl">
                        {activeQuizPoint.question}
                      </h3>
                    </div>

                    <div className="mt-5 space-y-3">
                      {activeQuizPoint.options.map((option, optionIndex) => {
                        const isSelected =
                          inVideoAnswers[activeQuizPoint.id] === optionIndex;
                        const submitted = Boolean(
                          inVideoSubmitted[activeQuizPoint.id],
                        );
                        const isCorrectAnswer =
                          submitted &&
                          activeQuizPoint.answerIndex === optionIndex;
                        const isWrongSelection =
                          submitted &&
                          isSelected &&
                          activeQuizPoint.answerIndex !== optionIndex;

                        let cardClasses =
                          "border-white/15 bg-white/5 text-white hover:border-white/35 hover:bg-white/10";
                        let indicatorClasses =
                          "border-white/25 bg-white/[0.02] text-white/75";

                        if (isCorrectAnswer) {
                          cardClasses =
                            "border-emerald-400/80 bg-emerald-500/16 text-emerald-100 shadow-[0_0_0_1px_rgba(52,211,153,0.18)]";
                          indicatorClasses =
                            "border-emerald-400 bg-emerald-400 text-black";
                        } else if (isWrongSelection) {
                          cardClasses =
                            "border-rose-400/80 bg-rose-500/16 text-rose-100 shadow-[0_0_0_1px_rgba(251,113,133,0.2)]";
                          indicatorClasses =
                            "border-rose-400 bg-rose-400 text-black";
                        } else if (isSelected && !submitted) {
                          cardClasses =
                            "border-amber-300 bg-amber-300/18 text-amber-50 shadow-[0_0_18px_rgba(252,211,77,0.16)]";
                          indicatorClasses =
                            "border-amber-300 bg-amber-300 text-black font-bold";
                        }

                        return (
                          <button
                            key={`${activeQuizPoint.id}-${optionIndex}`}
                            type="button"
                            disabled={
                              submitted ||
                              inVideoAnswers[activeQuizPoint.id] !== undefined
                            }
                            className={`flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all duration-200 ${cardClasses}`}
                            onClick={() =>
                              onSelectInVideoAnswer(
                                activeQuizPoint.id,
                                optionIndex,
                              )
                            }
                          >
                            <div
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm transition-colors ${indicatorClasses}`}
                            >
                              {String.fromCharCode(65 + optionIndex)}
                            </div>
                            <span className="flex-1 text-sm font-medium sm:text-base">
                              {option}
                            </span>
                            {isCorrectAnswer ? (
                              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                            ) : null}
                            {isWrongSelection ? (
                              <XCircle className="h-5 w-5 text-rose-400" />
                            ) : null}
                          </button>
                        );
                      })}
                    </div>

                    {inVideoSubmitted[activeQuizPoint.id] ? (
                      <div
                        className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
                          inVideoScore
                            ? "border-emerald-400/40 bg-emerald-500/12 text-emerald-100"
                            : "border-rose-400/40 bg-rose-500/12 text-rose-100"
                        }`}
                      >
                        {inVideoScore ? (
                          <p className="font-medium">Bạn làm đúng.</p>
                        ) : (
                          <p className="font-medium">
                            Sai rồi. Đáp án đúng là:{" "}
                            {activeQuizPoint.answerIndex !== null
                              ? activeQuizPoint.options[
                                  activeQuizPoint.answerIndex
                                ]
                              : "chưa có đáp án đúng"}
                          </p>
                        )}
                      </div>
                    ) : null}

                    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                      <div className="flex items-center gap-2 text-xs text-white/75">
                        <CircleHelp className="h-3.5 w-3.5 text-white/70" />
                        Chon dap an de tiep tuc video
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
                          {inVideoSubmitted[activeQuizPoint.id]
                            ? "Đã ghi nhận"
                            : "Kiểm tra đáp án"}
                        </Button>
                        {inVideoScore !== null ? (
                          <span
                            className={`flex items-center gap-1 text-xs ${inVideoScore ? "text-emerald-300" : "text-rose-300"}`}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {inVideoScore ? "Đúng" : "Sai, thử lại nhé"}
                          </span>
                        ) : null}
                      </div>
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
                  className="absolute inset-0 z-46 flex items-center justify-center bg-black/50 p-3 backdrop-blur-[2px] sm:p-5"
                >
                  <div className="relative w-[92%] max-w-2xl rounded-3xl border border-white/15 bg-slate-950/78 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:p-6">
                    <div className="text-center">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
                        Kiem tra nhanh
                      </p>
                      <h3 className="mt-3 text-lg font-semibold leading-snug text-white sm:text-xl">
                        Quiz sau bài học
                      </h3>
                    </div>

                    <div className="mt-5 max-h-[60vh] space-y-3 overflow-y-auto pr-1">
                      {afterLessonQuiz.length ? (
                        <>
                          {afterLessonQuiz.map((question, questionIndex) => (
                            <div
                              key={question.id}
                              className="rounded-2xl border border-white/12 bg-white/5 p-3 text-white"
                            >
                              <p className="mb-2 text-sm font-medium text-white">
                                Câu {questionIndex + 1}: {question.question}
                              </p>
                              <div className="mt-4 space-y-3">
                                {question.options.map((option, optionIndex) => {
                                  const isSelected =
                                    afterLessonAnswers[question.id] ===
                                    optionIndex;
                                  const isCorrectAnswer =
                                    afterLessonSubmitted &&
                                    question.answerIndex === optionIndex;
                                  const isWrongSelection =
                                    afterLessonSubmitted &&
                                    isSelected &&
                                    question.answerIndex !== optionIndex;

                                  let cardClasses =
                                    "border-white/15 bg-white/5 text-white hover:border-white/35 hover:bg-white/10";
                                  let indicatorClasses =
                                    "border-white/25 bg-white/[0.02] text-white/75";

                                  if (isCorrectAnswer) {
                                    cardClasses =
                                      "border-emerald-400/80 bg-emerald-500/16 text-emerald-100 shadow-[0_0_0_1px_rgba(52,211,153,0.18)]";
                                    indicatorClasses =
                                      "border-emerald-400 bg-emerald-400 text-black";
                                  } else if (isWrongSelection) {
                                    cardClasses =
                                      "border-rose-400/80 bg-rose-500/16 text-rose-100 shadow-[0_0_0_1px_rgba(251,113,133,0.2)]";
                                    indicatorClasses =
                                      "border-rose-400 bg-rose-400 text-black";
                                  } else if (
                                    isSelected &&
                                    !afterLessonSubmitted
                                  ) {
                                    cardClasses =
                                      "border-amber-300 bg-amber-300/18 text-amber-50 shadow-[0_0_18px_rgba(252,211,77,0.16)]";
                                    indicatorClasses =
                                      "border-amber-300 bg-amber-300 text-black font-bold";
                                  }

                                  return (
                                    <button
                                      key={`${question.id}-${optionIndex}`}
                                      type="button"
                                      disabled={afterLessonSubmitted}
                                      className={`flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all duration-200 ${cardClasses}`}
                                      onClick={() =>
                                        onSelectAfterLessonAnswer(
                                          question.id,
                                          optionIndex,
                                        )
                                      }
                                    >
                                      <div
                                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm transition-colors ${indicatorClasses}`}
                                      >
                                        {String.fromCharCode(65 + optionIndex)}
                                      </div>
                                      <span className="flex-1 text-base font-medium">
                                        {option}
                                      </span>
                                      {isCorrectAnswer ? (
                                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                                      ) : null}
                                      {isWrongSelection ? (
                                        <XCircle className="h-6 w-6 text-red-500" />
                                      ) : null}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}

                          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                            <div className="flex items-center gap-2 text-xs text-white/75">
                              <CircleHelp className="h-3.5 w-3.5 text-white/70" />
                              Chon dap an de tiep tuc
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
                                  className={`flex items-center gap-1 text-xs ${afterLessonScore.percent >= 70 ? "text-emerald-300" : "text-rose-300"}`}
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  {afterLessonScore.correct}/
                                  {afterLessonScore.total} câu đúng (
                                  {afterLessonScore.percent}%)
                                </span>
                              ) : null}
                            </div>
                          </div>

                          {afterLessonScore && afterLessonPassed ? (
                            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-white">
                              <p className="font-semibold text-emerald-300">
                                Hoàn thành rất tốt
                              </p>
                              <p className="mt-1 text-xs text-emerald-200/90">
                                {hasNextLesson
                                  ? `Tự chuyển sang bài tiếp theo sau ${nextLessonCountdown ?? 5}s.`
                                  : "Bạn đã hoàn thành bài cuối của khóa."}
                              </p>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <Button
                                  size="sm"
                                  className="bg-emerald-400 text-black hover:bg-emerald-300"
                                  onClick={onAdvanceToNextLesson}
                                >
                                  {hasNextLesson
                                    ? "Học bài tiếp theo ngay"
                                    : "Ôn lại bài đầu tiên"}
                                </Button>
                                <span className="text-xs text-emerald-200/80">
                                  {nextLessonTitle ??
                                    "Đây là bài cuối của khóa học"}
                                </span>
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

            <AnimatePresence>
              {isTransitioningNext && nextLessonTitle ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 text-white backdrop-blur-sm"
                >
                  <Sparkles className="mb-4 h-12 w-12 animate-pulse text-primary" />
                  <h3 className="mb-1 text-xl font-semibold">Đã hoàn thành!</h3>
                  <p className="flex items-center gap-2 text-sm text-white/85">
                    Đang chuyển sang:
                    <span className="font-medium text-white">
                      {nextLessonTitle}
                    </span>
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  </p>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <div
              className={`absolute inset-x-2 bottom-2 z-20 rounded-lg border border-white/20 bg-black/60 px-2 py-2 opacity-95 backdrop-blur-sm sm:inset-x-3 sm:bottom-3 sm:px-2.5 ${playerBlocked ? "pointer-events-none opacity-40" : ""}`}
            >
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onTogglePlayback}
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/30 bg-black/35 text-white hover:bg-black/55"
                  aria-label={isPlaying ? "Pause video" : "Play video"}
                >
                  {isPlaying ? (
                    <Pause className="h-3.5 w-3.5" />
                  ) : (
                    <Play className="ml-0.5 h-3.5 w-3.5" />
                  )}
                </button>

                <span className="w-12 shrink-0 text-[11px] text-white/90">
                  {formatTime(currentTime)}
                </span>

                <div
                  className="group relative flex-1 cursor-pointer"
                  onClick={onOverlayScrubClick}
                >
                  <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-white/25">
                    <div
                      className="h-full bg-primary transition-[width] duration-200 ease-out"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <input
                    type="range"
                    min={0}
                    max={selectedLessonDuration}
                    step={0.01}
                    value={Math.min(
                      selectedLessonDuration,
                      Math.max(0, currentTime),
                    )}
                    onChange={(event) => {
                      event.stopPropagation();
                      onSeekChange(Number(event.target.value));
                    }}
                    className="relative z-10 h-4 w-full appearance-none bg-transparent"
                  />

                  {inVideoQuizPoints.map((point) => {
                    const left = `${(point.timestamp / Math.max(1, selectedLessonDuration)) * 100}%`;
                    const solved = isQuizSolved(point);

                    return (
                      <Tooltip key={`overlay-${point.id}`}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className={`absolute top-1/2 z-20 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/80 transition-transform hover:scale-125 ${solved ? "bg-primary" : "bg-accent"}`}
                            style={{ left }}
                            onClick={(clickEvent) => {
                              clickEvent.stopPropagation();
                              onJumpToQuizPoint(point);
                            }}
                            aria-label={`Đi tới quiz tại ${formatTime(point.timestamp)}`}
                          />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          {solved ? "Đã trả lời" : "Câu hỏi tương tác"}
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>

                <span className="w-12 shrink-0 text-right text-[11px] text-white/90">
                  {formatTime(selectedLessonDuration)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
