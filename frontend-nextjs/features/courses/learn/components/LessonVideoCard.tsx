import { useEffect, useRef, useState, type MouseEvent, type RefObject, type SyntheticEvent } from "react";
import { InVideoQuizPoint, type AfterLessonQuizQuestion } from "../utils";
import type { QuizAnswerExplanation } from "../hooks/useCourseLearnPlayer";

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
  inVideoCorrectAnswers: Record<string, number>;
  inVideoExplanations: Record<string, QuizAnswerExplanation>;
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
  hasNextLesson: boolean;
  nextLessonCountdown: number | null;
  isTransitioningNext: boolean;
  nextLessonTitle?: string;
  showAfterLessonOverlay: boolean;
  playbackRate: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  setIsFullscreen?: (isFullscreen: boolean) => void;
  videoRef: RefObject<HTMLVideoElement | null>;
  isQuizSolved: (point: InVideoQuizPoint) => boolean;
  qualityLevels: { id: number; name: string }[];
  currentQualityLevel: number;
  onQualityLevelsLoaded: (levels: { id: number; name: string }[]) => void;
  onSetQualityLevel: (levelId: number) => void;
  onTogglePlayback: () => void;
  onSetPlaybackRate: (rate: number) => void;
  onToggleMute: () => void;
  onVolumeChange: (vol: number) => void;
  onToggleFullscreen: () => void;
  onTogglePictureInPicture: () => void;
  onVideoKeyDown: (event: React.KeyboardEvent<HTMLVideoElement>) => void;
  onTimeUpdate: (event: SyntheticEvent<HTMLVideoElement>) => void;
  onVideoEnded: () => void;
  onVideoPause: (event: SyntheticEvent<HTMLVideoElement>) => void;
  onVideoMetadataLoaded: (duration: number, aspectRatio?: number) => void;
  videoAspectRatio?: number | null;
  onSelectInVideoAnswer: (quizPointId: string, optionIndex: number) => void;
  onSelectAfterLessonAnswer: (questionId: string, optionIndex: number) => void;
  onSubmitAfterLessonQuiz: () => void;
  onContinueAfterInVideoQuiz: () => void;
  onAdvanceToNextLesson: () => void;
  onRetryAfterLessonQuiz: () => void;
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
  inVideoCorrectAnswers,
  inVideoExplanations,
  afterLessonQuiz,
  afterLessonAnswers,
  afterLessonSubmitted,
  afterLessonScore,
  afterLessonPassed,
  afterLessonCorrectAnswers,
  afterLessonExplanations,
  hasNextLesson,
  nextLessonCountdown,
  isTransitioningNext,
  nextLessonTitle,
  showAfterLessonOverlay,
  playbackRate,
  volume,
  isMuted,
  isFullscreen,
  setIsFullscreen,
  videoRef,
  isQuizSolved,
  qualityLevels,
  currentQualityLevel,
  onQualityLevelsLoaded,
  onSetQualityLevel,
  onTogglePlayback,
  onSetPlaybackRate,
  onToggleMute,
  onVolumeChange,
  onToggleFullscreen,
  onTogglePictureInPicture,
  onVideoKeyDown,
  onTimeUpdate,
  onVideoEnded,
  onVideoPause,
  onVideoMetadataLoaded,
  onSelectInVideoAnswer,
  onSelectAfterLessonAnswer,
  onSubmitAfterLessonQuiz,
  onContinueAfterInVideoQuiz,
  onAdvanceToNextLesson,
  onRetryAfterLessonQuiz,
  onSubmitInVideoQuiz,
  onJumpToQuizPoint,
  onOverlayScrubClick,
  onSeekChange,
  setIsPlaying,
  setCurrentTime,
  setLastVideoTime,
  videoAspectRatio,
}: Props) {
  const playerBlocked = Boolean(activeQuizPoint) || showAfterLessonOverlay;
  const [controlsVisible, setControlsVisible] = useState(true);
  const [dismissedUpNextKey, setDismissedUpNextKey] = useState<string | null>(
    null,
  );
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

  const upNextKey = `${nextLessonTitle ?? ""}:${selectedLessonDuration}`;
  const remainingForUpNext = selectedLessonDuration - currentTime;
  const showUpNextOverlay =
    hasNextLesson &&
    remainingForUpNext <= 10 &&
    remainingForUpNext > 0 &&
    !isTransitioningNext &&
    !showAfterLessonOverlay &&
    dismissedUpNextKey !== upNextKey;

  return (
    <div
      className={`relative overflow-hidden bg-black shadow-[0_16px_48px_rgba(15,23,42,0.15)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.4)] ${
        isFullscreen
          ? "fullscreen-active w-full h-full border-0 rounded-none"
          : "rounded-2xl border border-border/40"
      }`}
      style={{ aspectRatio: isFullscreen ? undefined : (videoAspectRatio || 16/9) }}
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
      <div className="w-full h-full relative video-player-inner">
        {/* Core Video Player */}
        <LessonVideoPlayer
          ref={videoRef}
          selectedLessonVideoUrl={selectedLessonVideoUrl}
          activeQuizPoint={activeQuizPoint}
          isPlaying={isPlaying}
          playerBlocked={playerBlocked}
          currentLessonDurationLabel={currentLessonDurationLabel}
          currentQualityLevel={currentQualityLevel}
          onQualityLevelsLoaded={onQualityLevelsLoaded}
          onTogglePlayback={onTogglePlayback}
          onVideoKeyDown={onVideoKeyDown}
          onTimeUpdate={onTimeUpdate}
          onVideoEnded={onVideoEnded}
          onVideoPause={onVideoPause}
          onVideoMetadataLoaded={onVideoMetadataLoaded}
          setIsPlaying={setIsPlaying}
          setCurrentTime={setCurrentTime}
          setLastVideoTime={setLastVideoTime}
          setIsFullscreen={setIsFullscreen}
        />

      {/* Quiz overlays (in-video and after-lesson) */}
      <LessonVideoQuizOverlay
        activeQuizPoint={activeQuizPoint}
        inVideoAnswers={inVideoAnswers}
        inVideoSubmitted={inVideoSubmitted}
        inVideoScore={inVideoScore}
        inVideoCorrectAnswers={inVideoCorrectAnswers}
        inVideoExplanations={inVideoExplanations}
        onSelectInVideoAnswer={onSelectInVideoAnswer}
        onSubmitInVideoQuiz={onSubmitInVideoQuiz}
        onContinueAfterInVideoQuiz={onContinueAfterInVideoQuiz}
        showAfterLessonOverlay={showAfterLessonOverlay}
        afterLessonQuiz={afterLessonQuiz}
        afterLessonAnswers={afterLessonAnswers}
        afterLessonSubmitted={afterLessonSubmitted}
        afterLessonScore={afterLessonScore}
        afterLessonPassed={afterLessonPassed}
        afterLessonCorrectAnswers={afterLessonCorrectAnswers}
        afterLessonExplanations={afterLessonExplanations}
        videoUrl={selectedLessonVideoUrl}
        hasNextLesson={hasNextLesson}
        nextLessonCountdown={nextLessonCountdown}
        nextLessonTitle={nextLessonTitle}
        onSelectAfterLessonAnswer={onSelectAfterLessonAnswer}
        onSubmitAfterLessonQuiz={onSubmitAfterLessonQuiz}
        onAdvanceToNextLesson={onAdvanceToNextLesson}
        onRetryAfterLessonQuiz={onRetryAfterLessonQuiz}
      />

      {/* Transition & Up Next Overlays */}
      <LessonVideoUpNextOverlay
        showUpNextOverlay={showUpNextOverlay}
        nextLessonTitle={nextLessonTitle}
        selectedLessonDuration={selectedLessonDuration}
        currentTime={currentTime}
        onAdvanceToNextLesson={onAdvanceToNextLesson}
        onDismissUpNext={() => setDismissedUpNextKey(upNextKey)}
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
          qualityLevels={qualityLevels}
          currentQualityLevel={currentQualityLevel}
          onSetQualityLevel={onSetQualityLevel}
          onTogglePlayback={onTogglePlayback}
          onToggleMute={onToggleMute}
          onVolumeChange={onVolumeChange}
          onSetPlaybackRate={onSetPlaybackRate}
          onToggleFullscreen={onToggleFullscreen}
          onTogglePictureInPicture={onTogglePictureInPicture}
        />
      </div>
      </div>
    </div>
  );
}
