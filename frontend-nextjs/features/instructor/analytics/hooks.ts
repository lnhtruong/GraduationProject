import { useQuery } from "@tanstack/react-query";
import { courseStatsApi, feedStatsApi } from "./api";
import { MOCK_COURSE_STATS, MOCK_FEED_CREATOR_STATS, MOCK_FEED_TRENDING } from "./mock";
import type { StatPeriod } from "./types";

const USE_MOCK = process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_USE_MOCK_STATS === "true";

export function useCourseStatsOverview() {
  return useQuery({
    queryKey: ["instructor", "stats", "courses"],
    queryFn: USE_MOCK
      ? () => Promise.resolve(MOCK_COURSE_STATS)
      : courseStatsApi.getOverview,
    staleTime: 5 * 60_000,
  });
}

export function useFeedCreatorStats(period: StatPeriod = "all") {
  return useQuery({
    queryKey: ["instructor", "stats", "feed", period],
    queryFn: USE_MOCK
      ? () => Promise.resolve(MOCK_FEED_CREATOR_STATS)
      : () => feedStatsApi.getCreatorStats(period),
    staleTime: 5 * 60_000,
  });
}

export function useFeedTrending(period: StatPeriod = "all") {
  return useQuery({
    queryKey: ["instructor", "stats", "trending", period],
    queryFn: USE_MOCK
      ? () => Promise.resolve(MOCK_FEED_TRENDING)
      : () => feedStatsApi.getTrending(period),
    staleTime: 5 * 60_000,
  });
}
