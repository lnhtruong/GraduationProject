"use client";

import Link from "next/link";
import { BookmarkPlus, Clock3, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Activity {
  id: number;
  title?: string | null;
  activityType: "quiz" | "assignment";
  status: string;
}

interface Props {
  courseId: number;
  lessonId: number;
  activities?: Activity[] | null;
  isLoading: boolean;
  timelineCount?: number;
}

export function ActivitiesDisplay({
  courseId,
  lessonId,
  activities,
  isLoading,
  timelineCount = 0,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <h3 className="font-semibold text-sm">Hoạt động bài học</h3>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {isLoading ? "..." : (activities?.length ?? 0)}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            <Clock3 className="mr-1 h-3 w-3" />
            {timelineCount} mốc quiz
          </Badge>
        </div>
      </div>

      {isLoading ? (
        <div className="py-4 text-center text-xs text-muted-foreground">
          Đang tải hoạt động...
        </div>
      ) : activities && activities.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-border/70 bg-background">
          {activities.map((activity) => (
            <Link
              key={activity.id}
              href={`/instructor/courses/${courseId}/lessons/${lessonId}/quiz?activityId=${activity.id}`}
              className="group"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-3 py-2 transition-colors last:border-b-0 hover:bg-muted/35">
                <div className="flex min-w-0 items-center gap-2">
                  {activity.activityType === "quiz" ? (
                    <Play className="h-4 w-4 shrink-0 text-primary" />
                  ) : (
                    <BookmarkPlus className="h-4 w-4 shrink-0 text-yellow-600" />
                  )}
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-sm font-medium group-hover:text-primary">
                      {activity.title ||
                        `${activity.activityType === "quiz" ? "Quiz" : "Assignment"} #${activity.id}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.activityType === "quiz" ? "Quiz" : "Bài tập"}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="shrink-0 text-xs sm:ml-2">
                  {activity.status}
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed py-4 text-center text-xs text-muted-foreground">
          Chưa có hoạt động nào
        </div>
      )}
    </div>
  );
}
