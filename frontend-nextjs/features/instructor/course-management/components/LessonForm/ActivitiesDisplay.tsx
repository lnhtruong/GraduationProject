"use client";

import { BookmarkPlus, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Activity {
  id: number;
  title?: string | null;
  activityType: "quiz" | "assignment";
  status: string;
}

interface Props {
  activities?: Activity[] | null;
  isLoading: boolean;
  timelineCount?: number;
  onEditQuiz?: (activityId: number) => void;
}

export function ActivitiesDisplay({
  activities,
  isLoading,
  timelineCount = 0,
  onEditQuiz,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="px-1">
        <h3 className="font-semibold text-sm">Hoạt động sau bài học</h3>
      </div>

      {isLoading ? (
        <div className="py-4 text-center text-xs text-muted-foreground">
          Đang tải hoạt động...
        </div>
      ) : activities && activities.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-border/70 bg-background">
          {activities.map((activity) => (
            <button
              key={activity.id}
              type="button"
              disabled={activity.activityType !== "quiz"}
              onClick={() => {
                if (activity.activityType === "quiz") {
                  onEditQuiz?.(activity.id);
                }
              }}
              className="group w-full text-left disabled:cursor-default"
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
            </button>
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
