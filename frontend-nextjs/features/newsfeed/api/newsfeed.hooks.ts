import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { createKeyFactory } from "@/lib/queryKeys";
import { newsfeedApi } from "./newsfeed.api";

export const newsfeedKeys = createKeyFactory("newsfeed");

const DEFAULT_FEED_LIMIT = 8;
const DEFAULT_COMMENT_LIMIT = 20;

export function useNewsfeedFeed(enabled = true, limit = DEFAULT_FEED_LIMIT) {
  return useInfiniteQuery({
    queryKey: newsfeedKeys.custom("feed", limit),
    queryFn: ({ pageParam }) =>
      newsfeedApi.getFeed({
        cursor: Number(pageParam) || 0,
        limit,
      }),
    enabled,
    staleTime: 45 * 1000,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

export function useNewsfeedComments(
  feedId: number | null,
  enabled = true,
  limit = DEFAULT_COMMENT_LIMIT,
) {
  return useInfiniteQuery({
    queryKey: newsfeedKeys.custom("comments", feedId, limit),
    queryFn: ({ pageParam }) => {
      if (!feedId) {
        return Promise.resolve({ items: [], nextCursor: null });
      }

      return newsfeedApi.getComments({
        feedId,
        cursor: typeof pageParam === "number" ? pageParam : undefined,
        limit,
      });
    },
    enabled: enabled && feedId !== null,
    staleTime: 20 * 1000,
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

export function useCreateNewsfeedComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: newsfeedKeys.custom("create-comment"),
    mutationFn: newsfeedApi.createComment,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: newsfeedKeys.custom("comments", variables.feedId),
      });
      queryClient.invalidateQueries({
        queryKey: newsfeedKeys.custom("feed"),
      });
    },
  });
}

