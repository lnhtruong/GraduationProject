import { createApi, apiHttpClient } from "@/features/_shared/api-factories";
import type { InstructorStats, FollowingInstructor } from "./types";

export const followApi = createApi({
  getInstructorStats: async (instructorId: number): Promise<InstructorStats> => {
    const { data } = await apiHttpClient.get(`/instructors/${instructorId}/stats`);
    return {
      followerCount: data.followerCount ?? data.follower_count ?? 0,
      isFollowing: data.isFollowing ?? data.is_following ?? false,
    };
  },

  follow: async (instructorId: number): Promise<void> => {
    await apiHttpClient.post(`/instructors/${instructorId}/follow`);
  },

  unfollow: async (instructorId: number): Promise<void> => {
    await apiHttpClient.delete(`/instructors/${instructorId}/follow`);
  },

  getFollowingInstructors: async (): Promise<FollowingInstructor[]> => {
    const { data } = await apiHttpClient.get("/users/following");
    const list: unknown[] = Array.isArray(data) ? data : (data.data ?? []);
    return list.map((item) => {
      const i = item as Record<string, unknown>;
      return {
        id: i.id as number,
        name: ((i.name ?? "") as string).trim() || ((i.email ?? "") as string),
        avatarUrl: (i.avatarUrl ?? i.avatar_url ?? undefined) as string | undefined,
      };
    });
  },
});
