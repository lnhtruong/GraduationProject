import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  CircleHelp,
  Loader2,
  Maximize,
  Minimize,
  Pause,
  Play,
  PlayCircle,
  Rewind,
  FastForward,
  Volume2,
  VolumeX,
  Sparkles,
  XCircle,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type RefObject,
  type SyntheticEvent,
} from "react";
import {
  formatTime,
  InVideoQuizPoint,
  type AfterLessonQuizQuestion,
} from "../utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

interface Props {
  lessonTitle?: string;
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
  playbackRate: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  videoRef: RefObject<HTMLVideoElement | null>;
  isQuizSolved: (point: InVideoQuizPoint) => boolean;
  onTogglePlayback: () => void;
  onSetPlaybackRate: (rate: number) => void;
  onToggleMute: () => void;
  onVolumeChange: (vol: number) => void;
  onToggleFullscreen: () => void;
  onVideoKeyDown: (event: React.KeyboardEvent<HTMLVideoElement>) => void;
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
  lessonTitle,
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
  playbackRate,
  volume,
  isMuted,
  isFullscreen,
  videoRef,
  isQuizSolved,
  onTogglePlayback,
  onSetPlaybackRate,
  onToggleMute,
  onVolumeChange,
  onToggleFullscreen,
  onVideoKeyDown,
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
  const [controlsVisible, setControlsVisible] = useState(true);
  const autoHideTimeoutRef = useRef<number | null>(null);

  const [hoverPreviewTime, setHoverPreviewTime] = useState<number | null>(null);
  const [hoverPreviewPercent, setHoverPreviewPercent] = useState<number>(0);

  // derive Up Next overlay visibility from current playback state to avoid effect-driven state updates

  const clearAutoHide = () => {
    if (autoHideTimeoutRef.current) {
      window.clearTimeout(autoHideTimeoutRef.current as number);
      autoHideTimeoutRef.current = null;
    }
  };

  const scheduleAutoHide = () => {
    clearAutoHide();
    autoHideTimeoutRef.current = window.setTimeout(() => {
      // only hide when video is playing
      if (videoRef?.current && !videoRef.current.paused) {
        setControlsVisible(false);
      }
    }, 2500);
  };

  useEffect(() => {
    return () => clearAutoHide();
  }, []);

  const remainingForUpNext = selectedLessonDuration - currentTime;
  const showUpNextOverlay =
    hasNextLesson &&
    remainingForUpNext <= 10 &&
    remainingForUpNext > 0 &&
    !isTransitioningNext &&
    !showAfterLessonOverlay;

