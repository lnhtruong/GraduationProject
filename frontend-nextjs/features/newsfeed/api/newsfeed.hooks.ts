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

export function useNewsfeedFeed(
  enabled = true,
  limit = DEFAULT_FEED_LIMIT,
  searchTerm = "",
  courseId?: number,
) {
  const normalizedSearchTerm = searchTerm.trim();
  const mode = normalizedSearchTerm ? "search" : "recommended";

  return useInfiniteQuery({
    queryKey: newsfeedKeys.custom("feed", limit, mode, normalizedSearchTerm, courseId ?? "all"),
    queryFn: ({ pageParam }) =>
      newsfeedApi.getFeed({
        cursor: Number(pageParam) || 0,
        limit,
        mode,
        search: normalizedSearchTerm || undefined,
        courseId,
      }),
    enabled,
    staleTime: 45 * 1000,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

export function useNewsfeedViewedFeeds(enabled = true) {
  return useQuery({
    queryKey: newsfeedKeys.custom("viewed"),
    queryFn: () => newsfeedApi.getViewedFeeds(),
    enabled,
    staleTime: 20 * 1000,
  });
}

export function useNewsfeedSavedFeeds(enabled = true) {
  return useQuery({
    queryKey: newsfeedKeys.custom("saved"),
    queryFn: () => newsfeedApi.getSavedFeeds(),
    enabled,
    staleTime: 20 * 1000,
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

export function useNewsfeedCreatorStats(
  enabled = true,
  period?: string,
  limit?: number,
) {
  return useQuery({
    queryKey: newsfeedKeys.custom("creator-stats", period ?? "all", limit ?? "default"),
    queryFn: () => newsfeedApi.getCreatorStats({ period, limit }),
    enabled,
    staleTime: 30 * 1000,
  });
}

export function useNewsfeedTrendingStats(
  enabled = true,
  period?: string,
  limit?: number,
) {
  return useQuery({
    queryKey: newsfeedKeys.custom("trending-stats", period ?? "all", limit ?? "default"),
    queryFn: () => newsfeedApi.getTrendingStats({ period, limit }),
    enabled,
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

export function useNewsfeedInteractMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: newsfeedKeys.custom("interact"),
    mutationFn: newsfeedApi.interactFeed,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: newsfeedKeys.root });
    },
  });
}

export function useNewsfeedRecordViewMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: newsfeedKeys.custom("record-view"),
    mutationFn: newsfeedApi.recordView,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: newsfeedKeys.root });
    },
  });
}

export function useNewsfeedAddToFeedMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: newsfeedKeys.custom("add-to-feed"),
    mutationFn: newsfeedApi.addToFeed,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: newsfeedKeys.root });
    },
  });
}

export function useNewsfeedUpdateFeedMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: newsfeedKeys.custom("update-feed"),
    mutationFn: newsfeedApi.updateFeed,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: newsfeedKeys.root });
    },
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

export function useUpdateNewsfeedCommentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: newsfeedKeys.custom("update-comment"),
    mutationFn: newsfeedApi.updateComment,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: newsfeedKeys.root });
    },
  });
}

export function useDeleteNewsfeedCommentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: newsfeedKeys.custom("delete-comment"),
    mutationFn: newsfeedApi.deleteComment,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: newsfeedKeys.root });
    },
  });
}
