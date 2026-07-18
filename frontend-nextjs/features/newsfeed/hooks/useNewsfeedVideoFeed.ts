"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuthStore } from "@/store/auth";
import { useNewsfeedFeed, useNewsfeedFeedDetail } from "../api/newsfeed.hooks";
import { shouldPrefetchNewsfeedPage } from "./useNewsfeedFeedStrategy";
import { NEWSFEED_NAV_COOLDOWN_MS } from "../constants";

function uniqueByFeedId<T extends { feedId: number }>(items: T[]) {
  return items.filter((item, index, list) => list.findIndex((candidate) => candidate.feedId === item.feedId) === index);
}

export function useNewsfeedVideoFeed(enabled = true, searchTerm = "", initialVideoId?: number | null) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const feedQuery = useNewsfeedFeed(enabled, undefined, searchTerm, undefined, isAuthenticated);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeFeedId, setActiveFeedId] = useState<number | null>(null);
  const [scrollToIndex, setScrollToIndex] = useState<number | null>(null);
  const appliedInitialVideoIdRef = useRef<number | null>(null);
  // Throttle điều hướng: chặn thao tác kế tiếp cho tới khi hết cooldown.
  const navLockedRef = useRef(false);
  const navTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (navTimeoutRef.current != null) {
        window.clearTimeout(navTimeoutRef.current);
      }
    };
  }, []);

  const acquireNavLock = useCallback(() => {
    if (navLockedRef.current) {
      return false;
    }
    navLockedRef.current = true;
    navTimeoutRef.current = window.setTimeout(() => {
      navLockedRef.current = false;
      navTimeoutRef.current = null;
    }, NEWSFEED_NAV_COOLDOWN_MS);
    return true;
  }, []);

  const feedItems = useMemo(
    () => feedQuery.data?.pages.flatMap((page) => page.items).filter((item) => Boolean(item.videoUrl)) ?? [],
    [feedQuery.data?.pages],
  );

  const hasInitialVideo = useMemo(
    () => initialVideoId != null && feedItems.some((item) => item.feedId === initialVideoId || item.id === initialVideoId),
    [feedItems, initialVideoId],
  );

  const detailQuery = useNewsfeedFeedDetail(
    initialVideoId ?? null,
    enabled && initialVideoId != null && !hasInitialVideo,
  );

  const videos = useMemo(
    () => uniqueByFeedId([...(detailQuery.data ? [detailQuery.data] : []), ...feedItems]),
    [detailQuery.data, feedItems],
  );

  const totalVideos = videos.length;
  const hasMore = Boolean(feedQuery.hasNextPage);
  const isFetchingNextPage = feedQuery.isFetchingNextPage;
  const fetchNextPage = feedQuery.fetchNextPage;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setActiveIndex(0);
      setActiveFeedId(null);
      setScrollToIndex(null);
      appliedInitialVideoIdRef.current = null;
    }, 0);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (initialVideoId == null) {
      appliedInitialVideoIdRef.current = null;
      return;
    }

    if (appliedInitialVideoIdRef.current === initialVideoId) {
      return;
    }

    const targetIndex = videos.findIndex(
      (item) => item.feedId === initialVideoId || item.id === initialVideoId,
    );

    if (targetIndex < 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setActiveIndex(targetIndex);
      setActiveFeedId(videos[targetIndex]?.feedId ?? null);
      setScrollToIndex(targetIndex);
      appliedInitialVideoIdRef.current = initialVideoId;
    }, 0);
    return () => window.clearTimeout(timer);
  }, [initialVideoId, videos]);

  const clampedIndex = useMemo(() => {
    if (!totalVideos) {
      return 0;
    }
    return Math.max(0, Math.min(activeIndex, totalVideos - 1));
  }, [activeIndex, totalVideos]);

  const safeIndex = useMemo(() => {
    if (!totalVideos) {
      return 0;
    }

    if (activeFeedId != null) {
      const preservedIndex = videos.findIndex((item) => item.feedId === activeFeedId);
      if (preservedIndex >= 0) {
        return preservedIndex;
      }
    }

    return clampedIndex;
  }, [activeFeedId, clampedIndex, totalVideos, videos]);

  useEffect(() => {
    if (!totalVideos) {
      if (activeFeedId !== null) {
        const timer = window.setTimeout(() => setActiveFeedId(null), 0);
        return () => window.clearTimeout(timer);
      }
      return;
    }

    const nextFeedId = videos[safeIndex]?.feedId ?? null;
    if (activeFeedId !== nextFeedId) {
      const timer = window.setTimeout(() => setActiveFeedId(nextFeedId), 0);
      return () => window.clearTimeout(timer);
    }
  }, [activeFeedId, safeIndex, totalVideos, videos]);

  useEffect(() => {
    if (activeIndex === safeIndex) {
      return;
    }
    const timer = window.setTimeout(() => {
      setActiveIndex(safeIndex);
      setScrollToIndex(safeIndex);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [activeIndex, safeIndex]);

  useEffect(() => {
    if (!enabled || totalVideos <= 0) {
      return;
    }

    const remainingVideos = totalVideos - 1 - safeIndex;

    if (
      shouldPrefetchNewsfeedPage({
        remainingItems: remainingVideos,
        hasMore,
        isFetchingNextPage,
      })
    ) {
      void fetchNextPage();
    }
  }, [enabled, fetchNextPage, hasMore, isFetchingNextPage, safeIndex, totalVideos]);

  useEffect(() => {
    if (activeIndex <= clampedIndex) {
      return;
    }
    const timer = window.setTimeout(() => setActiveIndex(clampedIndex), 0);
    return () => window.clearTimeout(timer);
  }, [activeIndex, clampedIndex]);

  const activeVideo = useMemo(() => {
    if (!totalVideos) {
      return null;
    }
    return videos[safeIndex] ?? null;
  }, [safeIndex, totalVideos, videos]);

  const nextVideo = useMemo(() => {
    if (!totalVideos) {
      return null;
    }
    if (safeIndex >= totalVideos - 1) {
      return null;
    }
    return videos[safeIndex + 1] ?? null;
  }, [safeIndex, totalVideos, videos]);

  const prevVideo = useMemo(() => {
    if (!totalVideos) {
      return null;
    }
    if (safeIndex <= 0) {
      return null;
    }
    return videos[safeIndex - 1] ?? null;
  }, [safeIndex, totalVideos, videos]);

  // Điều hướng tức thì, KHÔNG throttle. Dùng cho scroll/vuốt: việc "1 video /
  // gesture" đã do idle-reset trong NewsfeedVideoFeed lo, nên không áp cooldown
  // ở đây (áp vào sẽ chặn các cú vuốt liên tiếp -> cảm giác khựng).
  const goNextImmediate = useCallback(() => {
    if (!totalVideos) {
      return;
    }
    const nextIndex = Math.min(safeIndex + 1, totalVideos - 1);
    setActiveFeedId(videos[nextIndex]?.feedId ?? null);
    setScrollToIndex(nextIndex);
    setActiveIndex(nextIndex);
  }, [safeIndex, totalVideos, videos]);

  const goPrevImmediate = useCallback(() => {
    if (!totalVideos) {
      return;
    }
    const nextIndex = Math.max(safeIndex - 1, 0);
    setActiveFeedId(videos[nextIndex]?.feedId ?? null);
    setScrollToIndex(nextIndex);
    setActiveIndex(nextIndex);
  }, [safeIndex, totalVideos, videos]);

  // Bản có throttle (cooldown) dành cho 2 nút mũi tên và phím: chống bấm dồn.
  const goNext = useCallback(() => {
    if (!acquireNavLock()) {
      return;
    }
    goNextImmediate();
  }, [acquireNavLock, goNextImmediate]);

  const goPrev = useCallback(() => {
    if (!acquireNavLock()) {
      return;
    }
    goPrevImmediate();
  }, [acquireNavLock, goPrevImmediate]);

  const jumpTo = useCallback(
    (index: number) => {
      if (!totalVideos) {
        return;
      }
      const nextIndex = Math.max(0, Math.min(index, totalVideos - 1));
      setActiveFeedId(videos[nextIndex]?.feedId ?? null);
      setScrollToIndex(nextIndex);
      setActiveIndex(nextIndex);
    },
    [totalVideos, videos],
  );

  return {
    videos,
    totalVideos,
    activeIndex: safeIndex,
    activeVideo,
    nextVideo,
    prevVideo,
    hasMore,
    isFetchingNextPage,
    endReached: totalVideos > 0 && safeIndex === totalVideos - 1 && !hasMore,
    isLoading: feedQuery.isLoading,
    isFetching: feedQuery.isFetching || detailQuery.isFetching,
    error: feedQuery.error ?? detailQuery.error,
    refetch: feedQuery.refetch,
    fetchNextPage: feedQuery.fetchNextPage,
    goNext,
    goPrev,
    goNextImmediate,
    goPrevImmediate,
    jumpTo,
    scrollToIndex,
  };
}
