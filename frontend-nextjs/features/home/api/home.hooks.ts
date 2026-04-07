/**
 * Home Hooks
 * TanStack Query hooks for homepage data
 */

import { useQuery } from "@tanstack/react-query";
import { createKeyFactory } from "@/lib/queryKeys";
import { homeApi } from "./home.api";

const keys = createKeyFactory("home");

export const homeKeys = keys;

export function useFeaturedCourses() {
  return useQuery({
    queryKey: keys.custom("featured-courses"),
    queryFn: homeApi.getFeaturedCourses,
    staleTime: 5 * 60 * 1000, // 5 min – homepage data doesn't change often
  });
}
