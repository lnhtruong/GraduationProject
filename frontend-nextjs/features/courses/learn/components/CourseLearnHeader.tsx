import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge, BookOpen, CheckCircle2, Clock3, Sparkles } from "lucide-react";


interface Props {
  lessonsLength: number;
  totalQuizMarkers: number;
  progressSyncing: boolean;
  courseName: string;
  completedLessonCount: number;
  totalLessonDurationLabel: string;
  courseProgressPercent: number;
  selectedLessonTitle: string;
  currentLessonDurationLabel: string;
}

export function CourseLearnHeader({
  lessonsLength,
  totalQuizMarkers,
  progressSyncing,
  courseName,
  completedLessonCount,
  totalLessonDurationLabel,
  courseProgressPercent,
  selectedLessonTitle,
  currentLessonDurationLabel,
}: Props) {
  return (
    <Card className="mb-5 overflow-hidden border-border/70 bg-card/90 shadow-sm backdrop-blur-sm">
      <CardContent className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center lg:p-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge className="bg-primary text-primary-foreground hover:bg-primary/90">
              Roadmap học tập
            </Badge>
            <span>{lessonsLength} bài học</span>
            <span>•</span>
            <span>{totalQuizMarkers} quiz trong video</span>
            <span>•</span>
            <span>
              {progressSyncing ? "Đang lưu tiến độ" : "Tiến độ đã đồng bộ"}
            </span>
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Học bài giảng: {courseName}
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Giao diện dành cho người học: lesson list rõ ràng, quiz mốc theo
              timeline video, quiz sau bài học mở ngay trong lesson.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 pt-1">
            <div className="rounded-2xl border border-border bg-muted/50 px-4 py-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <BookOpen className="h-4 w-4 text-primary" />
                Tổng bài
              </div>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {lessonsLength}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-muted/50 px-4 py-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Đã hoàn thành
              </div>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {completedLessonCount}/{lessonsLength}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-muted/50 px-4 py-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock3 className="h-4 w-4 text-primary" />
                Tổng thời lượng
              </div>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {totalLessonDurationLabel}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-primary/20 bg-primary p-5 text-primary-foreground shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-primary-foreground/90">
            <Sparkles className="h-4 w-4" />
            Tiến độ khóa học
          </div>
          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
              <p className="text-4xl font-semibold tracking-tight">
                {courseProgressPercent}%
              </p>
              <p className="mt-1 text-sm text-primary-foreground/85">
                Đã học xong {completedLessonCount} bài
              </p>
            </div>
            <div className="rounded-2xl bg-primary-foreground/15 px-3 py-2 text-right backdrop-blur-sm">
              <p className="text-[11px] uppercase tracking-[0.18em] text-primary-foreground/80">
                Bài hiện tại
              </p>
              <p className="mt-1 text-sm font-medium">{selectedLessonTitle}</p>
              <p className="text-xs text-primary-foreground/80">
                {currentLessonDurationLabel}
              </p>
            </div>
          </div>
          <Progress
            value={courseProgressPercent}
            className="mt-4 h-2 bg-primary-foreground/25"
          />
        </div>
      </CardContent>
    </Card>
  );
}
