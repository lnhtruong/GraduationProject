import { motion } from "framer-motion";
import { CheckCircle2, Circle, Clock3 } from "lucide-react";
import type { LessonProgressRecord } from "../types";
import { InstructorLesson } from "@/features/instructor/course-management/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatTime, parseDurationToSeconds } from "../utils";

interface Props {
  lessons: InstructorLesson[];
  selectedLessonId: number;
  lessonProgressRecords: LessonProgressRecord[];
  completedLessonCount: number;
  onSelectLesson: (lessonId: number) => void;
  currentLessonProgressPercent?: number;
}

export function LessonSidebar({
  lessons,
  selectedLessonId,
  lessonProgressRecords,
  completedLessonCount,
  onSelectLesson,
  currentLessonProgressPercent,
}: Props) {
  return (
    <Card className="h-fit overflow-hidden border border-border/40 bg-card/95 shadow-[0_16px_48px_rgba(15,23,42,0.06)] xl:sticky xl:top-4 rounded-3xl">
      <CardHeader className="border-b border-border/40 bg-muted/20 p-4 md:p-5">
        <div className="space-y-2">
          <CardTitle className="text-base font-bold">Danh sách phát</CardTitle>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground font-medium">
              <span>Tiến độ học tập</span>
              <span>{completedLessonCount}/{lessons.length} bài học</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-500" 
                style={{ width: `${lessons.length > 0 ? (completedLessonCount / lessons.length) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="max-h-112 sm:max-h-128 xl:h-[calc(100vh-8.5rem)] xl:min-h-105">
          <div className="space-y-2 p-3">
            {lessons.map((lesson, index) => {
              const isSelected = lesson.id === selectedLessonId;
              const isCompleted = lessonProgressRecords.some(
                (record) =>
                  record.lessonId === lesson.id &&
                  record.progress === "completed",
              );
              const progressRecord = lessonProgressRecords.find(
                (record) => record.lessonId === lesson.id,
              );
              const lessonDuration = parseDurationToSeconds(lesson.duration);

              let progressPercent = 0;
              if (isSelected) {
                progressPercent = currentLessonProgressPercent ?? 0;
              } else if (isCompleted) {
                progressPercent = 100;
              } else if (progressRecord?.lastVideoPositionMs && lessonDuration > 0) {
                const lastPosSec = progressRecord.lastVideoPositionMs / 1000;
                progressPercent = Math.min(100, Math.round((lastPosSec / lessonDuration) * 100));
              }

              return (
                <button
                  key={lesson.id}
                  type="button"
                  onClick={() => onSelectLesson(lesson.id)}
                  className={`group w-full rounded-2xl border p-3 text-left transition-all ${isSelected ? "border-primary/40 bg-primary/10 shadow-sm" : "border-border/50 bg-card hover:border-primary/30 hover:bg-muted/60"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="inline-flex h-6 items-center rounded-full bg-muted px-2 text-[11px] font-medium text-muted-foreground">
                          Bài {index + 1}
                        </span>
                        {isSelected ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary">
                            <motion.span
                              className="flex items-end gap-0.5"
                              aria-hidden
                            >
                              <motion.span
                                animate={{ height: [6, 14, 6] }}
                                transition={{
                                  duration: 0.9,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                                }}
                                className="block w-0.5 rounded-full bg-primary"
                              />
                              <motion.span
                                animate={{ height: [10, 4, 10] }}
                                transition={{
                                  duration: 1.05,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                                }}
                                className="block w-0.5 rounded-full bg-primary"
                              />
                              <motion.span
                                animate={{ height: [7, 16, 7] }}
                                transition={{
                                  duration: 0.8,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                                }}
                                className="block w-0.5 rounded-full bg-primary"
                              />
                            </motion.span>
                            Đang xem
                          </span>
                        ) : isCompleted ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Hoàn thành
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted/70 px-2 py-1 text-[11px] font-medium text-muted-foreground">
                            Chưa xong
                          </span>
                        )}
                      </div>
                      <p className="line-clamp-2 text-sm font-semibold leading-5 text-foreground">
                        {lesson.title}
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock3 className="h-3.5 w-3.5" />
                        <span>{formatTime(lessonDuration)}</span>
                      </div>
                      {progressPercent > 0 && progressPercent < 100 ? (
                        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-primary/15">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      ) : null}
                    </div>
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition ${isCompleted ? "border-primary/70 bg-primary/15 text-primary shadow-[0_0_0_2px_hsl(var(--primary)/0.2)]" : "border-border/60 bg-background text-muted-foreground group-hover:border-primary/40 group-hover:text-primary"}`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4 drop-shadow-[0_1px_2px_hsl(var(--primary)/0.4)]" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
