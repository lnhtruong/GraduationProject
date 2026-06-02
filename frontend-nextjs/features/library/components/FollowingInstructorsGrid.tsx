"use client";

import { Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useFollowingInstructors } from "@/features/instructor/follow/follow.hooks";

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function FollowingInstructorsGrid() {
  const { data: instructors, isLoading, error } = useFollowingInstructors();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 rounded-xl border border-border/60 bg-card p-4">
            <Skeleton className="h-14 w-14 rounded-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p className="py-8 text-center text-sm text-destructive">
        Không thể tải danh sách. Vui lòng thử lại sau.
      </p>
    );
  }

  if (!instructors || instructors.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
        <Users className="h-12 w-12 opacity-40" />
        <p className="text-sm">Bạn chưa theo dõi giảng viên nào.</p>
        <p className="text-xs opacity-70">Khám phá khoá học và theo dõi giảng viên bạn yêu thích.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {instructors.map((instructor) => {
        const fullName = `${instructor.firstName} ${instructor.lastName}`;
        const initials = getInitials(instructor.firstName, instructor.lastName);
        return (
          <div
            key={instructor.id}
            className="flex flex-col items-center gap-2 rounded-xl border border-border/60 bg-card p-4 text-center transition-colors hover:border-primary/40 hover:bg-accent"
          >
            <Avatar className="h-14 w-14 border-2 border-primary/20">
              {instructor.avatarUrl && (
                <AvatarImage src={instructor.avatarUrl} alt={fullName} />
              )}
              <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 w-full">
              <p className="truncate text-sm font-semibold">{fullName}</p>
              {instructor.title && (
                <p className="truncate text-xs text-muted-foreground">{instructor.title}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
