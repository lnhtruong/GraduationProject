import {
  useInfiniteQuery,
  useMutation,
  useQuery,
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

export function useNewsfeedFeedDetailStats(feedId: number | null, enabled = true) {
  return useQuery({
    queryKey: newsfeedKeys.custom("feed-detail-stats", feedId),
    queryFn: () => {
      if (!feedId) {
        return Promise.resolve(null);
      }

      return newsfeedApi.getFeedDetailStats({ feedId });
    },
    enabled: enabled && feedId !== null,
    staleTime: 30 * 1000,
  });
}

export function useNewsfeedCommentDetail(
  feedId: number | null,
  originCmt: number | null,
  enabled = true,
  limit = DEFAULT_COMMENT_LIMIT,
) {
  return useInfiniteQuery({
    queryKey: newsfeedKeys.custom("comment-detail", feedId, originCmt, limit),
    queryFn: ({ pageParam }) => {
      if (!feedId || !originCmt) {
        return Promise.resolve({ origin_cmt: originCmt ?? 0, items: [], nextCursor: null });
      }

      return newsfeedApi.getCommentDetail({
        feedId,
        originCmt,
        cursor: typeof pageParam === "number" ? pageParam : undefined,
        limit,
      });
    },
    enabled: enabled && feedId !== null && originCmt !== null,
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
      queryClient.invalidateQueries({ queryKey: newsfeedKeys.root });
    },
  });
}
