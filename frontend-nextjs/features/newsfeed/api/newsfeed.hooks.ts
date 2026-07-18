"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { createKeyFactory } from "@/lib/queryKeys";
import { newsfeedApi } from "./newsfeed.api";
import type {
  NewsfeedActionType,
  NewsfeedFeedApiResponse,
  NewsfeedItem,
} from "../types";

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
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    sessionIdRef.current = null;
    const timer = window.setTimeout(() => setSessionId(null), 0);
    return () => window.clearTimeout(timer);
  }, [feedSignature]);

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
      const timer = window.setTimeout(() => setSessionId(null), 0);
      return () => window.clearTimeout(timer);
    }

    const latestPage = query.data?.pages.at(-1);
    if (latestPage?.sessionId) {
      sessionIdRef.current = latestPage.sessionId;
      const timer = window.setTimeout(() => setSessionId(latestPage.sessionId), 0);
      return () => window.clearTimeout(timer);
    }

    if (sessionId !== null) {
      const timer = window.setTimeout(() => setSessionId(null), 0);
      return () => window.clearTimeout(timer);
    }
  }, [mode, query.data?.pages, sessionId]);

  return {
    ...query,
    sessionId: mode === "recommended" ? sessionId : null,
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

type NewsfeedInteractType = Exclude<NewsfeedActionType, "course" | "comment">;

interface NewsfeedInteractVariables {
  feedId: number;
  type: NewsfeedInteractType;
}

interface NewsfeedInteractResponse {
  type: NewsfeedInteractType;
  active: boolean;
}

function applyInteraction(
  item: NewsfeedItem,
  variables: NewsfeedInteractVariables,
  data: NewsfeedInteractResponse,
): NewsfeedItem {
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
  } else if (variables.type === "share" && data.active) {
    updatedItem.stats = {
      ...item.stats,
      shares: item.stats.shares + 1,
    };
  }
  return updatedItem;
}

function incrementFeedCommentCount(item: NewsfeedItem, feedId: number): NewsfeedItem {
  if (item.feedId !== feedId) {
    return item;
  }

  return {
    ...item,
    stats: {
      ...item.stats,
      comments: item.stats.comments + 1,
    },
  };
}

function setFeedCommentCount(
  item: NewsfeedItem,
  feedId: number,
  commentCount: number,
): NewsfeedItem {
  if (item.feedId !== feedId || commentCount <= item.stats.comments) {
    return item;
  }

  return {
    ...item,
    stats: {
      ...item.stats,
      comments: commentCount,
    },
  };
}

function updateFeedItemInQueries(
  queryClient: QueryClient,
  feedId: number,
  updater: (item: NewsfeedItem) => NewsfeedItem,
) {
  queryClient.setQueriesData<InfiniteData<NewsfeedFeedApiResponse>>(
    { queryKey: ["newsfeed", "feed"] },
    (oldData) => {
      if (!oldData || !oldData.pages) return oldData;
      return {
        ...oldData,
        pages: oldData.pages.map((page) => ({
          ...page,
          items: page.items.map((item) => (item.feedId === feedId ? updater(item) : item)),
        })),
      };
    },
  );

  for (const key of ["saved", "viewed"]) {
    queryClient.setQueriesData<NewsfeedFeedApiResponse>(
      { queryKey: ["newsfeed", key] },
      (oldData) => {
        if (!oldData || !Array.isArray(oldData.items)) return oldData;
        return {
          ...oldData,
          items: oldData.items.map((item) => (item.feedId === feedId ? updater(item) : item)),
        };
      },
    );
  }

  queryClient.setQueryData<NewsfeedItem>(
    newsfeedKeys.custom("feed-detail", feedId),
    (oldData) => (oldData ? updater(oldData) : oldData),
  );
}

export function syncNewsfeedCommentCount(
  queryClient: QueryClient,
  feedId: number,
  commentCount: number,
) {
  updateFeedItemInQueries(queryClient, feedId, (item) =>
    setFeedCommentCount(item, feedId, commentCount),
  );
}

export function useNewsfeedInteractMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: newsfeedKeys.custom("interact"),
    mutationFn: newsfeedApi.interactFeed,
    onSuccess: (data, variables) => {
      // 1. Update infinite feed caches
      queryClient.setQueriesData<InfiniteData<NewsfeedFeedApiResponse>>(
        { queryKey: ["newsfeed", "feed"] },
        (oldData) => {
          if (!oldData || !oldData.pages) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              items: page.items.map((item) => {
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
        queryClient.setQueriesData<NewsfeedFeedApiResponse>(
          { queryKey: ["newsfeed", key] },
          (oldData) => {
            if (!oldData || !Array.isArray(oldData.items)) return oldData;
            return {
              ...oldData,
              items: oldData.items.map((item) => {
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

      if (variables.type === "save") {
        void queryClient.invalidateQueries({ queryKey: newsfeedKeys.custom("saved") });
      }
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
    onSuccess: (data, variables) => {
      const serverCommentCount = Number(data.comment_count);
      if (Number.isFinite(serverCommentCount) && serverCommentCount >= 0) {
        syncNewsfeedCommentCount(queryClient, variables.feedId, serverCommentCount);
      } else {
        updateFeedItemInQueries(queryClient, variables.feedId, (item) =>
          incrementFeedCommentCount(item, variables.feedId),
        );
      }
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
