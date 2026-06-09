import { useEffect, useRef, useState, type MouseEvent, type RefObject, type SyntheticEvent } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { InVideoQuizPoint, type AfterLessonQuizQuestion } from "../utils";

import { LessonVideoPlayer } from "./LessonVideoCard/LessonVideoPlayer";
import { LessonVideoTimeline } from "./LessonVideoCard/LessonVideoTimeline";
import { LessonVideoControls } from "./LessonVideoCard/LessonVideoControls";
import { LessonVideoQuizOverlay } from "./LessonVideoCard/LessonVideoQuizOverlay";
import { LessonVideoUpNextOverlay } from "./LessonVideoCard/LessonVideoUpNextOverlay";

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

  const clearAutoHide = () => {
    if (autoHideTimeoutRef.current) {
      window.clearTimeout(autoHideTimeoutRef.current as number);
      autoHideTimeoutRef.current = null;
    }
  };

  const scheduleAutoHide = () => {
    clearAutoHide();
    autoHideTimeoutRef.current = window.setTimeout(() => {
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
        <div className="overflow-hidden rounded-[1.75rem] border border-border/60 bg-black p-2 shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
          <div
            className="relative aspect-video overflow-hidden rounded-[1.35rem] border border-white/5 bg-black"
            onMouseMove={() => {
              setControlsVisible(true);
              scheduleAutoHide();
            }}
            onMouseEnter={() => {
              setControlsVisible(true);
              scheduleAutoHide();
            }}
            onMouseLeave={() => {
              scheduleAutoHide();
            }}
          >
            {/* Core Video Player */}
            <LessonVideoPlayer
              ref={videoRef}
              selectedLessonVideoUrl={selectedLessonVideoUrl}
              activeQuizPoint={activeQuizPoint}
              isPlaying={isPlaying}
              playerBlocked={playerBlocked}
              currentLessonDurationLabel={currentLessonDurationLabel}
              onTogglePlayback={onTogglePlayback}
              onVideoKeyDown={onVideoKeyDown}
              onTimeUpdate={onTimeUpdate}
              onVideoEnded={onVideoEnded}
              onVideoMetadataLoaded={onVideoMetadataLoaded}
              setIsPlaying={setIsPlaying}
              setCurrentTime={setCurrentTime}
              setLastVideoTime={setLastVideoTime}
            />

            {/* Quiz overlays (in-video and after-lesson) */}
            <LessonVideoQuizOverlay
              activeQuizPoint={activeQuizPoint}
              inVideoAnswers={inVideoAnswers}
              inVideoSubmitted={inVideoSubmitted}
              inVideoScore={inVideoScore}
              onSelectInVideoAnswer={onSelectInVideoAnswer}
              onSubmitInVideoQuiz={onSubmitInVideoQuiz}
              showAfterLessonOverlay={showAfterLessonOverlay}
              afterLessonQuiz={afterLessonQuiz}
              afterLessonAnswers={afterLessonAnswers}
              afterLessonSubmitted={afterLessonSubmitted}
              afterLessonScore={afterLessonScore}
              afterLessonPassed={afterLessonPassed}
              hasNextLesson={hasNextLesson}
              nextLessonCountdown={nextLessonCountdown}
              nextLessonTitle={nextLessonTitle}
              onSelectAfterLessonAnswer={onSelectAfterLessonAnswer}
              onSubmitAfterLessonQuiz={onSubmitAfterLessonQuiz}
              onAdvanceToNextLesson={onAdvanceToNextLesson}
            />

            {/* Transition & Up Next Overlays */}
            <LessonVideoUpNextOverlay
              showUpNextOverlay={showUpNextOverlay}
              nextLessonTitle={nextLessonTitle}
              selectedLessonDuration={selectedLessonDuration}
              currentTime={currentTime}
              onAdvanceToNextLesson={onAdvanceToNextLesson}
              isTransitioningNext={isTransitioningNext}
            />

            {/* Bottom Controls Bar */}
            <div
              className={`absolute inset-x-0 bottom-0 z-20 bg-linear-to-t from-black/95 via-black/65 to-transparent px-4 pb-4 pt-12 transition-opacity duration-300 sm:px-5 sm:pb-5 ${
                playerBlocked
                  ? "pointer-events-none opacity-40"
                  : controlsVisible
                    ? "opacity-100"
                    : "opacity-0 pointer-events-none"
              }`}
            >
              <LessonVideoTimeline
                currentTime={currentTime}
                selectedLessonDuration={selectedLessonDuration}
                progressPercent={progressPercent}
                inVideoQuizPoints={inVideoQuizPoints}
                isQuizSolved={isQuizSolved}
                onSeekChange={onSeekChange}
                onJumpToQuizPoint={onJumpToQuizPoint}
                onOverlayScrubClick={onOverlayScrubClick}
              />

              <LessonVideoControls
                isPlaying={isPlaying}
                isMuted={isMuted}
                volume={volume}
                currentTime={currentTime}
                selectedLessonDuration={selectedLessonDuration}
                playbackRate={playbackRate}
                isFullscreen={isFullscreen}
                onTogglePlayback={onTogglePlayback}
                onToggleMute={onToggleMute}
                onVolumeChange={onVolumeChange}
                onSetPlaybackRate={onSetPlaybackRate}
                onToggleFullscreen={onToggleFullscreen}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
