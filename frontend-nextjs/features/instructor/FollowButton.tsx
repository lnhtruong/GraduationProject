"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthState } from "@/features/auth/hooks/useAuth";
import {
  useInstructorStats,
  useFollowMutation,
  useUnfollowMutation,
} from "./follow/follow.hooks";

interface Props {
  instructorId: number;
}

function formatCount(count: number): string {
  return new Intl.NumberFormat("vi-VN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(count);
}

export function FollowButton({ instructorId }: Props) {
  const router = useRouter();
  const { isAuthenticated } = useAuthState();
  const { data: stats, isLoading } = useInstructorStats(instructorId);
  const followMutation = useFollowMutation(instructorId);
  const unfollowMutation = useUnfollowMutation(instructorId);

  const [hovered, setHovered] = useState(false);

  const isFollowing = stats?.isFollowing ?? false;
  const followerCount = stats?.followerCount ?? 0;
  const isPending = followMutation.isPending || unfollowMutation.isPending;

  function handleClick() {
    if (!isAuthenticated) {
      router.push("/signin");
      return;
    }
    if (isFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-3">
        <div className="h-9 w-28 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {isFollowing ? (
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={handleClick}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className={
            hovered
              ? "border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/10 hover:text-destructive"
              : "border-border bg-muted text-muted-foreground"
          }
        >
          <UserCheck className="mr-1.5 h-4 w-4" />
          {hovered ? "Bỏ theo dõi" : "Đang theo dõi"}
        </Button>
      ) : (
        <Button
          variant="default"
          size="sm"
          disabled={isPending}
          onClick={handleClick}
        >
          <UserPlus className="mr-1.5 h-4 w-4" />
          Theo dõi
        </Button>
      )}

      {followerCount > 0 && (
        <span className="text-sm text-muted-foreground">
          {formatCount(followerCount)} người theo dõi
        </span>
      )}
    </div>
  );
}
