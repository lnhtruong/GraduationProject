import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type KeyboardEvent,
  type SyntheticEvent,
} from "react";
import type { InstructorLesson } from "../../../instructor/course-management/types";
import {
  buildConfettiPieces,
  type AfterLessonQuizQuestion,
  type ConfettiPiece,
  type InVideoQuizPoint,
} from "../utils";

interface Props {
  selectedLesson?: InstructorLesson;
  selectedLessonDuration: number;
  inVideoQuizPoints: InVideoQuizPoint[];
  afterLessonQuiz: AfterLessonQuizQuestion[];
  nextLesson: InstructorLesson | null;
  lessons: InstructorLesson[];
  onSelectLesson: (lessonId: number) => void;
  onMarkLessonCompleted: (
    lessonId: number,
    lessonProgressId?: number | null,
  ) => void;
  selectedLessonProgressId?: number | null;
}

export function useCourseLearnPlayer({
  selectedLesson,
  selectedLessonDuration,
  inVideoQuizPoints,
  afterLessonQuiz,
  nextLesson,
  lessons,
  onSelectLesson,
  onMarkLessonCompleted,
  selectedLessonProgressId,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const transitionTimeoutRef = useRef<number | null>(null);
  const inVideoQuizResolveTimeoutRef = useRef<number | null>(null);

  const [currentTime, setCurrentTime] = useState(0);
  const [lastVideoTime, setLastVideoTime] = useState(0);
  const [activeQuizPointId, setActiveQuizPointId] = useState<string | null>(
    null,
  );
  const [inVideoAnswers, setInVideoAnswers] = useState<Record<string, number>>(
    {},
  );
  const [inVideoSubmitted, setInVideoSubmitted] = useState<
    Record<string, boolean>
  >({});
  const [afterLessonAnswers, setAfterLessonAnswers] = useState<
    Record<string, number>
  >({});
  const [afterLessonSubmitted, setAfterLessonSubmitted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoDuration, setVideoDuration] = useState(selectedLessonDuration);
  const [confettiPieces, setConfettiPieces] = useState<ConfettiPiece[]>([]);
  const [nextLessonCountdown, setNextLessonCountdown] = useState<number | null>(
    null,
  );
  const [celebrationArmed, setCelebrationArmed] = useState(false);
  const [isTransitioningNext, setIsTransitioningNext] = useState(false);
  const [showAfterLessonOverlay, setShowAfterLessonOverlay] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const lastVolumeRef = useRef(1);

  const activeQuizPoint = useMemo(
    () =>
      inVideoQuizPoints.find((item) => item.id === activeQuizPointId) ?? null,
    [activeQuizPointId, inVideoQuizPoints],
  );

  const effectiveDuration =
    videoDuration > 0 ? videoDuration : selectedLessonDuration;

  const seekVideoTo = useCallback(
    (nextTime: number, shouldPause = false) => {
      const clampedTime = Math.max(0, Math.min(effectiveDuration, nextTime));
      const video = videoRef.current;

      if (video) {
        video.currentTime = clampedTime;
        if (shouldPause) {
          video.pause();
        }
      }

      setCurrentTime(clampedTime);
      setLastVideoTime(clampedTime);
    },
    [effectiveDuration],
  );

  const isQuizSolved = useCallback(
    (point: InVideoQuizPoint) => {
      return Boolean(inVideoSubmitted[point.id]);
    },
    [inVideoSubmitted],
  );

  const progressPercent =
    effectiveDuration > 0
      ? Math.min(100, Math.max(0, (currentTime / effectiveDuration) * 100))
      : 0;

  const afterLessonScore = useMemo(() => {
    if (!afterLessonSubmitted || !afterLessonQuiz.length) {
      return null;
    }

    let correct = 0;
    for (const question of afterLessonQuiz) {
      if (
        question.answerIndex !== null &&
        afterLessonAnswers[question.id] === question.answerIndex
      ) {
        correct += 1;
      }
    }

    return {
      correct,
      total: afterLessonQuiz.length,
      percent: Math.round((correct / afterLessonQuiz.length) * 100),
    };
  }, [afterLessonAnswers, afterLessonQuiz, afterLessonSubmitted]);

  const afterLessonPassed = Boolean(
    afterLessonScore && afterLessonScore.percent >= 70,
  );

  const inVideoScore = useMemo(() => {
    if (!activeQuizPoint || !inVideoSubmitted[activeQuizPoint.id]) {
      return null;
    }

    return (
      activeQuizPoint.answerIndex !== null &&
      inVideoAnswers[activeQuizPoint.id] === activeQuizPoint.answerIndex
    );
  }, [activeQuizPoint, inVideoAnswers, inVideoSubmitted]);

  const handleSelectLesson = useCallback(
    (lessonId: number) => {
      if (transitionTimeoutRef.current !== null) {
        window.clearTimeout(transitionTimeoutRef.current);
        transitionTimeoutRef.current = null;
      }
      if (inVideoQuizResolveTimeoutRef.current !== null) {
        window.clearTimeout(inVideoQuizResolveTimeoutRef.current);
        inVideoQuizResolveTimeoutRef.current = null;
      }

      setIsTransitioningNext(false);
      onSelectLesson(lessonId);
    },
    [onSelectLesson],
  );

  const handleJumpToQuizPoint = useCallback(
    (point: InVideoQuizPoint) => {
      seekVideoTo(point.timestamp, true);
      setActiveQuizPointId(point.id);
    },
    [seekVideoTo],
  );

  const handleTogglePlayback = useCallback(() => {
    if (activeQuizPoint || showAfterLessonOverlay) {
      videoRef.current?.pause();
      return;
    }

    const element = videoRef.current;
    if (!element) {
      return;
    }

    if (element.paused) {
      void element.play().catch(() => undefined);
      return;
    }

    element.pause();
  }, [activeQuizPoint, showAfterLessonOverlay]);

  const handleSetPlaybackRate = useCallback((nextRate: number) => {
    setPlaybackRate(nextRate);

    if (videoRef.current) {
      videoRef.current.playbackRate = nextRate;
    }
  }, []);

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const nextMuted = !prev;
      const video = videoRef.current;

      if (video) {
        video.muted = nextMuted;
        if (!nextMuted && video.volume === 0) {
          const restoredVolume =
            lastVolumeRef.current > 0 ? lastVolumeRef.current : 1;
          video.volume = restoredVolume;
          setVolume(restoredVolume);
        }
      }

      return nextMuted;
    });
  }, []);

  const handleVolumeChange = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));

    if (clampedVolume > 0) {
      lastVolumeRef.current = clampedVolume;
    }

    setVolume(clampedVolume);
    setIsMuted(clampedVolume === 0);

    const video = videoRef.current;
    if (video) {
      video.volume = clampedVolume;
      video.muted = clampedVolume === 0;
    }
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    const videoContainer = videoRef.current?.parentElement;

    if (!document.fullscreenElement) {
      void videoContainer?.requestFullscreen().catch(() => {});
      return;
    }

    void document.exitFullscreen().catch(() => {});
  }, []);

  const handleSeekBackward = useCallback(() => {
    seekVideoTo(currentTime - 10);
  }, [currentTime, seekVideoTo]);

  const handleSeekForward = useCallback(() => {
    seekVideoTo(currentTime + 10);
  }, [currentTime, seekVideoTo]);

  const handleVideoKeyDown = useCallback(
    (event: KeyboardEvent<HTMLVideoElement>) => {
      switch (event.code) {
        case "Space":
          event.preventDefault();
          handleTogglePlayback();
          break;
        case "ArrowLeft":
          event.preventDefault();
          handleSeekBackward();
          break;
        case "ArrowRight":
          event.preventDefault();
          handleSeekForward();
          break;
        case "KeyM":
          event.preventDefault();
          handleToggleMute();
          break;
        case "KeyF":
          event.preventDefault();
          handleToggleFullscreen();
          break;
        default:
          break;
      }
    },
    [
      handleSeekBackward,
      handleSeekForward,
      handleToggleFullscreen,
      handleToggleMute,
      handleTogglePlayback,
    ],
  );

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    video.volume = volume;
    video.muted = isMuted || volume === 0;
  }, [isMuted, volume]);

  const handleVideoEnded = useCallback(() => {
    setIsPlaying(false);

    if (!afterLessonQuiz.length) {
      if (selectedLesson) {
        onMarkLessonCompleted(selectedLesson.id, selectedLessonProgressId);
      }
      return;
    }

    setShowAfterLessonOverlay(true);
    videoRef.current?.pause();
  }, [
    afterLessonQuiz.length,
    onMarkLessonCompleted,
    selectedLesson,
    selectedLessonProgressId,
  ]);

  const handleVideoMetadataLoaded = useCallback((duration: number) => {
    if (!Number.isFinite(duration) || duration <= 0) {
      return;
    }

    setVideoDuration(duration);
  }, []);

  const handleCompleteLesson = useCallback(() => {
    if (!selectedLesson) {
      return;
    }

    onMarkLessonCompleted(selectedLesson.id, selectedLessonProgressId);

    if (nextLesson) {
      handleSelectLesson(nextLesson.id);
    }
  }, [
    handleSelectLesson,
    nextLesson,
    onMarkLessonCompleted,
    selectedLesson,
    selectedLessonProgressId,
  ]);

  const handleSubmitInVideoQuiz = useCallback(() => {
    if (!activeQuizPoint) {
      return;
    }

    const selectedAnswerIndex = inVideoAnswers[activeQuizPoint.id];
    if (selectedAnswerIndex === undefined) {
      return;
    }

    setInVideoSubmitted((prev) => ({ ...prev, [activeQuizPoint.id]: true }));

    if (inVideoQuizResolveTimeoutRef.current !== null) {
      window.clearTimeout(inVideoQuizResolveTimeoutRef.current);
      inVideoQuizResolveTimeoutRef.current = null;
    }

    inVideoQuizResolveTimeoutRef.current = window.setTimeout(() => {
      setActiveQuizPointId(null);
      setLastVideoTime(activeQuizPoint.timestamp);
      window.requestAnimationFrame(() => {
        void videoRef.current?.play();
      });
      inVideoQuizResolveTimeoutRef.current = null;
    }, 900);
  }, [activeQuizPoint, inVideoAnswers]);

  const handleAdvanceToNextLesson = useCallback(() => {
    if (nextLesson) {
      setAfterLessonSubmitted(false);
      setCelebrationArmed(false);
      setNextLessonCountdown(null);
      setShowAfterLessonOverlay(false);
      setConfettiPieces([]);
      setIsTransitioningNext(true);

      if (transitionTimeoutRef.current !== null) {
        window.clearTimeout(transitionTimeoutRef.current);
      }

      transitionTimeoutRef.current = window.setTimeout(() => {
        setIsTransitioningNext(false);
        handleSelectLesson(nextLesson.id);
      }, 1500);
      return;
    }

    const fallbackLesson = lessons[0];
    if (!fallbackLesson) {
      return;
    }

    setAfterLessonSubmitted(false);
    setCelebrationArmed(false);
    setNextLessonCountdown(null);
    setShowAfterLessonOverlay(false);
    setConfettiPieces([]);
    setIsTransitioningNext(false);
    handleSelectLesson(fallbackLesson.id);
  }, [handleSelectLesson, lessons, nextLesson]);

  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current !== null) {
        window.clearTimeout(transitionTimeoutRef.current);
      }
      if (inVideoQuizResolveTimeoutRef.current !== null) {
        window.clearTimeout(inVideoQuizResolveTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!activeQuizPoint) {
      return;
    }

    videoRef.current?.pause();
  }, [activeQuizPoint]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (inVideoQuizResolveTimeoutRef.current !== null) {
        window.clearTimeout(inVideoQuizResolveTimeoutRef.current);
        inVideoQuizResolveTimeoutRef.current = null;
      }

      setCurrentTime(0);
      setLastVideoTime(0);
      setVideoDuration(selectedLessonDuration);
      setActiveQuizPointId(null);
      setInVideoAnswers({});
      setInVideoSubmitted({});
      setAfterLessonAnswers({});
      setAfterLessonSubmitted(false);
      setCelebrationArmed(false);
      setShowAfterLessonOverlay(false);
      setConfettiPieces([]);
      setNextLessonCountdown(null);
      setPlaybackRate(1);

      if (videoRef.current) {
        videoRef.current.playbackRate = 1;
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [selectedLesson?.id, selectedLessonDuration]);

  useEffect(() => {
    if (activeQuizPointId) {
      return;
    }

    const pendingPoint = inVideoQuizPoints.find(
      (point) => currentTime >= point.timestamp && !isQuizSolved(point),
    );
    if (!pendingPoint) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setActiveQuizPointId(pendingPoint.id);
      videoRef.current?.pause();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [activeQuizPointId, currentTime, inVideoQuizPoints, isQuizSolved]);

  const handleTimeUpdate = useCallback(
    (event: SyntheticEvent<HTMLVideoElement>) => {
      const currentVideoTime = event.currentTarget.currentTime;

      const skippedQuiz = inVideoQuizPoints.find(
        (point) =>
          point.timestamp > lastVideoTime &&
          point.timestamp <= currentVideoTime &&
          !isQuizSolved(point),
      );

      if (skippedQuiz) {
        event.currentTarget.currentTime = skippedQuiz.timestamp;
        event.currentTarget.pause();
        setCurrentTime(skippedQuiz.timestamp);
        setLastVideoTime(skippedQuiz.timestamp);
        setActiveQuizPointId(skippedQuiz.id);
        return;
      }

      const activeQuiz = inVideoQuizPoints.find(
        (point) =>
          Math.abs(currentVideoTime - point.timestamp) < 0.5 &&
          !isQuizSolved(point),
      );

      if (activeQuiz) {
        event.currentTarget.pause();
        setActiveQuizPointId(activeQuiz.id);
        setCurrentTime(activeQuiz.timestamp);
        setLastVideoTime(activeQuiz.timestamp);
        return;
      }

      setCurrentTime(currentVideoTime);
      setLastVideoTime(currentVideoTime);
    },
    [inVideoQuizPoints, isQuizSolved, lastVideoTime],
  );

  const handleOverlayScrubClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (effectiveDuration <= 0) {
        return;
      }

      const rect = event.currentTarget.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const percentage = rect.width > 0 ? clickX / rect.width : 0;
      const targetTime =
        Math.max(0, Math.min(1, percentage)) * effectiveDuration;

      const baseTime = videoRef.current?.currentTime ?? currentTime;
      const skippedQuiz =
        targetTime > baseTime
          ? inVideoQuizPoints.find(
              (point) =>
                point.timestamp > baseTime &&
                point.timestamp <= targetTime &&
                !isQuizSolved(point),
            )
          : null;

      if (skippedQuiz) {
        seekVideoTo(skippedQuiz.timestamp, true);
        setActiveQuizPointId(skippedQuiz.id);
        return;
      }

      seekVideoTo(targetTime);

      const video = videoRef.current;
      if (video) {
        void video.play().catch(() => {});
      }
    },
    [
      currentTime,
      effectiveDuration,
      inVideoQuizPoints,
      isQuizSolved,
      seekVideoTo,
    ],
  );

  const handleSeekChange = useCallback(
    (nextTime: number) => {
      if (!Number.isFinite(nextTime)) {
        return;
      }

      const baseTime = videoRef.current?.currentTime ?? currentTime;
      const skippedQuiz =
        nextTime > baseTime
          ? inVideoQuizPoints.find(
              (point) =>
                point.timestamp > baseTime &&
                point.timestamp <= nextTime &&
                !isQuizSolved(point),
            )
          : null;

      if (skippedQuiz) {
        seekVideoTo(skippedQuiz.timestamp, true);
        setActiveQuizPointId(skippedQuiz.id);
        return;
      }

      seekVideoTo(nextTime);
    },
    [currentTime, inVideoQuizPoints, isQuizSolved, seekVideoTo],
  );

  useEffect(() => {
    if (!afterLessonSubmitted || !afterLessonScore || !afterLessonPassed) {
      const resetFrame = window.requestAnimationFrame(() => {
        setCelebrationArmed(false);
        setConfettiPieces([]);
        setNextLessonCountdown(null);
      });

      return () => window.cancelAnimationFrame(resetFrame);
    }

    if (celebrationArmed) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setCelebrationArmed(true);
      setConfettiPieces(buildConfettiPieces());
      setNextLessonCountdown(5);
    });

    const cleanup = window.setTimeout(() => {
      setConfettiPieces([]);
    }, 2600);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(cleanup);
    };
  }, [
    afterLessonPassed,
    afterLessonScore,
    afterLessonSubmitted,
    celebrationArmed,
  ]);

  useEffect(() => {
    if (
      !showAfterLessonOverlay ||
      !afterLessonSubmitted ||
      !afterLessonScore ||
      !afterLessonPassed ||
      !nextLesson
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      setShowAfterLessonOverlay(false);
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [
    afterLessonPassed,
    afterLessonScore,
    afterLessonSubmitted,
    nextLesson,
    showAfterLessonOverlay,
  ]);

  useEffect(() => {
    if (nextLessonCountdown === null) {
      return;
    }

    if (nextLessonCountdown <= 0) {
      const frame = window.requestAnimationFrame(() => {
        handleAdvanceToNextLesson();
      });

      return () => window.cancelAnimationFrame(frame);
    }

    const timer = window.setTimeout(() => {
      setNextLessonCountdown((value) =>
        value === null ? null : Math.max(0, value - 1),
      );
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [handleAdvanceToNextLesson, nextLessonCountdown]);

  const onSelectInVideoAnswer = useCallback(
    (quizPointId: string, optionIndex: number) => {
      setInVideoAnswers((prev) => ({
        ...prev,
        [quizPointId]: optionIndex,
      }));
      setInVideoSubmitted((prev) => ({
        ...prev,
        [quizPointId]: false,
      }));
    },
    [],
  );

  const onSelectAfterLessonAnswer = useCallback(
    (questionId: string, optionIndex: number) => {
      setAfterLessonAnswers((prev) => ({
        ...prev,
        [questionId]: optionIndex,
      }));
    },
    [],
  );

  return {
    videoRef,
    currentTime,
    isPlaying,
    confettiPieces,
    isTransitioningNext,
    showAfterLessonOverlay,
    nextLessonCountdown,
    progressPercent,
    playbackDuration: effectiveDuration,
    activeQuizPoint,
    inVideoAnswers,
    inVideoSubmitted,
    inVideoScore,
    afterLessonAnswers,
    afterLessonSubmitted,
    afterLessonScore,
    afterLessonPassed,
    isQuizSolved,
    handleSelectLesson,
    handleTogglePlayback,
    handleVideoEnded,
    handleVideoMetadataLoaded,
    handleTimeUpdate,
    handleSubmitInVideoQuiz,
    handleJumpToQuizPoint,
    handleOverlayScrubClick,
    handleSeekChange,
    handleCompleteLesson,
    handleAdvanceToNextLesson,
    playbackRate,
    handleSetPlaybackRate,
    volume,
    isMuted,
    isFullscreen,
    handleToggleMute,
    handleVolumeChange,
    handleToggleFullscreen,
    handleVideoKeyDown,
    onSelectInVideoAnswer,
    onSelectAfterLessonAnswer,
    onSubmitAfterLessonQuiz: () => setAfterLessonSubmitted(true),
    onSeekBackward: handleSeekBackward,
    onSeekForward: handleSeekForward,
    setIsPlaying,
    setCurrentTime,
    setLastVideoTime,
  };
}
