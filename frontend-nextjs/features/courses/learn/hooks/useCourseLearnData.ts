import { useCallback, useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useInstructorCourseById,
  useLessonsByCourseId,
  useQuizzesByLessonId,
} from "../../../instructor/course-management/api/course-management.hooks";
import { useVideoById } from "../../../video/api/video.hooks";
import {
  useLessonProgressByCourseId,
  useUpsertLessonProgress,
} from "../api/lesson-progress.hooks";
import { useEnrollmentCheck } from "../../api/enrollment.api";
import { useAuthStore } from "@/store/auth";
import type { LessonProgressRecord } from "../types";
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

  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  const { data: enrollment, isLoading: enrollmentLoading, isError: enrollmentError } =
    useEnrollmentCheck(courseId, user?.id);

  // enrollmentSettled: true khi store đã hydrate VÀ query đã chạy xong (không còn loading).
  // Khi userId chưa có (store chưa hydrate), query bị disabled → isLoading=false ngay
  // nhưng ta cần !!user?.id để đảm bảo store đã sẵn sàng trước khi đánh giá kết quả.
  const enrollmentSettled = !!user?.id && !enrollmentLoading;

  useEffect(() => {
    if (!enrollmentSettled) return;
    if (!isAuthenticated || enrollmentError || enrollment == null) {
      router.replace(`/courses/${courseId}`);
    }
  }, [courseId, enrollment, enrollmentError, enrollmentSettled, isAuthenticated, router]);

  const { data: course, isLoading: courseLoading } =
    useInstructorCourseById(courseId);
  const { data: lessonsRaw, isLoading: lessonsLoading } =
    useLessonsByCourseId(courseId);

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
  const { mutate: upsertLessonProgress, isPending: lessonProgressUpdating } =
    useUpsertLessonProgress(courseId);

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

  useEffect(() => {
    if (!selectedLesson || lessonProgressLoading || lessonProgressUpdating) {
      return;
    }

    if (
      selectedLessonProgress?.progress === "completed" ||
      selectedLessonProgress?.progress === "in_progress"
    ) {
      return;
    }

    upsertLessonProgress({
      courseId,
      lessonId: selectedLesson.id,
      progress: "in_progress",
      lessonProgressId: selectedLessonProgress?.id,
    });
  }, [
    courseId,
    lessonProgressLoading,
    lessonProgressUpdating,
    selectedLesson,
    selectedLessonProgress?.id,
    selectedLessonProgress?.progress,
    upsertLessonProgress,
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
    Boolean(selectedLesson?.id),
  );
  const { data: afterVideoQuizzes } = useQuizzesByLessonId(
    selectedLesson?.id ?? null,
    "after_video",
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
  const progressSyncing =
    lessonProgressLoading || lessonProgressFetching || lessonProgressUpdating;

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
    (lessonId: number, lessonProgressId?: number | null) => {
      upsertLessonProgress({
        courseId,
        lessonId,
        progress: "completed",
        lessonProgressId,
      });
    },
    [courseId, upsertLessonProgress],
  );

  return {
    course,
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
    hasNextLesson,
    nextLesson,
    inVideoQuizPoints,
    afterLessonQuiz,
    completedLessonCount,
    courseProgressPercent,
    totalLessonDuration,
    totalQuizMarkers,
    currentLessonDurationLabel,
    progressSyncing,
    handleSelectLesson,
    markLessonCompleted,
  };
}
