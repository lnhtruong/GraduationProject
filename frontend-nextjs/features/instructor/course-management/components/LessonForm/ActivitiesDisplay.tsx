"use client";

import { NotebookText, Play, BookmarkPlus, ChevronRight, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
  onEditQuiz,
}: Props) {
  return (
    <Card className="border-border/60 shadow-sm bg-card">
      <CardContent className="space-y-4 p-6">
        {/* Card Header */}
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <NotebookText className="h-4 w-4" />
          </div>
          <div>
            <p className="text-base font-semibold">Hoạt động bổ trợ sau bài học</p>
            <p className="text-xs text-muted-foreground">
              Quản lý các câu hỏi trắc nghiệm (Quiz) hoặc bài tập giúp học viên ôn tập kiến thức sau bài học.
            </p>
          </div>
        </div>

        <div className="pt-2">
          {isLoading ? (
            <div className="py-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>Đang tải danh sách hoạt động...</span>
            </div>
          ) : activities && activities.length > 0 ? (
            <div className="divide-y divide-border/40 overflow-hidden rounded-xl border border-border/60 bg-background shadow-xs">
              {activities.map((activity) => {
                const isQuiz = activity.activityType === "quiz";

                return (
                  <button
                    key={activity.id}
                    type="button"
                    disabled={!isQuiz}
                    onClick={() => {
                      if (isQuiz) {
                        onEditQuiz?.(activity.id);
                      }
                    }}
                    className={cn(
                      "group flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left transition-colors duration-200",
                      isQuiz ? "cursor-pointer hover:bg-muted/30" : "cursor-default opacity-85"
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border shadow-xs transition-colors duration-200",
                        isQuiz
                          ? "bg-primary/5 text-primary border-primary/10 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary"
                          : "bg-amber-500/5 text-amber-600 border-amber-500/10"
                      )}>
                        {isQuiz ? (
                          <Play className="h-3.5 w-3.5 fill-current" />
                        ) : (
                          <BookmarkPlus className="h-3.5 w-3.5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="line-clamp-1 text-sm font-semibold text-foreground/95 group-hover:text-primary transition-colors duration-200">
                          {activity.title || getActivityFallbackTitle(isQuiz)}
                        </p>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">
                          {isQuiz ? "Trắc nghiệm (Quiz)" : "Bài tập bổ trợ"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {isQuiz && (
                        <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-transform duration-200 group-hover:translate-x-0.5" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-border/40 bg-muted/5 p-6 text-center flex flex-col items-center justify-center gap-2">
              <div className="rounded-full bg-muted p-2.5 text-muted-foreground/60">
                <NotebookText className="h-5 w-5" />
              </div>
              <p className="text-xs font-semibold text-foreground/80 mt-1">Chưa có hoạt động bổ trợ nào</p>
              <p className="text-[11px] text-muted-foreground max-w-xs leading-relaxed">
                Tạo các bài trắc nghiệm (Quiz) hoặc bài tập sau bài học để giúp học viên kiểm tra kiến thức của mình.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function getActivityFallbackTitle(isQuiz: boolean): string {
  return isQuiz ? "Trắc nghiệm chưa đặt tên" : "Bài tập chưa đặt tên";
}
