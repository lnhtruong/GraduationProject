"use client";

import Link from "next/link";
import { Play, BookmarkPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

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
}

export function ActivitiesDisplay({
  courseId,
  lessonId,
  activities,
  isLoading,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="font-semibold text-sm">Hoạt động bài học</h3>
        <Badge variant="outline" className="text-xs">
          {isLoading ? "..." : (activities?.length ?? 0)}
        </Badge>
      </div>

      {isLoading ? (
        <div className="py-4 text-center text-xs text-muted-foreground">
          Đang tải hoạt động...
        </div>
      ) : activities && activities.length > 0 ? (
        <div className="grid gap-2">
          {activities.map((activity) => (
            <Link
              key={activity.id}
              href={`/instructor/courses/${courseId}/lessons/${lessonId}/quiz?activityId=${activity.id}`}
            >
              <Card className="border bg-muted/50 transition cursor-pointer hover:bg-muted/70">
                <CardContent className="flex items-center justify-between p-3">
                  <div className="flex min-w-0 items-center gap-2">
                    {activity.activityType === "quiz" ? (
                      <Play className="h-4 w-4 shrink-0 text-primary" />
                    ) : (
                      <BookmarkPlus className="h-4 w-4 shrink-0 text-yellow-600" />
                    )}
                    <div className="min-w-0">
                      <p className="line-clamp-1 text-sm font-medium">
                        {activity.title ||
                          `${activity.activityType === "quiz" ? "Quiz" : "Assignment"} #${activity.id}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.activityType === "quiz" ? "Quiz" : "Bài tập"}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="ml-2 shrink-0 text-xs">
                    {activity.status}
                  </Badge>
                </CardContent>
              </Card>
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
