"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCourseLearnPage } from "./hooks/useCourseLearnPage";
import { Card, CardContent } from "@/components/ui/card";
import { LessonVideoCard } from "./components/LessonVideoCard";
import { LessonSidebar } from "./components/LessonSidebar";
import { LessonInfoPanel } from "./components/LessonInfoPanel";

interface Props {
  courseId: number;
}

export default function CourseLearnPage({ courseId }: Props) {
  const state = useCourseLearnPage(courseId);

  if (!state.enrollmentSettled || state.courseLoading || state.lessonsLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Đang tải dữ liệu khóa học và bài giảng...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!state.course || !state.lessons.length || !state.selectedLesson) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Không tìm thấy dữ liệu học bài giảng từ API.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.16),transparent_28%),radial-gradient(circle_at_top_right,hsl(var(--accent)/0.14),transparent_22%),linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--background))_24%,hsl(var(--muted)/0.35)_100%)]">
      <AnimatePresence>
        {state.confettiPieces.length ? (
          <motion.div
            className="pointer-events-none fixed inset-0 z-80 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {state.confettiPieces.map((piece) => (
              <motion.span
                key={piece.id}
                className="absolute rounded-sm"
                style={{
                  left: `${piece.left}%`,
                  top: `${piece.top}%`,
                  width: `${piece.size}px`,
                  height: `${piece.size * 0.45}px`,
                  backgroundColor: piece.color,
                }}
                initial={{ opacity: 0, y: -20, rotate: 0 }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  y: [0, 160 + piece.drift, 260 + piece.drift],
                  x: [0, piece.drift * 0.4, piece.drift],
                  rotate: [0, piece.rotate, piece.rotate + 90],
                }}
                transition={{
                  duration: piece.duration,
                  delay: piece.delay,
                  ease: "easeOut",
                }}
              />
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute left-0 top-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute right-0 top-40 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
      </div>

      <main className="relative mx-auto max-w-360 px-4 py-5 sm:px-5 lg:px-8 lg:py-7">
        <div className="mb-4 text-sm text-muted-foreground">
          Khóa học <span className="px-1">&gt;</span> {state.course.name}{" "}
          <span className="px-1">&gt;</span> {state.selectedLesson.title}
        </div>

        <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
          <div className="min-w-0 flex-1 space-y-6">
            <LessonVideoCard
              selectedLessonVideoUrl={state.selectedLessonVideo?.url}
              currentLessonDurationLabel={state.currentLessonDurationLabel}
              selectedLessonDuration={state.playbackDuration}
              currentTime={state.currentTime}
              progressPercent={state.progressPercent}
              isPlaying={state.isPlaying}
              activeQuizPoint={state.activeQuizPoint}
              inVideoQuizPoints={state.inVideoQuizPoints}
              inVideoAnswers={state.inVideoAnswers}
              inVideoSubmitted={state.inVideoSubmitted}
              inVideoScore={state.inVideoScore}
              afterLessonQuiz={state.afterLessonQuiz}
              afterLessonAnswers={state.afterLessonAnswers}
              afterLessonSubmitted={state.afterLessonSubmitted}
              afterLessonScore={state.afterLessonScore}
              afterLessonPassed={state.afterLessonPassed}
              hasNextLesson={state.hasNextLesson}
              nextLessonCountdown={state.nextLessonCountdown}
              isTransitioningNext={state.isTransitioningNext}
              nextLessonTitle={state.nextLesson?.title}
              showAfterLessonOverlay={state.showAfterLessonOverlay}
              videoRef={state.videoRef}
              isQuizSolved={state.isQuizSolved}
              onTogglePlayback={state.handleTogglePlayback}
              onTimeUpdate={state.handleTimeUpdate}
              onVideoEnded={state.handleVideoEnded}
              onVideoMetadataLoaded={state.handleVideoMetadataLoaded}
              onSelectInVideoAnswer={state.onSelectInVideoAnswer}
              onSelectAfterLessonAnswer={state.onSelectAfterLessonAnswer}
              onSubmitAfterLessonQuiz={state.onSubmitAfterLessonQuiz}
              onAdvanceToNextLesson={state.handleAdvanceToNextLesson}
              onSubmitInVideoQuiz={state.handleSubmitInVideoQuiz}
              onJumpToQuizPoint={state.handleJumpToQuizPoint}
              onOverlayScrubClick={state.handleOverlayScrubClick}
              onSeekChange={state.handleSeekChange}
              setIsPlaying={state.setIsPlaying}
              setCurrentTime={state.setCurrentTime}
              setLastVideoTime={state.setLastVideoTime}
            />

            <LessonInfoPanel
              lessonTitle={state.selectedLesson.title}
              lessonDescription={state.selectedLesson.description}
              courseName={state.course.name}
              currentLessonDurationLabel={state.currentLessonDurationLabel}
              selectedLessonIndex={state.selectedLessonIndex}
              lessonsLength={state.lessons.length}
              completedLessonCount={state.completedLessonCount}
              courseProgressPercent={state.courseProgressPercent}
              instructorLabel={`Giảng viên #${state.course.userId}`}
            />
          </div>

          <div className="w-full shrink-0 xl:w-90 2xl:w-95">
            <LessonSidebar
              lessons={state.lessons}
              selectedLessonId={state.selectedLesson.id}
              lessonProgressRecords={state.lessonProgressRecords ?? []}
              completedLessonCount={state.completedLessonCount}
              onSelectLesson={state.handleSelectLesson}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
