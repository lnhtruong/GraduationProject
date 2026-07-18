import { createApi, apiHttpClient } from "@/features/_shared/api-factories";
import { normalizePaginatedResponse, withQueryPath } from "@/features/_shared/crud-factories";
import type { InstructorStats, FollowingInstructor, FollowingInstructorsPage } from "./types";

type FollowingInstructorsRawPage = {
  data?: unknown[];
  total?: number;
  page?: number;
  limit?: number;
  pagination?: {
    page?: number;
    limit?: number;
    totalItems?: number;
    totalPages?: number;
  };
};

function mapFollowingInstructor(item: unknown): FollowingInstructor {
  const i = item as Record<string, unknown>;
  return {
    id: i.id as number,
    name: ((i.name ?? "") as string).trim() || ((i.email ?? "") as string),
    avatarUrl: (i.avatarUrl ?? i.avatar_url ?? undefined) as string | undefined,
  };
}

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
    return list.map(mapFollowingInstructor);
  },

  getFollowingInstructorsPaginated: async (
    page: number,
    limit: number,
  ): Promise<FollowingInstructorsPage> => {
    const { data } = await apiHttpClient.get<FollowingInstructorsRawPage | unknown[]>(
      withQueryPath("/users/following", { page, limit }),
    );

    if (Array.isArray(data)) {
      return normalizePaginatedResponse(data.map(mapFollowingInstructor), { page, limit });
    }

    const totalItems = data.pagination?.totalItems ?? data.total ?? data.data?.length ?? 0;
    return normalizePaginatedResponse(
      {
        data: (data.data ?? []).map(mapFollowingInstructor),
        pagination: {
          page: data.pagination?.page ?? data.page,
          limit: data.pagination?.limit ?? data.limit,
          totalItems,
          totalPages: data.pagination?.totalPages ?? Math.ceil(totalItems / (data.limit ?? limit)),
        },
      },
      { page, limit },
    );
  },
});
