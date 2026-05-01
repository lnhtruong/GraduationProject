import { apiHttpClient } from "@/features/_shared/api-factories";
import type { CourseStatsOverview, FeedCreatorStats, FeedTrending, StatPeriod } from "./types";

export const courseStatsApi = {
  getOverview: (): Promise<CourseStatsOverview> =>
    apiHttpClient.get("/course/courses/stats/overview").then((r) => r.data),
};

export const feedStatsApi = {
  getCreatorStats: (period: StatPeriod = "all", limit = 20): Promise<FeedCreatorStats> =>
    apiHttpClient
      .get("/media/feed/stats/creator", { params: { period, limit } })
      .then((r) => r.data),

  getTrending: (period: StatPeriod = "all", limit = 10): Promise<FeedTrending> =>
    apiHttpClient
      .get("/media/feed/stats/trending", { params: { period, limit } })
      .then((r) => r.data),
};
