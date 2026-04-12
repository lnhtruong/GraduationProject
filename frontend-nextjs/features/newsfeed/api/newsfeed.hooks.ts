/**
 * Newsfeed Hooks
 * TanStack Query hooks for newsfeed data
 */

import { createQueryHooks } from "@/features/_shared/react-query-factories";
import { newsfeedApi } from "./newsfeed.api";

// ============================================================================
// NEWSFEED QUERIES
// ============================================================================

export const newsfeedHooks = createQueryHooks(
  "newsfeed",
  ["demo", "feed"],
  newsfeedApi.getFeed,
  {
    staleTime: 45 * 1000,
  },
);

export const newsfeedKeys = newsfeedHooks.keys;
export const useNewsfeedFeed = newsfeedHooks.useQuery;

