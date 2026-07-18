/**
 * Home Hooks
 * TanStack Query hooks for homepage data
 */

import { createQueryHooks } from "@/features/_shared/react-query-factories";
import { homeApi } from "./home.api";
import { useQuery } from "@tanstack/react-query";

// ============================================================================
// HOME QUERIES
// ============================================================================

export const homeHooks = createQueryHooks(
  "home",
  ["featured-courses"],
  homeApi.getFeaturedCourses,
  {
    staleTime: 5 * 60 * 1000,
  },
);

export const homeKeys = homeHooks.keys;
export const useFeaturedCourses = homeHooks.useQuery;

export const homeQueryKeys = {
  popularCourses: ["home", "popular-courses"] as const,
  topRatedCourses: ["home", "top-rated-courses"] as const,
  categories: ["home", "categories"] as const,
  trendingFeed: ["home", "trending-feed"] as const,
  trendingHashtags: ["home", "trending-hashtags"] as const,
  roadmaps: ["home", "roadmaps"] as const,
  continueWatching: ["home", "continue-watching"] as const,
};

export function useHomePopularCourses() {
  return useQuery({
    queryKey: homeQueryKeys.popularCourses,
    queryFn: homeApi.getPopularCourses,
    staleTime: 5 * 60 * 1000,
  });
}

export function useHomeTopRatedCourses() {
  return useQuery({
    queryKey: homeQueryKeys.topRatedCourses,
    queryFn: homeApi.getTopRatedCourses,
    staleTime: 5 * 60 * 1000,
  });
}

export function useHomeCategories() {
  return useQuery({
    queryKey: homeQueryKeys.categories,
    queryFn: homeApi.getCategories,
    staleTime: 10 * 60 * 1000,
  });
}

export function useHomeTrendingFeed() {
  return useQuery({
    queryKey: homeQueryKeys.trendingFeed,
    queryFn: homeApi.getTrendingFeed,
    staleTime: 2 * 60 * 1000,
  });
}

export function useHomeTrendingHashtags() {
  return useQuery({
    queryKey: homeQueryKeys.trendingHashtags,
    queryFn: homeApi.getTrendingHashtags,
    staleTime: 5 * 60 * 1000,
  });
}

export function useHomeRoadmaps() {
  return useQuery({
    queryKey: homeQueryKeys.roadmaps,
    queryFn: homeApi.getRoadmaps,
    staleTime: 5 * 60 * 1000,
  });
}

export function useHomeContinueWatching(enabled: boolean) {
  return useQuery({
    queryKey: homeQueryKeys.continueWatching,
    queryFn: homeApi.getContinueWatching,
    enabled,
    staleTime: 60 * 1000,
  });
}

