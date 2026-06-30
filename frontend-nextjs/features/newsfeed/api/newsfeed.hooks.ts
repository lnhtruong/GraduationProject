"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { createKeyFactory } from "@/lib/queryKeys";
import { newsfeedApi } from "./newsfeed.api";

import { useAuthStore } from "@/store/auth";

export const newsfeedKeys = createKeyFactory("newsfeed");

const DEFAULT_FEED_LIMIT = 8;
const DEFAULT_COMMENT_LIMIT = 20;

export function useNewsfeedFeed(
  enabled = true,
  limit = DEFAULT_FEED_LIMIT,
  searchTerm = "",
  courseId?: number,
  isAuthenticatedParam?: boolean,
) {
  const authState = useAuthStore((s) => s.isAuthenticated());
  const isAuthenticated = typeof isAuthenticatedParam === "boolean" ? isAuthenticatedParam : authState;
  const normalizedSearchTerm = searchTerm.trim();
  const mode = normalizedSearchTerm ? "search" : "recommended";
  const source = !normalizedSearchTerm && !isAuthenticated ? "trending" : mode;
  const resolvedLimit = source === "trending" ? 20 : limit;
  const feedSignature = `${source}:${resolvedLimit}:${normalizedSearchTerm}:${courseId ?? "all"}`;
  const sessionIdRef = useRef<string | null>(null);
  const previousSignatureRef = useRef(feedSignature);

  if (previousSignatureRef.current !== feedSignature) {
    previousSignatureRef.current = feedSignature;
    sessionIdRef.current = null;
  }

  const query = useInfiniteQuery({
    queryKey: newsfeedKeys.custom("feed", resolvedLimit, source, normalizedSearchTerm, courseId ?? "all"),
    queryFn: ({ pageParam }) => {
      const cursor = Number(pageParam) || 0;

      if (source === "trending") {
        return newsfeedApi.getTrendingFeed({ cursor, limit: resolvedLimit });
      }

      return newsfeedApi.getFeed({
        cursor,
        limit: resolvedLimit,
        mode,
        search: normalizedSearchTerm || undefined,
        courseId,
        sessionId: mode === "recommended" && sessionIdRef.current ? sessionIdRef.current : undefined,
      });
    },
    enabled,
    staleTime: 45 * 1000,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  useEffect(() => {
    if (mode !== "recommended") {
      sessionIdRef.current = null;
      return;
    }

    const latestPage = query.data?.pages.at(-1);
    if (latestPage?.sessionId) {
      sessionIdRef.current = latestPage.sessionId;
    }
  }, [mode, query.data?.pages]);

  return {
    ...query,
    sessionId: mode === "recommended" ? sessionIdRef.current : null,
  };
}

export function useNewsfeedFeedDetail(feedId: number | null, enabled = true) {
  return useQuery({
    queryKey: newsfeedKeys.custom("feed-detail", feedId),
    queryFn: () => newsfeedApi.getFeedDetail(feedId as number),
    enabled: enabled && feedId !== null,
    staleTime: 30 * 1000,
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

export function useNewsfeedTrendingHashtags(
  enabled = true,
  days?: number,
  limit?: number,
) {
  return useQuery({
    queryKey: newsfeedKeys.custom("trending-hashtags", days ?? "default", limit ?? "default"),
    queryFn: () => newsfeedApi.getTrendingHashtags({ days, limit }),
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

function applyInteraction(item: any, variables: any, data: any) {
  const updatedItem = { ...item };
  if (variables.type === "like") {
    const wasLiked = item.isLiked;
    updatedItem.isLiked = data.active;
    if (wasLiked !== data.active) {
      updatedItem.stats = {
        ...item.stats,
        likes: data.active
          ? item.stats.likes + 1
          : Math.max(0, item.stats.likes - 1),
      };
    }
  } else if (variables.type === "save") {
    const wasSaved = item.isSaved;
    updatedItem.isSaved = data.active;
    if (wasSaved !== data.active) {
      updatedItem.stats = {
        ...item.stats,
        saves: data.active
          ? item.stats.saves + 1
          : Math.max(0, item.stats.saves - 1),
      };
    }
  }
  return updatedItem;
}

export function useNewsfeedInteractMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: newsfeedKeys.custom("interact"),
    mutationFn: newsfeedApi.interactFeed,
    onSuccess: (data, variables) => {
      // 1. Update infinite feed caches
      queryClient.setQueriesData<any>(
        { queryKey: ["newsfeed", "feed"] },
        (oldData: any) => {
          if (!oldData || !oldData.pages) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              items: page.items.map((item: any) => {
                if (item.feedId === variables.feedId) {
                  return applyInteraction(item, variables, data);
                }
                return item;
              }),
            })),
          };
        }
      );

      // 2. Update regular feed caches (saved / viewed)
      const updateRegularFeedQuery = (key: string) => {
        queryClient.setQueriesData<any>(
          { queryKey: ["newsfeed", key] },
          (oldData: any) => {
            if (!oldData || !Array.isArray(oldData.items)) return oldData;
            return {
              ...oldData,
              items: oldData.items.map((item: any) => {
                if (item.feedId === variables.feedId) {
                  return applyInteraction(item, variables, data);
                }
                return item;
              }),
            };
          }
        );
      };

      updateRegularFeedQuery("saved");
      updateRegularFeedQuery("viewed");
    },
  });
}

export function useNewsfeedRecordViewMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: newsfeedKeys.custom("record-view"),
    mutationFn: newsfeedApi.recordView,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: newsfeedKeys.custom("viewed") });
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
      void queryClient.invalidateQueries({
        queryKey: newsfeedKeys.custom("comments", variables.feedId),
      });
      if (variables.originCmt) {
        void queryClient.invalidateQueries({
          queryKey: newsfeedKeys.custom("comment-detail", variables.feedId, variables.originCmt),
        });
      }
    },
  });
}

export function useUpdateNewsfeedCommentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: newsfeedKeys.custom("update-comment"),
    mutationFn: newsfeedApi.updateComment,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: newsfeedKeys.custom("comments", variables.feedId),
      });
      void queryClient.invalidateQueries({
        queryKey: newsfeedKeys.custom("comment-detail", variables.feedId),
      });
    },
  });
}

export function useDeleteNewsfeedCommentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: newsfeedKeys.custom("delete-comment"),
    mutationFn: newsfeedApi.deleteComment,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: newsfeedKeys.custom("comments", variables.feedId),
      });
      void queryClient.invalidateQueries({
        queryKey: newsfeedKeys.custom("comment-detail", variables.feedId),
      });
    },
  });
}
