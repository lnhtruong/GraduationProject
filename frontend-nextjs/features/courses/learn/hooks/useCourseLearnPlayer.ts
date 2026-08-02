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
import { toast } from "sonner";
import type { InstructorLesson } from "../../../instructor/course-management/types";
import {
  buildConfettiPieces,
  type AfterLessonQuizQuestion,
  type ConfettiPiece,
  type InVideoQuizPoint,
} from "../utils";
import type { QuizSubmissionRecord, SubmitQuizPayload } from "../types";

type OrientationWithLock = ScreenOrientation & {
  lock?: (
    orientation:
      | "any"
      | "natural"
      | "landscape"
      | "portrait"
      | "portrait-primary"
      | "portrait-secondary"
      | "landscape-primary"
      | "landscape-secondary",
  ) => Promise<void>;
  unlock?: () => void;
};

type WebKitFullscreenVideo = HTMLVideoElement & {
  webkitEnterFullscreen?: () => void;
};

export interface QuizAnswerExplanation {
  explanation: string | null;
  evidenceTimestamp: string | null;
}

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
  ) => Promise<void>;
  onHeartbeat: (lessonProgressId: number, positionSec: number) => void;
  onSubmitQuizAttempt: (payload: SubmitQuizPayload) => Promise<QuizSubmissionRecord>;
  initialResumePositionSec: number;
  selectedLessonProgressId?: number | null;
  persistedInVideoAnswers: Record<string, number>;
  persistedInVideoSubmitted: Record<string, boolean>;
  persistedInVideoCorrectness: Record<string, boolean>;
  persistedInVideoCorrectAnswers: Record<string, number>;
  persistedInVideoExplanations: Record<string, QuizAnswerExplanation>;
  persistedAfterLessonAnswers: Record<string, number>;
  persistedAfterLessonSubmitted: boolean;
  persistedAfterLessonScore: { correct: number; total: number; percent: number } | null;
  persistedAfterLessonPassed: boolean;
  persistedAfterLessonCorrectAnswers: Record<string, number>;
  persistedAfterLessonExplanations: Record<string, QuizAnswerExplanation>;
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
  persistedInVideoCorrectness,
  persistedInVideoCorrectAnswers,
  persistedInVideoExplanations,
  persistedAfterLessonAnswers,
  persistedAfterLessonSubmitted,
  persistedAfterLessonScore,
  persistedAfterLessonPassed,
  persistedAfterLessonCorrectAnswers,
  persistedAfterLessonExplanations,
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
  const [isQuizOverlayDismissed, setIsQuizOverlayDismissed] = useState(false);
  const [reviewingQuizPointIds, setReviewingQuizPointIds] = useState<
    string[] | null
  >(null);
  const [inVideoAnswers, setInVideoAnswers] = useState<Record<string, number>>(
    {},
  );
  const [inVideoSubmitted, setInVideoSubmitted] = useState<
    Record<string, boolean>
  >({});
  const [inVideoCorrectness, setInVideoCorrectness] = useState<
    Record<string, boolean>
  >(persistedInVideoCorrectness);
  const [inVideoCorrectAnswers, setInVideoCorrectAnswers] = useState<
    Record<string, number>
  >(persistedInVideoCorrectAnswers);
  const [inVideoExplanations, setInVideoExplanations] = useState<
    Record<string, QuizAnswerExplanation>
  >(persistedInVideoExplanations);
  const [afterLessonAnswers, setAfterLessonAnswers] = useState<
    Record<string, number>
  >({});
  const [afterLessonSubmitted, setAfterLessonSubmitted] = useState(false);
  const [afterLessonCorrectAnswers, setAfterLessonCorrectAnswers] = useState<
    Record<string, number>
  >(persistedAfterLessonCorrectAnswers);
  const [afterLessonExplanations, setAfterLessonExplanations] = useState<
    Record<string, QuizAnswerExplanation>
  >(persistedAfterLessonExplanations);
  const [localAfterLessonScore, setLocalAfterLessonScore] = useState<{
    correct: number;
    total: number;
    percent: number;
  } | null>(null);
  const [localAfterLessonPassed, setLocalAfterLessonPassed] = useState(false);
  const [isRetaking, setIsRetaking] = useState(false);
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
  const completedMarkedLessonIdRef = useRef<number | null>(null);

  const activeQuizPoint = useMemo(
    () =>
      inVideoQuizPoints.find((item) => item.id === activeQuizPointId) ?? null,
    [activeQuizPointId, inVideoQuizPoints],
  );

  const activateQuizPoint = useCallback((pointId: string) => {
    setActiveQuizPointId(pointId);
    setIsQuizOverlayDismissed(false);
  }, []);

  const reviewingQuizPoints = useMemo(() => {
    if (!reviewingQuizPointIds) {
      return null;
    }
    const idSet = new Set(reviewingQuizPointIds);
    return inVideoQuizPoints.filter((point) => idSet.has(point.id));
  }, [reviewingQuizPointIds, inVideoQuizPoints]);

  const effectiveInVideoAnswers = useMemo(
    () => ({ ...persistedInVideoAnswers, ...inVideoAnswers }),
    [inVideoAnswers, persistedInVideoAnswers],
  );

  const effectiveInVideoSubmitted = useMemo(
    () => ({ ...persistedInVideoSubmitted, ...inVideoSubmitted }),
    [inVideoSubmitted, persistedInVideoSubmitted],
  );

  const effectiveInVideoCorrectness = useMemo(
    () => ({ ...persistedInVideoCorrectness, ...inVideoCorrectness }),
    [inVideoCorrectness, persistedInVideoCorrectness],
  );

  const effectiveInVideoCorrectAnswers = useMemo(
    () => ({ ...persistedInVideoCorrectAnswers, ...inVideoCorrectAnswers }),
    [inVideoCorrectAnswers, persistedInVideoCorrectAnswers],
  );

  const effectiveInVideoExplanations = useMemo(
    () => ({ ...persistedInVideoExplanations, ...inVideoExplanations }),
    [inVideoExplanations, persistedInVideoExplanations],
  );

  const effectiveAfterLessonAnswers = useMemo(
    () => ({ ...persistedAfterLessonAnswers, ...afterLessonAnswers }),
    [afterLessonAnswers, persistedAfterLessonAnswers],
  );

  const effectiveAfterLessonSubmitted =
    !isRetaking && (persistedAfterLessonSubmitted || afterLessonSubmitted);

  const effectiveAfterLessonCorrectAnswers = useMemo(
    () => ({ ...persistedAfterLessonCorrectAnswers, ...afterLessonCorrectAnswers }),
    [afterLessonCorrectAnswers, persistedAfterLessonCorrectAnswers],
  );

  const effectiveAfterLessonExplanations = useMemo(
    () => ({ ...persistedAfterLessonExplanations, ...afterLessonExplanations }),
    [afterLessonExplanations, persistedAfterLessonExplanations],
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

  const handleReviewQuizGroup = useCallback(
    (points: InVideoQuizPoint[]) => {
      if (!points.length) {
        return;
      }
      videoRef.current?.pause();
      seekVideoTo(points[0].timestamp, true);
      setReviewingQuizPointIds(points.map((point) => point.id));
    },
    [seekVideoTo],
  );

  const handleCloseQuizGroupReview = useCallback(() => {
    setReviewingQuizPointIds(null);
    window.requestAnimationFrame(() => {
      void videoRef.current?.play();
    });
  }, []);

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

  const afterLessonScore = effectiveAfterLessonSubmitted
    ? (localAfterLessonScore ?? persistedAfterLessonScore)
    : null;

  const afterLessonPassed = effectiveAfterLessonSubmitted
    ? (localAfterLessonScore ? localAfterLessonPassed : persistedAfterLessonPassed)
    : false;

  const markCurrentLessonCompletedOnce = useCallback(async () => {
    if (!selectedLesson) {
      return;
    }

    if (completedMarkedLessonIdRef.current === selectedLesson.id) {
      return;
    }

    completedMarkedLessonIdRef.current = selectedLesson.id;
    try {
      await onMarkLessonCompleted(selectedLesson.id, selectedLessonProgressId);
    } catch {
      completedMarkedLessonIdRef.current = null;
      toast.error("Không thể cập nhật tiến độ bài học. Vui lòng thử lại.");
    }
  }, [onMarkLessonCompleted, selectedLesson, selectedLessonProgressId]);

  const inVideoScore = useMemo(() => {
    if (!activeQuizPoint || !effectiveInVideoSubmitted[activeQuizPoint.id]) {
      return null;
    }

    const correctness = effectiveInVideoCorrectness[activeQuizPoint.id];
    if (correctness === undefined && loadingQuizSubmissions) {
      return null;
    }

    return correctness === undefined ? null : correctness === true;
  }, [activeQuizPoint, effectiveInVideoSubmitted, effectiveInVideoCorrectness, loadingQuizSubmissions]);

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
      activateQuizPoint(point.id);
    },
    [seekVideoTo, activateQuizPoint],
  );

  const handleTogglePlayback = useCallback(() => {
    if (activeQuizPoint) {
      videoRef.current?.pause();
      if (isQuizOverlayDismissed) {
        setIsQuizOverlayDismissed(false);
      }
      return;
    }

    if (reviewingQuizPointIds || showAfterLessonOverlay) {
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
  }, [
    activeQuizPoint,
    reviewingQuizPointIds,
    showAfterLessonOverlay,
    isQuizOverlayDismissed,
  ]);

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

  const handleToggleFullscreen = useCallback(async () => {
    const videoContainer = videoRef.current?.parentElement;
    const video = videoRef.current as WebKitFullscreenVideo | null;
    const orientation = window.screen?.orientation as OrientationWithLock | undefined;

    if (!document.fullscreenElement) {
      try {
        if (videoContainer?.requestFullscreen) {
          await videoContainer.requestFullscreen();
          if (orientation?.lock) {
            await orientation.lock("landscape").catch(() => {});
          }
        } else if (video && typeof video.webkitEnterFullscreen === "function") {
          video.webkitEnterFullscreen();
        }
      } catch (err) {
        console.warn("Standard fullscreen failed, trying webkitEnterFullscreen:", err);
        if (video && typeof video.webkitEnterFullscreen === "function") {
          try {
            video.webkitEnterFullscreen();
          } catch (e) {
            console.error("webkitEnterFullscreen failed too:", e);
          }
        }
      }
      return;
    }

    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
        if (orientation?.unlock) {
          orientation.unlock();
        }
      }
    } catch (err) {
      console.error("Lỗi exit fullscreen:", err);
    }
  }, []);

  const handleSeekBackward = useCallback(() => {
    if (activeQuizPoint || reviewingQuizPointIds || showAfterLessonOverlay) {
      return;
    }
    seekVideoTo(currentTime - 10);
  }, [
    activeQuizPoint,
    reviewingQuizPointIds,
    showAfterLessonOverlay,
    currentTime,
    seekVideoTo,
  ]);

  const handleSeekForward = useCallback(() => {
    if (activeQuizPoint || reviewingQuizPointIds || showAfterLessonOverlay) {
      return;
    }
    seekVideoTo(currentTime + 10);
  }, [
    activeQuizPoint,
    reviewingQuizPointIds,
    showAfterLessonOverlay,
    currentTime,
    seekVideoTo,
  ]);

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

    if (!afterLessonQuiz.length || (effectiveAfterLessonSubmitted && afterLessonPassed)) {
      void markCurrentLessonCompletedOnce();
      return;
    }

    setShowAfterLessonOverlay(true);
    videoRef.current?.pause();
  }, [
    afterLessonQuiz.length,
    effectiveAfterLessonSubmitted,
    afterLessonPassed,
    markCurrentLessonCompletedOnce,
  ]);

  const handleVideoPause = useCallback(
    (event: SyntheticEvent<HTMLVideoElement>) => {
      const video = event.currentTarget;
      const reachedMediaEnd =
        Number.isFinite(video.duration) &&
        video.duration > 0 &&
        video.currentTime >= video.duration;

      if (!video.ended && !reachedMediaEnd) {
        return;
      }

      handleVideoEnded();
    },
    [handleVideoEnded],
  );

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

    if (afterLessonQuiz.length > 0 && (!effectiveAfterLessonSubmitted || !afterLessonPassed)) {
      toast.error(`Bạn cần đạt tối thiểu ${afterLessonQuiz[0]?.passingScore ?? 70}% câu hỏi đúng để hoàn thành bài học này!`);
      setShowAfterLessonOverlay(true);
      return;
    }

    void markCurrentLessonCompletedOnce();

    if (nextLesson) {
      handleSelectLesson(nextLesson.id);
    }
  }, [
    afterLessonQuiz,
    effectiveAfterLessonSubmitted,
    afterLessonPassed,
    handleSelectLesson,
    nextLesson,
    markCurrentLessonCompletedOnce,
    selectedLesson,
  ]);

  const handleSubmitInVideoQuiz = useCallback(async () => {
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

    setInVideoSubmitted((prev) => ({ ...prev, [activeQuizPoint.id]: true }));

    try {
      const submission = await onSubmitQuizAttempt({
        quizId: activeQuizPoint.quizId,
        answers: [
          {
            questionId: activeQuizPoint.questionId,
            selectedOptionId,
          },
        ],
        timeSpentSeconds: Math.max(0, Math.round(currentTime)),
      });
      const savedAnswer = submission.answers.find(
        (answer) => answer.questionId === activeQuizPoint.questionId,
      );
      const correctOptionIndex = activeQuizPoint.optionIds.findIndex(
        (optionId) => optionId === savedAnswer?.correctOptionId,
      );

      setInVideoCorrectness((prev) => ({
        ...prev,
        [activeQuizPoint.id]:
          savedAnswer?.isCorrect ??
          (activeQuizPoint.answerIndex !== null
            ? selectedAnswerIndex === activeQuizPoint.answerIndex
            : false),
      }));
      if (correctOptionIndex >= 0) {
        setInVideoCorrectAnswers((prev) => ({
          ...prev,
          [activeQuizPoint.id]: correctOptionIndex,
        }));
      }
      setInVideoExplanations((prev) => ({
        ...prev,
        [activeQuizPoint.id]: {
          explanation: savedAnswer?.explanation ?? null,
          evidenceTimestamp: savedAnswer?.evidenceTimestamp ?? null,
        },
      }));
    } catch {
      setInVideoSubmitted((prev) => ({ ...prev, [activeQuizPoint.id]: false }));
      toast.error("Không thể ghi nhận câu trả lời. Vui lòng thử lại.");
      return;
    }

  }, [activeQuizPoint, currentTime, inVideoAnswers, onSubmitQuizAttempt]);

  const handleContinueAfterInVideoQuiz = useCallback(() => {
    if (!activeQuizPoint || !effectiveInVideoSubmitted[activeQuizPoint.id]) {
      return;
    }

    setActiveQuizPointId(null);
    setIsQuizOverlayDismissed(false);
    setLastVideoTime(activeQuizPoint.timestamp);
    window.requestAnimationFrame(() => {
      void videoRef.current?.play();
    });
  }, [activeQuizPoint, effectiveInVideoSubmitted]);

  const handleDismissQuizOverlay = useCallback(() => {
    setIsQuizOverlayDismissed(true);
  }, []);

  const handleAdvanceToNextLesson = useCallback(() => {
    if (nextLesson) {
      setAfterLessonSubmitted(false);
      setLocalAfterLessonScore(null);
      setLocalAfterLessonPassed(false);
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
    setLocalAfterLessonScore(null);
    setLocalAfterLessonPassed(false);
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
      setIsQuizOverlayDismissed(false);
      setReviewingQuizPointIds(null);
      setInVideoAnswers({});
      setInVideoSubmitted({});
      setInVideoCorrectness({});
      setInVideoCorrectAnswers({});
      setInVideoExplanations({});
      setAfterLessonAnswers({});
      setAfterLessonSubmitted(false);
      setAfterLessonCorrectAnswers({});
      setAfterLessonExplanations({});
      setLocalAfterLessonScore(null);
      setLocalAfterLessonPassed(false);
      setIsRetaking(false);
      setCelebrationArmed(false);
      setShowAfterLessonOverlay(false);
      setConfettiPieces([]);
      setNextLessonCountdown(null);
      setPlaybackRate(1);
      setQualityLevels([]);
      setCurrentQualityLevel(-1);
      setVideoAspectRatio(null);
      completedMarkedLessonIdRef.current = null;

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
    if (activeQuizPointId || reviewingQuizPointIds || loadingQuizSubmissions) {
      return;
    }

    const pendingPoint = inVideoQuizPoints.find(
      (point) => currentTime >= point.timestamp && !isQuizSolved(point),
    );
    if (!pendingPoint) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      activateQuizPoint(pendingPoint.id);
      videoRef.current?.pause();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [
    activeQuizPointId,
    reviewingQuizPointIds,
    currentTime,
    inVideoQuizPoints,
    isQuizSolved,
    loadingQuizSubmissions,
    activateQuizPoint,
  ]);

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
        activateQuizPoint(skippedQuiz.id);
        return;
      }

      const activeQuiz = inVideoQuizPoints.find(
        (point) =>
          Math.abs(currentVideoTime - point.timestamp) < 0.5 &&
          !isQuizSolved(point),
      );

      if (activeQuiz) {
        event.currentTarget.pause();
        activateQuizPoint(activeQuiz.id);
        setCurrentTime(activeQuiz.timestamp);
        setLastVideoTime(activeQuiz.timestamp);
        return;
      }

      setCurrentTime(currentVideoTime);
      setLastVideoTime(currentVideoTime);

      if (effectiveDuration > 0 && currentVideoTime >= effectiveDuration) {
        handleVideoEnded();
      }
    },
    [
      effectiveDuration,
      handleVideoEnded,
      inVideoQuizPoints,
      isQuizSolved,
      lastVideoTime,
      loadingQuizSubmissions,
      activateQuizPoint,
    ],
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
        activateQuizPoint(skippedQuiz.id);
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
      activateQuizPoint,
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
        activateQuizPoint(skippedQuiz.id);
        return;
      }

      seekVideoTo(nextTime);
    },
    [
      currentTime,
      inVideoQuizPoints,
      isQuizSolved,
      seekVideoTo,
      loadingQuizSubmissions,
      activateQuizPoint,
    ],
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

  useEffect(() => {
    if (!effectiveAfterLessonSubmitted || !afterLessonPassed) {
      return;
    }

    void markCurrentLessonCompletedOnce();
  }, [
    afterLessonPassed,
    effectiveAfterLessonSubmitted,
    markCurrentLessonCompletedOnce,
  ]);

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

  const handleSubmitAfterLessonQuiz = useCallback(async () => {
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

    setIsRetaking(false);
    setAfterLessonSubmitted(true);

    try {
      const submission = await onSubmitQuizAttempt({
        quizId: firstQuiz.quizId,
        answers,
        timeSpentSeconds: Math.max(0, Math.round(currentTime)),
      });

      const correctAnswers: Record<string, number> = {};
      const explanations: Record<string, QuizAnswerExplanation> = {};
      for (const question of afterLessonQuiz) {
        const savedAnswer = submission.answers.find(
          (answer) => answer.questionId === question.questionId,
        );
        const correctOptionIndex = question.optionIds.findIndex(
          (optionId) => optionId === savedAnswer?.correctOptionId,
        );
        if (correctOptionIndex >= 0) {
          correctAnswers[question.id] = correctOptionIndex;
        }
        explanations[question.id] = {
          explanation: savedAnswer?.explanation ?? null,
          evidenceTimestamp: savedAnswer?.evidenceTimestamp ?? null,
        };
      }

      const correctCount = submission.answers.filter((answer) => answer.isCorrect).length;
      const totalQuestions = submission.answers.length || afterLessonQuiz.length;
      const percent =
        submission.percent ??
        (totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0);

      setAfterLessonCorrectAnswers(correctAnswers);
      setAfterLessonExplanations(explanations);
      setLocalAfterLessonScore({
        correct: correctCount,
        total: totalQuestions,
        percent,
      });
      setLocalAfterLessonPassed(submission.passed === true);
      setIsRetaking(false);
    } catch {
      setAfterLessonSubmitted(false);
      toast.error("Không thể nộp quiz. Vui lòng thử lại.");
    }
  }, [
    afterLessonQuiz,
    currentTime,
    effectiveAfterLessonAnswers,
    onSubmitQuizAttempt,
  ]);

  const handleRetryAfterLessonQuiz = useCallback(() => {
    setAfterLessonAnswers({});
    setAfterLessonSubmitted(false);
    setAfterLessonCorrectAnswers({});
    setAfterLessonExplanations({});
    setLocalAfterLessonScore(null);
    setLocalAfterLessonPassed(false);
    setIsRetaking(true);
  }, []);

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
    isQuizOverlayDismissed,
    reviewingQuizPoints,
    inVideoAnswers: effectiveInVideoAnswers,
    inVideoSubmitted: effectiveInVideoSubmitted,
    inVideoScore,
    inVideoCorrectAnswers: effectiveInVideoCorrectAnswers,
    inVideoExplanations: effectiveInVideoExplanations,
    afterLessonAnswers: effectiveAfterLessonAnswers,
    afterLessonSubmitted: effectiveAfterLessonSubmitted,
    afterLessonScore,
    afterLessonPassed,
    afterLessonCorrectAnswers: effectiveAfterLessonCorrectAnswers,
    afterLessonExplanations: effectiveAfterLessonExplanations,
    isQuizSolved,
    handleSelectLesson,
    handleTogglePlayback,
    handleVideoEnded,
    handleVideoPause,
    handleVideoMetadataLoaded,
    handleTimeUpdate,
    handleSubmitInVideoQuiz,
    handleContinueAfterInVideoQuiz,
    handleDismissQuizOverlay,
    handleReviewQuizGroup,
    handleCloseQuizGroupReview,
    handleJumpToQuizPoint,
    handleOverlayScrubClick,
    handleSeekChange,
    handleCompleteLesson,
    handleAdvanceToNextLesson,
    handleRetryAfterLessonQuiz,
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
    setIsFullscreen,
    seekVideoTo,
  };
}
