"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportDialog } from "@/features/reports/components/ReportDialog";

interface Props {
  lessonTitle: string;
  lessonDescription?: string;
  courseName: string;
  currentLessonDurationLabel: string;
  selectedLessonIndex: number;
  lessonsLength: number;
  completedLessonCount: number;
  courseProgressPercent: number;
  instructorLabel: string;
  lessonId: number;
  isAuthenticated: boolean;
}

export function LessonInfoPanel({
  lessonTitle,
  lessonDescription,
  courseName,
  currentLessonDurationLabel,
  selectedLessonIndex,
  lessonsLength,
  completedLessonCount,
  courseProgressPercent,
  instructorLabel,
  lessonId,
  isAuthenticated,
}: Props) {
  const [reportOpen, setReportOpen] = useState(false);

  return (
    <Card className="overflow-hidden border-border/70 bg-card/90 shadow-sm">
      <CardContent className="space-y-5 p-4 sm:p-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="rounded-full border-border/70">
              Bài {selectedLessonIndex + 1}/{lessonsLength}
            </Badge>
            <span>{currentLessonDurationLabel}</span>
            <span>•</span>
            <span>{courseProgressPercent}% tiến độ khóa học</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {lessonTitle}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Khóa học: {courseName}
            </p>
          </div>

          <div className="flex items-center gap-3 border-b border-border/50 pb-4">
            <Avatar className="h-10 w-10 border border-border/60">
              <AvatarFallback className="bg-muted text-foreground">
                {instructorLabel.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">
                {instructorLabel}
              </p>
              <p className="text-xs text-muted-foreground">
                Đã hoàn thành {completedLessonCount}/{lessonsLength} bài học
              </p>
            </div>
            {isAuthenticated && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground/50 hover:text-destructive"
                title="Báo cáo bài học"
                onClick={() => setReportOpen(true)}
              >
                <Flag className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-muted/70">
            <TabsTrigger value="overview">Tổng quan</TabsTrigger>
            <TabsTrigger value="resources">Tài liệu</TabsTrigger>
            <TabsTrigger value="qa">Hỏi đáp</TabsTrigger>
          </TabsList>
          <TabsContent
            value="overview"
            className="pt-3 text-sm leading-6 text-muted-foreground"
          >
            {lessonDescription?.trim()
              ? lessonDescription
              : "Bài học này chưa có mô tả chi tiết. Bạn có thể xem video và làm quiz để tiếp tục lộ trình."}
          </TabsContent>
          <TabsContent
            value="resources"
            className="pt-3 text-sm leading-6 text-muted-foreground"
          >
            Tài liệu của bài học sẽ được cập nhật trong mục này.
          </TabsContent>
          <TabsContent
            value="qa"
            className="pt-3 text-sm leading-6 text-muted-foreground"
          >
            Mục hỏi đáp đang chờ tích hợp API thảo luận theo bài học.
          </TabsContent>
        </Tabs>
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
