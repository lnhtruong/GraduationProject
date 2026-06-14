import { motion } from "framer-motion";
import { CheckCircle2, Circle, Clock3, Sparkles } from "lucide-react";
import type { LessonProgressRecord } from "../types";
import { InstructorLesson } from "@/features/instructor/course-management/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatTime, parseDurationToSeconds } from "../utils";
import { Separator } from "@/components/ui/separator";

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
  currentLessonProgressPercent = 0,
}: Props) {
  return (
    <Card className="h-fit overflow-hidden border-border/60 bg-card/95 shadow-[0_16px_48px_rgba(15,23,42,0.08)] xl:sticky xl:top-4">
      <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Tiếp theo</CardTitle>
            <p className="text-xs text-muted-foreground">
              Danh sách phát bài học — chọn bài để xem tiếp.
            </p>
          </div>
          <div className="rounded-full border border-border/60 bg-background px-3 py-1 text-xs text-muted-foreground">
            {completedLessonCount}/{lessons.length} hoàn thành
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
              const lessonDuration = parseDurationToSeconds(lesson.duration);

              // Tính toán phần trăm tiến trình thực tế
              let progressPercent = 0;
              if (isSelected) {
                progressPercent = currentLessonProgressPercent;
              } else if (isCompleted) {
                progressPercent = 100;
              } else {
                const record = lessonProgressRecords.find((r) => r.lessonId === lesson.id);
                if (
                  record &&
                  record.progress === "in_progress" &&
                  record.lastVideoPositionMs &&
                  lessonDuration > 0
                ) {
                  progressPercent = Math.min(
                    100,
                    Math.max(0, (record.lastVideoPositionMs / 1000 / lessonDuration) * 100),
                  );
                }
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
                      {isSelected || progressPercent > 0 ? (
                        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-primary/15">
                          <div
                            className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
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
        <Separator />
        <div className="flex items-center justify-between gap-3 p-3 text-xs text-muted-foreground">
          <span>
            Đã hoàn thành {completedLessonCount}/{lessons.length} bài học.
          </span>
          <span className="inline-flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Danh sách phát
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
