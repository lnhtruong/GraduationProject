"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ReportDialog } from "@/features/reports/components/ReportDialog";

interface Props {
  lessonTitle: string;
  lessonDescription?: string;
  courseName: string;
  instructor?: {
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  } | null;
  lessonId: number;
  isAuthenticated: boolean;
}

export function LessonInfoPanel({
  lessonTitle,
  lessonDescription,
  courseName,
  instructor,
  lessonId,
  isAuthenticated,
}: Props) {
  const [reportOpen, setReportOpen] = useState(false);

  const fullName = instructor
    ? `${instructor.firstName} ${instructor.lastName}`.trim()
    : "Giảng viên";

  const initials = instructor
    ? `${instructor.firstName?.[0] ?? ""}${instructor.lastName?.[0] ?? ""}`.trim().toUpperCase() || "GI"
    : "GI";

  const linkify = (text?: string) => {
    if (!text) return "";
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-semibold break-all"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <Card className="overflow-hidden border-border/60 bg-card/95 shadow-[0_16px_50px_rgba(15,23,42,0.08)]">
      <CardContent className="space-y-5 p-4 sm:p-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {lessonTitle}
              </h1>
              {isAuthenticated && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0 rounded-full border border-border/60 text-muted-foreground/60 hover:bg-destructive/5 hover:text-destructive animate-in fade-in zoom-in-95 duration-200"
                  title="Báo cáo bài học"
                  onClick={() => setReportOpen(true)}
                >
                  <Flag className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Khóa học: {courseName}
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/25 p-3">
            <Avatar className="h-10 w-10 border border-border/60 bg-background">
              {instructor?.avatarUrl && (
                <AvatarImage
                  src={instructor.avatarUrl}
                  alt={fullName}
                  className="object-cover"
                />
              )}
              <AvatarFallback className="bg-muted text-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {fullName}
              </p>
              <p className="text-xs text-muted-foreground">
                Giảng viên khóa học
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border/60 text-sm leading-6 text-muted-foreground whitespace-pre-line">
          {lessonDescription?.trim()
            ? linkify(lessonDescription)
            : "Bài học này chưa có mô tả chi tiết. Bạn có thể xem video và làm quiz để tiếp tục lộ trình."}
        </div>
      </CardContent>

      <ReportDialog
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="lesson"
        targetId={lessonId}
        targetLabel="bài học này"
      />
    </Card>
  );
}
