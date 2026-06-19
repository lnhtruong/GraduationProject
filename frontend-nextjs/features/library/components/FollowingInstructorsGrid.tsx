"use client";

import { useState } from "react";
import { UserCheck, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useFollowingInstructors, useUnfollowMutation } from "@/features/instructor/follow/follow.hooks";
import type { FollowingInstructor } from "@/features/instructor/follow/types";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

function InstructorCard({ instructor }: { instructor: FollowingInstructor }) {
  const [hovered, setHovered] = useState(false);
  const unfollow = useUnfollowMutation(instructor.id);

  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-border/60 bg-card p-4 text-center transition-colors hover:border-primary/40 hover:bg-accent">
      <Avatar className="h-14 w-14 border-2 border-primary/20">
        {instructor.avatarUrl && (
          <AvatarImage src={instructor.avatarUrl} alt={instructor.name} />
        )}
        <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">
          {getInitials(instructor.name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 w-full">
        <p className="truncate text-sm font-semibold">{instructor.name}</p>
      </div>
      <Button
        variant="outline"
        size="sm"
        disabled={unfollow.isPending}
        onClick={() => unfollow.mutate()}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={
          hovered
            ? "border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/10 hover:text-destructive"
            : "border-border bg-muted text-muted-foreground"
        }
      >
        <UserCheck className="mr-1.5 h-3.5 w-3.5" />
        {hovered ? "Bỏ theo dõi" : "Đang theo dõi"}
      </Button>
    </div>
  );
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
            <Skeleton className="h-8 w-24 rounded-md" />
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
      {instructors.map((instructor) => (
        <InstructorCard key={instructor.id} instructor={instructor} />
      ))}
    </div>
  );
}
