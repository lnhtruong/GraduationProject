"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { followApi } from "./follow.api";
import type { InstructorStats, FollowingInstructor } from "./types";

const STATS_KEY = (id: number) => ["instructor", "stats", id] as const;
const FOLLOWING_KEY = ["users", "following"] as const;

export function useInstructorStats(instructorId: number) {
  return useQuery({
    queryKey: STATS_KEY(instructorId),
    queryFn: () => followApi.getInstructorStats(instructorId),
    staleTime: 60_000,
  });
}

export function useFollowMutation(instructorId: number) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => followApi.follow(instructorId),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: STATS_KEY(instructorId) });
      const previous = qc.getQueryData<InstructorStats>(STATS_KEY(instructorId));
      qc.setQueryData<InstructorStats>(STATS_KEY(instructorId), (old) =>
        old
          ? { followerCount: old.followerCount + 1, isFollowing: true }
          : { followerCount: 1, isFollowing: true },
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous !== undefined) {
        qc.setQueryData(STATS_KEY(instructorId), ctx.previous);
      }
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: STATS_KEY(instructorId) });
      void qc.invalidateQueries({ queryKey: FOLLOWING_KEY });
    },
  });
}

export function useUnfollowMutation(instructorId: number) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => followApi.unfollow(instructorId),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: STATS_KEY(instructorId) });
      await qc.cancelQueries({ queryKey: FOLLOWING_KEY });
      const previousStats = qc.getQueryData<InstructorStats>(STATS_KEY(instructorId));
      const previousFollowing = qc.getQueryData<FollowingInstructor[]>(FOLLOWING_KEY);
      qc.setQueryData<InstructorStats>(STATS_KEY(instructorId), (old) =>
        old
          ? { followerCount: Math.max(0, old.followerCount - 1), isFollowing: false }
          : { followerCount: 0, isFollowing: false },
      );
      qc.setQueryData<FollowingInstructor[]>(FOLLOWING_KEY, (old) =>
        old ? old.filter((i) => i.id !== instructorId) : [],
      );
      return { previousStats, previousFollowing };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previousStats !== undefined) {
        qc.setQueryData(STATS_KEY(instructorId), ctx.previousStats);
      }
      if (ctx?.previousFollowing !== undefined) {
        qc.setQueryData(FOLLOWING_KEY, ctx.previousFollowing);
      }
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: STATS_KEY(instructorId) });
      void qc.invalidateQueries({ queryKey: FOLLOWING_KEY });
    },
  });
}

export function useFollowingInstructors() {
  return useQuery({
    queryKey: FOLLOWING_KEY,
    queryFn: followApi.getFollowingInstructors,
    staleTime: 2 * 60_000,
  });
}

export function useFollowingInstructorsPaginated(
  page: number,
  limit: number,
  enabled = true,
) {
  return useQuery({
    queryKey: [...FOLLOWING_KEY, { page, limit }],
    queryFn: () => followApi.getFollowingInstructorsPaginated(page, limit),
    enabled,
    staleTime: 2 * 60_000,
  });
}
