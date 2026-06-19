"use client";

import { BookmarkPlus, Eye, EyeOff, Play } from "lucide-react";
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
  onToggleStatus?: (activityId: number, nextStatus: "public" | "draft") => void;
  isTogglingStatus?: boolean;
}

export function ActivitiesDisplay({
  activities,
  isLoading,
  timelineCount = 0,
  onEditQuiz,
  onToggleStatus,
  isTogglingStatus = false,
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
          {activities.map((activity) => {
            const isQuiz = activity.activityType === "quiz";
            const isPublic = activity.status === "public";
            return (
              <div
                key={activity.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-3 py-2 transition-colors last:border-b-0 hover:bg-muted/35"
              >
                <button
                  type="button"
                  disabled={!isQuiz}
                  onClick={() => {
                    if (isQuiz) onEditQuiz?.(activity.id);
                  }}
                  className="group flex min-w-0 flex-1 items-center gap-2 text-left disabled:cursor-default"
                >
                  {isQuiz ? (
                    <Play className="h-4 w-4 shrink-0 text-primary" />
                  ) : (
                    <BookmarkPlus className="h-4 w-4 shrink-0 text-yellow-600" />
                  )}
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-sm font-medium group-hover:text-primary">
                      {activity.title ||
                        `${isQuiz ? "Quiz" : "Assignment"} #${activity.id}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isQuiz ? "Quiz" : "Bài tập"}
                    </p>
                  </div>
                </button>

                <div className="flex shrink-0 items-center gap-2 sm:ml-2">
                  <Badge
                    variant={isPublic ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {isPublic ? "Đang hiển thị" : "Đang ẩn"}
                  </Badge>
                  {isQuiz && onToggleStatus && (
                    <button
                      type="button"
                      disabled={isTogglingStatus}
                      onClick={() =>
                        onToggleStatus(
                          activity.id,
                          isPublic ? "draft" : "public",
                        )
                      }
                      title={isPublic ? "Ẩn quiz khỏi học viên" : "Hiện quiz cho học viên"}
                      className="inline-flex items-center gap-1 rounded-md border border-border/70 px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isPublic ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                      {isPublic ? "Ẩn" : "Hiện"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed py-4 text-center text-xs text-muted-foreground">
          Chưa có hoạt động nào
        </div>
      )}
    </div>
  );
}
