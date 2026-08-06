import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useInstructorCourseById,
  useQuizzesByLessonId,
} from "../../../instructor/course-management/api/course-management.hooks";
import { useVideoById } from "../../../video/api/video.hooks";
import { useCourseInstructor } from "../../api/courseDetail.api";
import {
  useLessonProgressByCourseId,
  useLessonProgressHeartbeat,
  useUpsertLessonProgress,
} from "../api/lesson-progress.hooks";
import {
  useQuizSubmissionsByQuizIds,
  useSubmitQuizSubmission,
} from "../api/quiz-submissions.hooks";
import { useEnrollmentCheck } from "../../api/enrollment.api";
import { useAuthStore } from "@/store/auth";
import type {
  LessonProgressRecord,
  QuizSubmissionRecord,
  SubmitQuizPayload,
} from "../types";
import type { QuizAnswerExplanation } from "./useCourseLearnPlayer";
import {
  buildAfterLessonQuiz,
  buildInVideoQuizPoints,
  formatTime,
  parseDurationToSeconds,
  resolveInitialLessonId,
} from "../utils";

export function useCourseLearnData(courseId: number) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setHydrated(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  const { data: enrollment, isLoading: enrollmentLoading } = useEnrollmentCheck(
    courseId,
    user?.id,
  );

  // enrollmentSettled: true when store has hydrated, user is authenticated, and enrollment query finished.
  const enrollmentSettled = hydrated && isAuthenticated && !enrollmentLoading;

  useEffect(() => {
    if (!hydrated) return;

    if (!isAuthenticated) {
      router.replace(`/courses/${courseId}`);
      return;
    }

    if (enrollmentSettled && enrollment == null) {
      router.replace(`/courses/${courseId}`);
    }
  }, [courseId, enrollment, enrollmentSettled, isAuthenticated, hydrated, router]);

  const { data: course, isLoading: courseLoading } =
    useInstructorCourseById(courseId);
  const { data: instructor } = useCourseInstructor(course?.userId);
  const lessonsRaw = course?.lessons;
  const lessonsLoading = courseLoading;

  const lessons = useMemo(
    () =>
      [...(lessonsRaw ?? [])].sort(
        (left, right) => Number(left.id ?? 0) - Number(right.id ?? 0),
      ),
    [lessonsRaw],
  );

  const {
    data: lessonProgressRecords,
    isLoading: lessonProgressLoading,
    isFetching: lessonProgressFetching,
  } = useLessonProgressByCourseId(courseId, Boolean(course && lessons.length));
  const {
    mutateAsync: upsertLessonProgressAsync,
    isPending: lessonProgressUpdating,
  } = useUpsertLessonProgress(courseId);
  const { mutate: sendLessonHeartbeat } = useLessonProgressHeartbeat();

  const lessonProgressMap = useMemo(
    () =>
      new Map<number, LessonProgressRecord>(
        (lessonProgressRecords ?? []).map((record: LessonProgressRecord) => [
          record.lessonId,
          record,
        ]),
      ),
    [lessonProgressRecords],
  );

  const preferredLessonId = useMemo(
    () =>
      lessonProgressRecords?.find(
        (record: LessonProgressRecord) => record.progress === "in_progress",
      )?.lessonId ??
      lessonProgressRecords?.find(
        (record: LessonProgressRecord) => record.progress === "completed",
      )?.lessonId ??
      null,
    [lessonProgressRecords],
  );

  const lessonIdParam =
    searchParams.get("lessonId") ?? searchParams.get("lesson");

  const resolvedSelectedLessonId = useMemo(
    () => resolveInitialLessonId(lessons, lessonIdParam, preferredLessonId),
    [lessonIdParam, lessons, preferredLessonId],
  );

  const selectedLesson = useMemo(
    () =>
      lessons.find((lesson) => lesson.id === resolvedSelectedLessonId) ??
      lessons[0],
    [lessons, resolvedSelectedLessonId],
  );

  useEffect(() => {
    if (!lessons.length) {
      return;
    }

    const hasExactLessonParam =
      lessonIdParam !== null &&
      lessons.some((lesson) => String(lesson.id) === lessonIdParam);

    if (hasExactLessonParam) {
      return;
    }

    const fallbackLessonId = resolveInitialLessonId(
      lessons,
      lessonIdParam,
      preferredLessonId,
    );
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("lessonId", String(fallbackLessonId));
    nextParams.delete("lesson");

    router.replace(`${pathname}?${nextParams.toString()}`, { scroll: false });
  }, [
    lessonIdParam,
    lessons,
    pathname,
    preferredLessonId,
    router,
    searchParams,
  ]);

  const selectedLessonProgress = useMemo(
    () =>
      selectedLesson
        ? (lessonProgressMap.get(selectedLesson.id) ?? null)
        : null,
    [lessonProgressMap, selectedLesson],
  );

  const queryResumeSecRaw = Number(searchParams.get("resumeSec") ?? 0);
  const queryResumeSec = Number.isFinite(queryResumeSecRaw)
    ? Math.max(0, queryResumeSecRaw)
    : 0;
  const forceResumeFromQuery = searchParams.get("resume") === "1";

  const selectedLessonLastPositionSec = useMemo(() => {
    if (!selectedLessonProgress) {
      return 0;
    }

    const positionMs = Number(
      selectedLessonProgress.lastVideoPositionMs ??
        // fallback for raw snake_case payloads
        (
          selectedLessonProgress as LessonProgressRecord & {
            last_video_position_ms?: number;
          }
        ).last_video_position_ms ??
        0,
    );

    // Player works in seconds; storage is milliseconds.
    return Math.max(0, positionMs / 1000);
  }, [selectedLessonProgress]);

  useEffect(() => {
    if (
      !selectedLesson ||
      lessonProgressLoading ||
      lessonProgressFetching ||
      lessonProgressUpdating
    ) {
      return;
    }

    if (
      selectedLessonProgress?.progress === "completed" ||
      selectedLessonProgress?.progress === "in_progress"
    ) {
      return;
    }

    (async () => {
      try {
        const saved = await upsertLessonProgressAsync({
          courseId,
          lessonId: selectedLesson.id,
          progress: "in_progress",
          lessonProgressId: selectedLessonProgress?.id,
        });

        // If the caller needs to heartbeat immediately after creation, they
        // can use the saved.id. We don't call heartbeat here to avoid
        // assumptions about player timing, but returning the result makes
        // the mutation-based cache updated and available synchronously.
        return saved;
      } catch {
        // noop: leave reconciliation to react-query
      }
    })();
  }, [
    courseId,
    lessonProgressLoading,
    lessonProgressFetching,
    lessonProgressUpdating,
    selectedLesson,
    selectedLessonProgress?.id,
    selectedLessonProgress?.progress,
    upsertLessonProgressAsync,
  ]);

  const selectedLessonIndex = useMemo(
    () => lessons.findIndex((lesson) => lesson.id === selectedLesson?.id),
    [lessons, selectedLesson?.id],
  );

  const hasNextLesson =
    selectedLessonIndex >= 0 && selectedLessonIndex < lessons.length - 1;
  const nextLesson = lessons[selectedLessonIndex + 1] ?? null;

  const selectedLessonDuration = parseDurationToSeconds(
    selectedLesson?.duration,
  );
  const selectedLessonVideoId = selectedLesson?.videoId ?? null;
  const { data: selectedLessonVideo } = useVideoById(selectedLessonVideoId);

  const { data: inVideoQuizzes } = useQuizzesByLessonId(
    selectedLesson?.id ?? null,
    "in_video",
    "public",
    Boolean(selectedLesson?.id),
  );
  const { data: afterVideoQuizzes } = useQuizzesByLessonId(
    selectedLesson?.id ?? null,
    "after_video",
    "public",
    Boolean(selectedLesson?.id),
  );

  const inVideoQuizPoints = useMemo(
    () => buildInVideoQuizPoints(inVideoQuizzes),
    [inVideoQuizzes],
  );
  const afterLessonQuiz = useMemo(
    () => buildAfterLessonQuiz(afterVideoQuizzes),
    [afterVideoQuizzes],
  );

  const selectedLessonQuizIds = useMemo(
    () => [
      ...new Set(
        [...(inVideoQuizzes ?? []), ...(afterVideoQuizzes ?? [])].map(
          (quiz) => quiz.id,
        ),
      ),
    ],
    [afterVideoQuizzes, inVideoQuizzes],
  );

  const quizSubmissionQueries = useQuizSubmissionsByQuizIds(
    selectedLessonQuizIds,
    Boolean(selectedLesson?.id),
  );
  const { mutateAsync: submitQuizSubmissionAsync, isPending: quizSubmissionSubmitting } =
    useSubmitQuizSubmission();

  const quizSubmissionsByQuizId = useMemo(() => {
    const map = new Map<number, QuizSubmissionRecord[]>();

    selectedLessonQuizIds.forEach((quizId, index) => {
      map.set(quizId, quizSubmissionQueries[index]?.data ?? []);
    });

    return map;
  }, [quizSubmissionQueries, selectedLessonQuizIds]);

  const persistedInVideoState = useMemo(() => {
    const answers: Record<string, number> = {};
    const submitted: Record<string, boolean> = {};
    const correctness: Record<string, boolean> = {};
    const correctAnswers: Record<string, number> = {};
    const explanations: Record<string, QuizAnswerExplanation> = {};

    for (const point of inVideoQuizPoints) {
      const submissions = quizSubmissionsByQuizId.get(point.quizId) ?? [];

      for (const submission of submissions) {
        const matchedAnswer = submission.answers?.find(
          (answer) => answer.questionId === point.questionId,
        );
        if (!matchedAnswer) {
          continue;
        }

        const matchedOptionIndex = point.optionIds.findIndex(
          (optionId) => optionId === matchedAnswer.selectedOptionId,
        );
        if (matchedOptionIndex < 0) {
          continue;
        }

        answers[point.id] = matchedOptionIndex;
        submitted[point.id] = true;
        correctness[point.id] = matchedAnswer.isCorrect;

        const correctOptionIndex = point.optionIds.findIndex(
          (optionId) => optionId === matchedAnswer.correctOptionId,
        );
        if (correctOptionIndex >= 0) {
          correctAnswers[point.id] = correctOptionIndex;
        }
        explanations[point.id] = {
          explanation: matchedAnswer.explanation ?? null,
          evidenceTimestamp: matchedAnswer.evidenceTimestamp ?? null,
        };
        break;
      }
    }

    return { answers, submitted, correctness, correctAnswers, explanations };
  }, [inVideoQuizPoints, quizSubmissionsByQuizId]);

  const persistedAfterLessonState = useMemo(() => {
    const firstQuiz = afterLessonQuiz[0];
    if (!firstQuiz) {
      return { answers: {}, submitted: false, score: null, passed: false, correctAnswers: {}, explanations: {} };
    }

    const submissions = quizSubmissionsByQuizId.get(firstQuiz.quizId) ?? [];
    const latestSubmission = submissions[0];
    if (!latestSubmission) {
      return { answers: {}, submitted: false, score: null, passed: false, correctAnswers: {}, explanations: {} };
    }

    const answers: Record<string, number> = {};
    const correctAnswers: Record<string, number> = {};
    const explanations: Record<string, QuizAnswerExplanation> = {};
    for (const question of afterLessonQuiz) {
      const matchedAnswer = latestSubmission.answers?.find(
        (answer) => answer.questionId === question.questionId,
      );
      if (!matchedAnswer) {
        continue;
      }

      const matchedOptionIndex = question.optionIds.findIndex(
        (optionId) => optionId === matchedAnswer.selectedOptionId,
      );
      if (matchedOptionIndex >= 0) {
        answers[question.id] = matchedOptionIndex;
      }

      const correctOptionIndex = question.optionIds.findIndex(
        (optionId) => optionId === matchedAnswer.correctOptionId,
      );
      if (correctOptionIndex >= 0) {
        correctAnswers[question.id] = correctOptionIndex;
      }
      explanations[question.id] = {
        explanation: matchedAnswer.explanation ?? null,
        evidenceTimestamp: matchedAnswer.evidenceTimestamp ?? null,
      };
    }

    const correctCount = latestSubmission.answers?.filter((a) => a.isCorrect).length ?? 0;
    const totalQuestions = latestSubmission.answers?.length ?? afterLessonQuiz.length;
    const percent = latestSubmission.percent ?? (totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0);

    return {
      answers,
      submitted: true,
      score: {
        correct: correctCount,
        total: totalQuestions,
        percent,
      },
      passed: latestSubmission.passed === true,
      correctAnswers,
      explanations,
    };
  }, [afterLessonQuiz, quizSubmissionsByQuizId]);

  const completedLessonCount =
    lessonProgressRecords?.filter(
      (record: LessonProgressRecord) => record.progress === "completed",
    ).length ?? 0;
  const courseProgressPercent =
    lessons.length > 0
      ? Math.round((completedLessonCount / lessons.length) * 100)
      : 0;

  const totalLessonDuration = useMemo(
    () =>
      lessons.reduce(
        (sum, lesson) => sum + parseDurationToSeconds(lesson.duration),
        0,
      ),
    [lessons],
  );

  const totalQuizMarkers = inVideoQuizPoints.length;
  const currentLessonDurationLabel = formatTime(selectedLessonDuration);
  const isQuizQueriesLoading = useMemo(
    () => quizSubmissionQueries.some((query) => query.isLoading || query.isFetching),
    [quizSubmissionQueries],
  );
  const progressSyncing =
    lessonProgressLoading ||
    lessonProgressFetching ||
    lessonProgressUpdating ||
    quizSubmissionSubmitting ||
    isQuizQueriesLoading;

  const submitQuizAttempt = useCallback(
    (payload: SubmitQuizPayload) => submitQuizSubmissionAsync(payload),
    [submitQuizSubmissionAsync],
  );

  const handleSelectLesson = useCallback(
    (lessonId: number) => {
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.set("lessonId", String(lessonId));
      nextParams.delete("lesson");
      router.push(`${pathname}?${nextParams.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const markLessonCompleted = useCallback(
    async (lessonId: number, lessonProgressId?: number | null) => {
      await upsertLessonProgressAsync({
        courseId,
        lessonId,
        progress: "completed",
        lessonProgressId,
      });
    },
    [courseId, upsertLessonProgressAsync],
  );

  const sendHeartbeat = useCallback(
    (lessonProgressId: number, positionSec: number) => {
      sendLessonHeartbeat({
        lessonProgressId,
        // Store milliseconds (round, don't truncate) to avoid ~1s resume drift.
        position: Math.max(0, Math.round(positionSec * 1000)),
      });
    },
    [sendLessonHeartbeat],
  );

  return {
    course,
    instructor,
    courseLoading,
    enrollmentSettled,
    lessons,
    lessonsLoading,
    lessonProgressRecords,
    selectedLesson,
    selectedLessonProgress,
    selectedLessonIndex,
    selectedLessonDuration,
    selectedLessonVideo,
    selectedLessonLastPositionSec,
    initialResumePositionSec:
      queryResumeSec > 0 ? queryResumeSec : selectedLessonLastPositionSec,
    shouldForceResumeFromQuery: forceResumeFromQuery,
    hasNextLesson,
    nextLesson,
    inVideoQuizPoints,
    afterLessonQuiz,
    persistedInVideoState,
    persistedAfterLessonState,
    completedLessonCount,
    courseProgressPercent,
    totalLessonDuration,
    totalQuizMarkers,
    currentLessonDurationLabel,
    progressSyncing,
    isQuizQueriesLoading,
    handleSelectLesson,
    markLessonCompleted,
    sendHeartbeat,
    submitQuizAttempt,
  };
}
