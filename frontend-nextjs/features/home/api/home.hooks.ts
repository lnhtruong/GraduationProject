/**
 * Home Hooks
 * TanStack Query hooks for homepage data
 */

import { createQueryHooks } from "@/features/_shared/react-query-factories";
import { homeApi } from "./home.api";

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