  return (
    <Card className="overflow-hidden border-border/60 bg-card/95 shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
      <CardContent className="space-y-4 p-3 sm:p-4 lg:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3 rounded-[1.75rem] border border-border/60 bg-background/80 px-4 py-3 shadow-sm backdrop-blur-sm">
          <div className="min-w-0 space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Player
            </p>
            <h2 className="line-clamp-2 text-base font-semibold leading-snug text-foreground sm:text-lg">
              {lessonTitle ?? "Bài học video"}
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-full border border-border/70 bg-muted/50 px-3 py-1">
              {currentLessonDurationLabel}
            </span>
            <span className="rounded-full border border-border/70 bg-muted/50 px-3 py-1">
              {playbackRate}x
            </span>
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.75rem] border border-border/60 bg-black p-2 shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
          <div
            className="relative aspect-video overflow-hidden rounded-[1.35rem] border border-white/5 bg-black"
            onMouseMove={(e) => {
              setControlsVisible(true);
              scheduleAutoHide();
              // hover preview on progress bar calculation relative to container
              const target = e.currentTarget as HTMLDivElement;
              const rect = target.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const pct = Math.max(0, Math.min(1, x / rect.width));
              setHoverPreviewPercent(pct);
              setHoverPreviewTime(pct * selectedLessonDuration);
            }}
            onMouseEnter={() => {
              setControlsVisible(true);
              scheduleAutoHide();
            }}
            onMouseLeave={() => {
              setHoverPreviewTime(null);
              scheduleAutoHide();
            }}
          >
            {selectedLessonVideoUrl ? (
              <video
                ref={videoRef}
                className={`h-full w-full cursor-pointer object-contain transition duration-300 ${activeQuizPoint ? "blur-[1.5px] brightness-75" : ""}`}
                src={selectedLessonVideoUrl}
                playsInline
                preload="metadata"
                onClick={onTogglePlayback}
                tabIndex={0}
                onKeyDown={onVideoKeyDown}
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
              <div className="flex h-full w-full flex-col items-center justify-center bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_65%)] text-center text-white">
                <div className="mb-3 rounded-full border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
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

            {!playerBlocked ? (
              <button
                type="button"
                onClick={onTogglePlayback}
                className={`absolute inset-0 z-15 flex items-center justify-center transition-opacity duration-300 ${isPlaying ? "opacity-0" : "opacity-100"}`}
                aria-label={isPlaying ? "Tạm dừng video" : "Phát video"}
              >
                <span className="flex h-20 w-20 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-md transition-transform hover:scale-105">
                  {isPlaying ? (
                    <Pause className="h-9 w-9" />
                  ) : (
                    <Play className="ml-1 h-9 w-9" />
                  )}
                </span>
              </button>
            ) : null}

            <div className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-full border border-white/10 bg-black/50 px-3 py-1.5 text-[11px] text-white/85 backdrop-blur-md">
              <span
                className={`h-2 w-2 rounded-full ${isPlaying ? "bg-emerald-400" : "bg-amber-300"}`}
              />
              {isPlaying ? "Đang phát" : "Đang tạm dừng"}
            </div>

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

            <AnimatePresence>
              {showUpNextOverlay && nextLessonTitle ? (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  className="absolute bottom-16 right-6 z-50 w-65 rounded-xl border border-white/10 bg-black/70 p-3 text-white backdrop-blur-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-20 shrink-0 rounded-md bg-white/6" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        Tiếp theo: {nextLessonTitle}
                      </p>
                      <p className="mt-1 text-xs text-white/70">
                        Bắt đầu sau{" "}
                        {Math.max(
                          0,
                          Math.ceil(selectedLessonDuration - currentTime),
                        )}
                        s
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-end">
                    <Button
                      size="sm"
                      onClick={onAdvanceToNextLesson}
                      className="bg-white/10 text-white"
                    >
                      Chuyển ngay
                    </Button>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <div className="pointer-events-none absolute left-4 top-4 z-10 hidden max-w-[70%] rounded-full border border-white/10 bg-black/45 px-3 py-1.5 text-[11px] text-white/80 shadow-lg backdrop-blur-md sm:block">
              Phím tắt: Space để phát/tạm dừng, ←/→ để tua, M để tắt âm, F để
              toàn màn hình
            </div>

            <div
              className={`absolute inset-x-0 bottom-0 z-20 bg-linear-to-t from-black/95 via-black/65 to-transparent px-4 pb-4 pt-12 transition-opacity duration-300 sm:px-5 sm:pb-5 ${playerBlocked ? "pointer-events-none opacity-40" : controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            >
              <div className="mb-3 flex items-center justify-between text-[11px] text-white/75">
                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/8 px-2.5 py-1 backdrop-blur-md">
                  <Rewind className="h-3 w-3" />
                  -10s
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/8 px-2.5 py-1 backdrop-blur-md">
                  <FastForward className="h-3 w-3" />
                  +10s
                </span>
              </div>

              <div
                className="group relative mb-3 flex h-4 w-full cursor-pointer items-center"
                onClick={onOverlayScrubClick}
                onMouseMove={(e) => {
                  // position preview relative to progress bar specifically
                  const target = e.currentTarget as HTMLDivElement;
                  const rect = target.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const pct = Math.max(0, Math.min(1, x / rect.width));
                  setHoverPreviewPercent(pct);
                  setHoverPreviewTime(pct * selectedLessonDuration);
                }}
                onMouseLeave={() => setHoverPreviewTime(null)}
              >
                <div className="absolute inset-x-0 h-1.5 overflow-hidden rounded-full bg-white/25">
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
                  className="relative z-10 h-4 w-full cursor-pointer appearance-none bg-transparent opacity-0"
                />

                {inVideoQuizPoints.map((point) => {
                  const left = `${(point.timestamp / Math.max(1, selectedLessonDuration)) * 100}%`;
                  const solved = isQuizSolved(point);

                  return (
                    <Tooltip key={`overlay-${point.id}`}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className={`absolute top-1/2 z-20 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-black/80 transition-transform hover:scale-150 ${solved ? "bg-primary" : "bg-amber-400"}`}
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

                {/* Hover preview tooltip (time only / placeholder) */}
                {hoverPreviewTime !== null ? (
                  <div
                    className="absolute z-30 -top-7 w-max -translate-x-1/2 rounded-xs bg-black/85 px-2 py-1 text-xs text-white shadow-lg"
                    style={{ left: `${hoverPreviewPercent * 100}%` }}
                  >
                    {formatTime(
                      Math.max(
                        0,
                        Math.min(selectedLessonDuration, hoverPreviewTime),
                      ),
                    )}
                  </div>
                ) : null}
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={onTogglePlayback}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white shadow-[0_10px_30px_rgba(0,0,0,0.25)] transition-all hover:bg-white/15 hover:scale-[1.02]"
                    aria-label={isPlaying ? "Pause video" : "Play video"}
                  >
                    {isPlaying ? (
                      <Pause className="h-5 w-5" />
                    ) : (
                      <Play className="ml-0.5 h-5 w-5" />
                    )}
                  </button>

                  <div className="group flex items-center">
                    <button
                      type="button"
                      onClick={onToggleMute}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition-all hover:bg-white/15"
                      aria-label={
                        isMuted || volume === 0
                          ? "Bật âm lượng"
                          : "Tắt âm lượng"
                      }
                      title="Âm lượng"
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="h-4.5 w-4.5" />
                      ) : (
                        <Volume2 className="h-4.5 w-4.5" />
                      )}
                    </button>

                    <div className="w-0 overflow-hidden opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:w-18 group-hover:opacity-100 sm:group-hover:w-24">
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={isMuted ? 0 : volume}
                        onChange={(event) =>
                          onVolumeChange(Number(event.target.value))
                        }
                        className="h-1 w-full cursor-pointer accent-primary"
                        aria-label="Âm lượng"
                      />
                    </div>
                  </div>

                  <div className="min-w-0 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-[13px] font-medium text-white/90 backdrop-blur-md">
                    {formatTime(currentTime)}
                    <span className="mx-1.5 text-white/40">/</span>
                    {formatTime(selectedLessonDuration)}
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  <Select
                    value={String(playbackRate)}
                    onValueChange={(value) => onSetPlaybackRate(Number(value))}
                  >
                    <SelectTrigger
                      className="h-8 w-17 border border-white/20 bg-black/45 px-2 text-[13px] font-semibold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_8px_20px_rgba(0,0,0,0.25)] transition-all hover:border-white/35 hover:bg-black/60 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_10px_24px_rgba(0,0,0,0.32)] focus:border-white/40 focus:ring-0 focus:ring-offset-0"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <SelectValue placeholder="1x" />
                    </SelectTrigger>
                    <SelectContent
                      align="end"
                      side="top"
                      sideOffset={12}
                      className="border-white/10 bg-black/90 text-white backdrop-blur-md"
                    >
                      {PLAYBACK_RATES.map((rate) => (
                        <SelectItem
                          key={rate}
                          value={String(rate)}
                          className="focus:bg-white/20 focus:text-white"
                        >
                          {rate}x
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <button
                    type="button"
                    onClick={onToggleFullscreen}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition-all hover:bg-white/15"
                    aria-label="Toàn màn hình"
                    title="Toàn màn hình"
                  >
                    {isFullscreen ? (
                      <Minimize className="h-4.5 w-4.5" />
                    ) : (
                      <Maximize className="h-4.5 w-4.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
