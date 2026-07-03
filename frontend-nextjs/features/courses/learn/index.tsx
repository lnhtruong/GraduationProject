"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ListVideo } from "lucide-react";
import { useCourseLearnPage } from "./hooks/useCourseLearnPage";
import { Card, CardContent } from "@/components/ui/card";
import { LessonVideoCard } from "./components/LessonVideoCard";
import { LessonSidebar } from "./components/LessonSidebar";
import { LessonInfoPanel } from "./components/LessonInfoPanel";
import { DiscussionPanel } from "./components/DiscussionPanel";
import { useAuthState } from "@/features/auth/hooks/useAuth";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface Props {
  courseId: number;
}

export default function CourseLearnPage({ courseId }: Props) {
  const state = useCourseLearnPage(courseId);
  const { isAuthenticated } = useAuthState();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

      <main className="relative mx-auto max-w-7xl px-4 py-5 sm:px-5 lg:px-8 lg:py-7">
        <div className="mb-5 flex items-center gap-3 text-muted-foreground">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs sm:text-sm">
            <Link href="/courses" className="whitespace-nowrap hover:text-foreground transition-colors">
              Khóa học
            </Link>
            <span className="opacity-60 select-none">›</span>
            <Link href={`/courses/${courseId}`} className="truncate max-w-[8rem] sm:max-w-[18rem] md:max-w-[24rem] whitespace-nowrap hover:text-foreground transition-colors" title={state.course.name}>
              {state.course.name}
            </Link>
            <span className="opacity-60 select-none">›</span>
            <span className="font-semibold truncate max-w-[8rem] sm:max-w-[18rem] md:max-w-[24rem] whitespace-nowrap" title={state.selectedLesson.title}>
              {state.selectedLesson.title}
            </span>
          </nav>
        </div>

        <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
          <div className="min-w-0 flex-1 space-y-6">
            <LessonVideoCard
              lessonTitle={state.selectedLesson.title}
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
              afterLessonCorrectAnswers={state.afterLessonCorrectAnswers}
              hasNextLesson={state.hasNextLesson}
              nextLessonCountdown={state.nextLessonCountdown}
              isTransitioningNext={state.isTransitioningNext}
              nextLessonTitle={state.nextLesson?.title}
              showAfterLessonOverlay={state.showAfterLessonOverlay}
              playbackRate={state.playbackRate}
              volume={state.volume}
              isMuted={state.isMuted}
              isFullscreen={state.isFullscreen}
              setIsFullscreen={state.setIsFullscreen}
              videoRef={state.videoRef}
              isQuizSolved={state.isQuizSolved}
              qualityLevels={state.qualityLevels}
              currentQualityLevel={state.currentQualityLevel}
              videoAspectRatio={state.videoAspectRatio}
              onQualityLevelsLoaded={state.onQualityLevelsLoaded}
              onSetQualityLevel={state.onSetQualityLevel}
              onTogglePlayback={state.handleTogglePlayback}
              onSetPlaybackRate={state.handleSetPlaybackRate}
              onToggleMute={state.handleToggleMute}
              onVolumeChange={state.handleVolumeChange}
              onToggleFullscreen={state.handleToggleFullscreen}
              onTogglePictureInPicture={state.handleTogglePictureInPicture}
              onVideoKeyDown={state.handleVideoKeyDown}
              onTimeUpdate={state.handleTimeUpdate}
              onVideoEnded={state.handleVideoEnded}
              onVideoMetadataLoaded={state.handleVideoMetadataLoaded}
              onSelectInVideoAnswer={state.onSelectInVideoAnswer}
              onSelectAfterLessonAnswer={state.onSelectAfterLessonAnswer}
              onSubmitAfterLessonQuiz={state.onSubmitAfterLessonQuiz}
              onAdvanceToNextLesson={state.handleAdvanceToNextLesson}
              onRetryAfterLessonQuiz={state.handleRetryAfterLessonQuiz}
              onSubmitInVideoQuiz={state.handleSubmitInVideoQuiz}
              onJumpToQuizPoint={state.handleJumpToQuizPoint}
              onOverlayScrubClick={state.handleOverlayScrubClick}
              onSeekChange={state.handleSeekChange}
              setIsPlaying={state.setIsPlaying}
              setCurrentTime={state.setCurrentTime}
              setLastVideoTime={state.setLastVideoTime}
            />

            <div className="space-y-6">
              <LessonInfoPanel
                lessonTitle={state.selectedLesson.title}
                lessonDescription={state.selectedLesson.description}
                courseName={state.course.name}
                instructor={state.instructor}
                lessonId={state.selectedLesson.id}
                isAuthenticated={isAuthenticated}
              />

              <DiscussionPanel
                lessonId={state.selectedLesson.id}
                lessonTitle={state.selectedLesson.title}
              />
            </div>
          </div>

          {/* Desktop Playlist Sidebar */}
          <div className="hidden xl:block w-full shrink-0 xl:w-90 2xl:w-95">
            <LessonSidebar
              lessons={state.lessons}
              selectedLessonId={state.selectedLesson.id}
              lessonProgressRecords={state.lessonProgressRecords ?? []}
              completedLessonCount={state.completedLessonCount}
              onSelectLesson={state.handleSelectLesson}
              currentLessonProgressPercent={state.progressPercent}
            />
          </div>
        </div>

        {/* Mobile Floating Playlist Button (FAB) */}
        <div className="xl:hidden fixed bottom-6 left-6 z-40">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="flex h-12 items-center gap-2 rounded-full bg-primary px-4 py-3 text-xs sm:text-sm font-bold text-primary-foreground shadow-2xl hover:bg-primary/95 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <ListVideo className="h-4 w-4" />
                <span>Danh sách bài ({state.lessons.length})</span>
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="p-0 w-80 sm:w-96 border-l border-border/80 bg-card">
              <SheetHeader className="sr-only">
                <SheetTitle>Danh sách bài giảng</SheetTitle>
              </SheetHeader>
              <div className="h-full">
                <LessonSidebar
                  lessons={state.lessons}
                  selectedLessonId={state.selectedLesson.id}
                  lessonProgressRecords={state.lessonProgressRecords ?? []}
                  completedLessonCount={state.completedLessonCount}
                  onSelectLesson={(id) => {
                    state.handleSelectLesson(id);
                    setSidebarOpen(false);
                  }}
                  currentLessonProgressPercent={state.progressPercent}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </main>
    </div>
  );
}
