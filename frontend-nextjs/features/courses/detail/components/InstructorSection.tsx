"use client";

import { useState } from "react";
import { Star, Users, BookOpen } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "../../utils";
import type { CourseInstructor } from "../../types";

interface Props {
  instructor: CourseInstructor;
}

export function InstructorSection({ instructor }: Props) {
  const [bioExpanded, setBioExpanded] = useState(false);
  const initials = getInitials(instructor.firstName, instructor.lastName);
  const fullName = `${instructor.firstName} ${instructor.lastName}`;

  return (
    <section id="instructor" className="rounded-xl border border-border/60 bg-card p-6">
      <h2 className="mb-5 text-xl font-bold">Giảng viên</h2>

      <div className="flex gap-4">
        {/* Avatar */}
        <Avatar className="h-20 w-20 shrink-0 border-2 border-primary/30">
          {instructor.avatarUrl && <AvatarImage src={instructor.avatarUrl} alt={fullName} />}
          <AvatarFallback className="bg-primary/10 text-lg font-bold text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>

        {/* Info */}
        <div className="min-w-0 flex-1 space-y-1.5">
          <h3 className="text-lg font-bold text-primary">{fullName}</h3>
          {instructor.title && (
            <p className="text-sm text-muted-foreground">{instructor.title}</p>
          )}

          {/* Stats row */}
          <div className="flex flex-wrap items-center gap-4 pt-1 text-sm">
            {instructor.avgRating !== undefined && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Star className="h-4 w-4 fill-primary text-primary" />
                {instructor.avgRating.toFixed(1)} đánh giá
              </span>
            )}
            {instructor.totalStudents !== undefined && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="h-4 w-4" />
                {instructor.totalStudents.toLocaleString("vi-VN")} học viên
              </span>
            )}
            {instructor.totalCourses !== undefined && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <BookOpen className="h-4 w-4" />
                {instructor.totalCourses} khoá học
              </span>
            )}
          </div>

          {/* Bio */}
          {instructor.bio && (
            <div className="pt-1">
              <p
                className={`text-sm leading-relaxed text-muted-foreground ${
                  bioExpanded ? "" : "line-clamp-4"
                }`}
              >
                {instructor.bio}
              </p>
              <button
                onClick={() => setBioExpanded((e) => !e)}
                className="mt-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
              >
                {bioExpanded ? "Thu gọn ▲" : "Xem thêm ▼"}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
