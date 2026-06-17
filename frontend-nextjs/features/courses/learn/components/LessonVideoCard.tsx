import { useEffect, useRef, useState, type MouseEvent, type RefObject, type SyntheticEvent } from "react";
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
  onVideoMetadataLoaded: (duration: number, aspectRatio?: number) => void;
  videoAspectRatio?: number | null;
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
  videoAspectRatio,
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
    <div
      className="relative overflow-hidden rounded-2xl border border-border/40 bg-black shadow-[0_16px_48px_rgba(15,23,42,0.15)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.4)]"
      style={{ aspectRatio: videoAspectRatio || 16/9 }}
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
        currentQualityLevel={currentQualityLevel}
        onQualityLevelsLoaded={onQualityLevelsLoaded}
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
  );
}
