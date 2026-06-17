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
import type { SubmitQuizPayload } from "../types";

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
  onHeartbeat: (lessonProgressId: number, positionSec: number) => void;
  onSubmitQuizAttempt: (payload: SubmitQuizPayload) => void;
  initialResumePositionSec: number;
  selectedLessonProgressId?: number | null;
  persistedInVideoAnswers: Record<string, number>;
  persistedInVideoSubmitted: Record<string, boolean>;
  persistedAfterLessonAnswers: Record<string, number>;
  persistedAfterLessonSubmitted: boolean;
  loadingQuizSubmissions: boolean;
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
  onHeartbeat,
  onSubmitQuizAttempt,
  initialResumePositionSec,
  selectedLessonProgressId,
  persistedInVideoAnswers,
  persistedInVideoSubmitted,
  persistedAfterLessonAnswers,
  persistedAfterLessonSubmitted,
  loadingQuizSubmissions,
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
  const [qualityLevels, setQualityLevels] = useState<{ id: number; name: string }[]>([]);
  const [currentQualityLevel, setCurrentQualityLevel] = useState<number>(-1);
  const [videoAspectRatio, setVideoAspectRatio] = useState<number | null>(null);
  const lastVolumeRef = useRef(1);
  const pendingResumePositionRef = useRef<number | null>(null);
  const lastHeartbeatAtRef = useRef<number>(0);

  const activeQuizPoint = useMemo(
    () =>
      inVideoQuizPoints.find((item) => item.id === activeQuizPointId) ?? null,
    [activeQuizPointId, inVideoQuizPoints],
  );

  const effectiveInVideoAnswers = useMemo(
    () => ({ ...persistedInVideoAnswers, ...inVideoAnswers }),
    [inVideoAnswers, persistedInVideoAnswers],
  );

  const effectiveInVideoSubmitted = useMemo(
    () => ({ ...persistedInVideoSubmitted, ...inVideoSubmitted }),
    [inVideoSubmitted, persistedInVideoSubmitted],
  );

  const effectiveAfterLessonAnswers = useMemo(
    () => ({ ...persistedAfterLessonAnswers, ...afterLessonAnswers }),
    [afterLessonAnswers, persistedAfterLessonAnswers],
  );

  const effectiveAfterLessonSubmitted =
    persistedAfterLessonSubmitted || afterLessonSubmitted;

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
      return Boolean(effectiveInVideoSubmitted[point.id]);
    },
    [effectiveInVideoSubmitted],
  );

  const progressPercent =
    effectiveDuration > 0
      ? Math.min(100, Math.max(0, (currentTime / effectiveDuration) * 100))
      : 0;

  const afterLessonScore = useMemo(() => {
    if (!effectiveAfterLessonSubmitted || !afterLessonQuiz.length) {
      return null;
    }

    let correct = 0;
    for (const question of afterLessonQuiz) {
      if (
        question.answerIndex !== null &&
        effectiveAfterLessonAnswers[question.id] === question.answerIndex
      ) {
        correct += 1;
      }
    }

    return {
      correct,
      total: afterLessonQuiz.length,
      percent: Math.round((correct / afterLessonQuiz.length) * 100),
    };
  }, [
    afterLessonQuiz,
    effectiveAfterLessonAnswers,
    effectiveAfterLessonSubmitted,
  ]);

  const afterLessonPassed = Boolean(
    afterLessonScore && afterLessonScore.percent >= 70,
  );

  const inVideoScore = useMemo(() => {
    if (!activeQuizPoint || !effectiveInVideoSubmitted[activeQuizPoint.id]) {
      return null;
    }

    return (
      activeQuizPoint.answerIndex !== null &&
      effectiveInVideoAnswers[activeQuizPoint.id] ===
        activeQuizPoint.answerIndex
    );
  }, [activeQuizPoint, effectiveInVideoAnswers, effectiveInVideoSubmitted]);

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
      const solved = isQuizSolved(point);
      seekVideoTo(point.timestamp, solved ? false : true);
      if (!solved) {
        setActiveQuizPointId(point.id);
      }
    },
    [seekVideoTo, isQuizSolved],
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

  const handleTogglePictureInPicture = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
      }
    } catch (error) {
      console.error("Lỗi khi chuyển đổi chế độ Picture-in-Picture:", error);
    }
  }, []);

  const handleQualityLevelsLoaded = useCallback((levels: { id: number; name: string }[]) => {
    setQualityLevels(levels);
  }, []);

  const handleSetQualityLevel = useCallback((levelId: number) => {
    setCurrentQualityLevel(levelId);
  }, []);

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
        case "KeyP":
          event.preventDefault();
          void handleTogglePictureInPicture();
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
      handleTogglePictureInPicture,
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

  // Global keyboard shortcuts: handle when video isn't focused (Space, Arrows, M, F, P)
  useEffect(() => {
    const isTypingInInput = (el: EventTarget | null) => {
      if (!el || !(el instanceof Element)) return false;
      const tag = el.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea") return true;
      if (el instanceof HTMLElement && el.isContentEditable) return true;
      return false;
    };

    const onKey = (ev: globalThis.KeyboardEvent) => {
      // ignore when user is typing in a form field
      if (isTypingInInput(ev.target)) return;

      switch (ev.code) {
        case "Space":
          ev.preventDefault();
          handleTogglePlayback();
          break;
        case "ArrowLeft":
          ev.preventDefault();
          handleSeekBackward();
          break;
        case "ArrowRight":
          ev.preventDefault();
          handleSeekForward();
          break;
        case "KeyM":
          ev.preventDefault();
          handleToggleMute();
          break;
        case "KeyF":
          ev.preventDefault();
          handleToggleFullscreen();
          break;
        case "KeyP":
          ev.preventDefault();
          void handleTogglePictureInPicture();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    handleSeekBackward,
    handleSeekForward,
    handleToggleFullscreen,
    handleToggleMute,
    handleTogglePlayback,
    handleTogglePictureInPicture,
  ]);

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

    if (!afterLessonQuiz.length || effectiveAfterLessonSubmitted) {
      if (selectedLesson) {
        onMarkLessonCompleted(selectedLesson.id, selectedLessonProgressId);
      }
      return;
    }

    setShowAfterLessonOverlay(true);
    videoRef.current?.pause();
  }, [
    afterLessonQuiz.length,
    effectiveAfterLessonSubmitted,
    onMarkLessonCompleted,
    selectedLesson,
    selectedLessonProgressId,
  ]);

  const handleVideoMetadataLoaded = useCallback(
    (duration: number, aspectRatio?: number) => {
      if (Number.isFinite(duration) && duration > 0) {
        setVideoDuration(duration);
      }

      if (aspectRatio && Number.isFinite(aspectRatio) && aspectRatio > 0) {
        setVideoAspectRatio(aspectRatio);
      }

      if (Number.isFinite(duration) && duration > 0) {
        const pendingResumePosition = pendingResumePositionRef.current;
        if (pendingResumePosition !== null && pendingResumePosition > 0) {
          seekVideoTo(pendingResumePosition, true);
          pendingResumePositionRef.current = null;
        }
      }
    },
    [seekVideoTo],
  );

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

    const selectedOptionId = activeQuizPoint.optionIds[selectedAnswerIndex];
    if (selectedOptionId === undefined) {
      return;
    }

    onSubmitQuizAttempt({
      quizId: activeQuizPoint.quizId,
      answers: [
        {
          questionId: activeQuizPoint.questionId,
          selectedOptionId,
        },
      ],
      timeSpentSeconds: Math.max(0, Math.round(currentTime)),
    });

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
  }, [activeQuizPoint, currentTime, inVideoAnswers, onSubmitQuizAttempt]);

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
    lastHeartbeatAtRef.current = 0;
  }, [selectedLesson?.id]);

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
      setQualityLevels([]);
      setCurrentQualityLevel(-1);
      setVideoAspectRatio(null);

      if (videoRef.current) {
        videoRef.current.playbackRate = 1;
      }

      const resumePosition = Math.max(0, initialResumePositionSec || 0);
      if (resumePosition > 0) {
        pendingResumePositionRef.current = resumePosition;
      } else {
        pendingResumePositionRef.current = null;
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [initialResumePositionSec, selectedLesson?.id, selectedLessonDuration]);

  useEffect(() => {
    if (!selectedLessonProgressId || !selectedLesson || !isPlaying) {
      return;
    }

    const timer = window.setInterval(() => {
      const video = videoRef.current;
      if (!video || video.paused || video.ended) {
        return;
      }

      const now = Date.now();
      if (now - lastHeartbeatAtRef.current < 10_000) {
        return;
      }

      lastHeartbeatAtRef.current = now;
      onHeartbeat(selectedLessonProgressId, Math.max(0, video.currentTime));
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [isPlaying, onHeartbeat, selectedLesson, selectedLessonProgressId]);

  useEffect(() => {
    if (activeQuizPointId || loadingQuizSubmissions) {
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
  }, [activeQuizPointId, currentTime, inVideoQuizPoints, isQuizSolved, loadingQuizSubmissions]);

  useEffect(() => {
    if (!activeQuizPointId || !activeQuizPoint) {
      return;
    }
    if (inVideoSubmitted[activeQuizPoint.id]) {
      return;
    }
    if (persistedInVideoSubmitted[activeQuizPoint.id]) {
      setActiveQuizPointId(null);
      window.requestAnimationFrame(() => {
        void videoRef.current?.play().catch(() => {});
      });
    }
  }, [activeQuizPointId, activeQuizPoint, persistedInVideoSubmitted, inVideoSubmitted]);

  const handleTimeUpdate = useCallback(
    (event: SyntheticEvent<HTMLVideoElement>) => {
      const currentVideoTime = event.currentTarget.currentTime;
      if (loadingQuizSubmissions) {
        setCurrentTime(currentVideoTime);
        setLastVideoTime(currentVideoTime);
        return;
      }

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
    [inVideoQuizPoints, isQuizSolved, lastVideoTime, loadingQuizSubmissions],
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
        !loadingQuizSubmissions && targetTime > baseTime
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
      loadingQuizSubmissions,
    ],
  );

  const handleSeekChange = useCallback(
    (nextTime: number) => {
      if (!Number.isFinite(nextTime)) {
        return;
      }

      const baseTime = videoRef.current?.currentTime ?? currentTime;
      const skippedQuiz =
        !loadingQuizSubmissions && nextTime > baseTime
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
    [currentTime, inVideoQuizPoints, isQuizSolved, seekVideoTo, loadingQuizSubmissions],
  );

  useEffect(() => {
    if (
      !effectiveAfterLessonSubmitted ||
      !afterLessonScore ||
      !afterLessonPassed
    ) {
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
    effectiveAfterLessonSubmitted,
    celebrationArmed,
  ]);

  useEffect(() => {
    if (
      !showAfterLessonOverlay ||
      !effectiveAfterLessonSubmitted ||
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
    effectiveAfterLessonSubmitted,
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

  const handleSubmitAfterLessonQuiz = useCallback(() => {
    if (!afterLessonQuiz.length) {
      return;
    }

    const firstQuiz = afterLessonQuiz[0];
    const answers = afterLessonQuiz
      .map((question) => {
        const selectedAnswerIndex = effectiveAfterLessonAnswers[question.id];
        if (selectedAnswerIndex === undefined) {
          return null;
        }

        const selectedOptionId = question.optionIds[selectedAnswerIndex];
        if (selectedOptionId === undefined) {
          return null;
        }

        return {
          questionId: question.questionId,
          selectedOptionId,
        };
      })
      .filter(
        (answer): answer is { questionId: number; selectedOptionId: number } =>
          answer !== null,
      );

    if (!answers.length) {
      return;
    }

    onSubmitQuizAttempt({
      quizId: firstQuiz.quizId,
      answers,
      timeSpentSeconds: Math.max(0, Math.round(currentTime)),
    });

    setAfterLessonSubmitted(true);
  }, [
    afterLessonQuiz,
    currentTime,
    effectiveAfterLessonAnswers,
    onSubmitQuizAttempt,
  ]);

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
    inVideoAnswers: effectiveInVideoAnswers,
    inVideoSubmitted: effectiveInVideoSubmitted,
    inVideoScore,
    afterLessonAnswers: effectiveAfterLessonAnswers,
    afterLessonSubmitted: effectiveAfterLessonSubmitted,
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
    handleTogglePictureInPicture,
    handleVideoKeyDown,
    qualityLevels,
    currentQualityLevel,
    videoAspectRatio,
    onQualityLevelsLoaded: handleQualityLevelsLoaded,
    onSetQualityLevel: handleSetQualityLevel,
    onSelectInVideoAnswer,
    onSelectAfterLessonAnswer,
    onSubmitAfterLessonQuiz: handleSubmitAfterLessonQuiz,
    onSeekBackward: handleSeekBackward,
    onSeekForward: handleSeekForward,
    setIsPlaying,
    setCurrentTime,
    setLastVideoTime,
  };
}
