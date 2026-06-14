"use client";

import { useState } from "react";
import { Flag, FileText, ExternalLink } from "lucide-react";
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
    <Card className="overflow-hidden border-border/60 bg-card/95 shadow-[0_16px_50px_rgba(15,23,42,0.08)]">
      <CardContent className="space-y-5 p-4 sm:p-6">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="rounded-full border-border/70">
              Bài {selectedLessonIndex + 1}/{lessonsLength}
            </Badge>
            <Badge variant="secondary" className="rounded-full">
              {currentLessonDurationLabel}
            </Badge>
            <Badge variant="secondary" className="rounded-full">
              {courseProgressPercent}% tiến độ
            </Badge>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {lessonTitle}
            </h1>
            <p className="text-sm text-muted-foreground">
              Khóa học: {courseName}
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/25 p-3">
            <Avatar className="h-10 w-10 border border-border/60 bg-background">
              <AvatarFallback className="bg-muted text-foreground">
                {instructorLabel.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
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
                className="h-9 w-9 shrink-0 text-muted-foreground/60 hover:bg-destructive/5 hover:text-destructive"
                title="Báo cáo bài học"
                onClick={() => setReportOpen(true)}
              >
                <Flag className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        {(() => {
          // Trích xuất các liên kết tải tài liệu học tập từ mô tả bài học
          const extractLinks = (text?: string) => {
            if (!text) return [];
            const urlRegex = /(https?:\/\/[^\s]+)/g;
            const matches = text.match(urlRegex);
            return matches ? Array.from(new Set(matches)) : [];
          };
          const links = extractLinks(lessonDescription);

          return (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-muted/70 p-1">
                <TabsTrigger value="overview">Tổng quan</TabsTrigger>
                <TabsTrigger value="resources">Tài liệu học tập</TabsTrigger>
              </TabsList>
              <TabsContent
                value="overview"
                className="pt-3 text-sm leading-6 text-muted-foreground whitespace-pre-wrap"
              >
                {lessonDescription?.trim()
                  ? lessonDescription
                  : "Bài học này chưa có mô tả chi tiết. Bạn có thể xem video và làm quiz để tiếp tục lộ trình."}
              </TabsContent>
              <TabsContent value="resources" className="pt-3">
                {links.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground mb-3">
                      Tìm thấy {links.length} tài liệu/liên kết đính kèm trong bài học này:
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {links.map((link, idx) => {
                        let linkLabel = "Liên kết tài liệu " + (idx + 1);
                        if (link.includes("drive.google.com")) linkLabel = "Google Drive Folder/File";
                        else if (link.includes("github.com")) linkLabel = "GitHub Repository";
                        else if (link.includes("youtube.com") || link.includes("youtu.be")) linkLabel = "Video tham khảo thêm";
                        else if (link.endsWith(".pdf")) linkLabel = "Tài liệu PDF đính kèm";
                        
                        return (
                          <a
                            key={idx}
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between gap-3 rounded-xl border border-border/80 bg-background/50 hover:bg-muted/80 p-3 text-xs font-medium text-foreground transition"
                          >
                            <span className="flex items-center gap-2 truncate">
                              <FileText className="h-4 w-4 shrink-0 text-primary" />
                              <span className="truncate">{linkLabel}</span>
                            </span>
                            <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          </a>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-7 text-center text-muted-foreground">
                    <FileText className="h-8 w-8 text-muted-foreground/30 mb-2" />
                    <p className="text-xs">Bài học này chưa đính kèm tài liệu tham khảo nào.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          );
        })()}
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
