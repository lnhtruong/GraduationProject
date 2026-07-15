"use client";

import { useState } from "react";
import { UserCheck, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AppEmptyState } from "@/features/_shared/components/AppEmptyState";
import { AppLoadingState } from "@/features/_shared/components/AppLoadingState";
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
    <Card className="rounded-lg border-border/60 py-0 text-center transition-colors hover:border-primary/40 hover:bg-accent">
      <CardContent className="flex flex-col items-center gap-2 p-4">
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
      </CardContent>
    </Card>
  );
}

export function FollowingInstructorsGrid() {
  const { data: instructors, isLoading, error } = useFollowingInstructors();

  if (isLoading) {
    return <AppLoadingState variant="cards" count={8} message="Đang tải giảng viên đang theo dõi..." />;
  }

  if (error) {
    return (
      <AppEmptyState
        icon={<Users className="h-8 w-8" />}
        title="Không thể tải danh sách"
        description="Hiện chưa thể tải danh sách giảng viên đang theo dõi. Vui lòng thử lại sau."
        tone="destructive"
      />
    );
  }

  if (!instructors || instructors.length === 0) {
    return (
      <AppEmptyState
        icon={<Users className="h-8 w-8" />}
        title="Bạn chưa theo dõi giảng viên nào"
        description="Khám phá khóa học và theo dõi giảng viên bạn yêu thích để xem nhanh tại đây."
      />
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
