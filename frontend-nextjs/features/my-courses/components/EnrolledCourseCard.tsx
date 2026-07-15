"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { PlayCircle, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { MyCourseItem } from "../api/my-courses.api";

interface Props {
  enrollment: MyCourseItem;
}

export function EnrolledCourseCard({ enrollment }: Props) {
  const course = enrollment.Course || enrollment.course;
  if (!course) return null;

  const title = course.title || course.name || "";
  const isCompleted = enrollment.status === "completed" || enrollment.progress >= 100;
  
  // Calculate the appropriate learn link
  const learnLink = `/courses/${course.id}/learn${enrollment.lastLessonId ? `?lesson=${enrollment.lastLessonId}` : ""}`;

  return (
    <Link href={learnLink} className="group block h-full">
      <Card className="h-full flex flex-col overflow-hidden border border-border/60 bg-card hover:border-primary/40 hover:shadow-md transition-all duration-200 rounded-lg p-0 gap-0">
        <div className="relative aspect-video w-full overflow-hidden bg-muted/40">
          {course.thumbnailUrl ? (
            <Image
              src={course.thumbnailUrl}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
              <PlayCircle className="w-12 h-12 opacity-50" />
            </div>
          )}
          
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
            <div className="flex items-center gap-2 rounded-md bg-primary/95 px-4 py-2 font-medium text-primary-foreground shadow-sm transition-all group-hover:translate-y-0">
              <PlayCircle className="w-5 h-5" />
              {isCompleted ? "Học lại" : "Tiếp tục học"}
            </div>
          </div>

          {isCompleted && (
            <div className="absolute top-2 right-2">
              <Badge className="bg-green-500/90 hover:bg-green-600 text-white shadow-sm border-none backdrop-blur-sm">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Hoàn thành
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="px-4 pt-3 pb-5 flex-1 flex flex-col justify-between">
          <h3 className="font-bold text-base line-clamp-2 mb-4 group-hover:text-primary transition-colors text-foreground/90">
            {title}
          </h3>
          
          <div className="space-y-2 mt-auto">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-medium text-xs">Tiến độ</span>
              <span className={`text-xs font-extrabold ${isCompleted ? "text-green-500" : "text-primary"}`}>
                {enrollment.progress || 0}%
              </span>
            </div>
            <Progress 
              value={enrollment.progress || 0} 
              className="h-1.5 bg-muted/60" 
            />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
