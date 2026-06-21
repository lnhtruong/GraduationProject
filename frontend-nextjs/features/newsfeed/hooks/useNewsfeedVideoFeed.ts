"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNewsfeedFeed } from "../api/newsfeed.hooks";
import { shouldPrefetchNewsfeedPage } from "./useNewsfeedFeedStrategy";
import { NEWSFEED_NAV_COOLDOWN_MS } from "../constants";

function uniqueByFeedId<T extends { feedId: number }>(items: T[]) {
  return items.filter((item, index, list) => list.findIndex((candidate) => candidate.feedId === item.feedId) === index);
}

export function useNewsfeedVideoFeed(enabled = true, searchTerm = "", initialVideoId?: number | null) {
  const feedQuery = useNewsfeedFeed(enabled, undefined, searchTerm);
  const [activeIndex, setActiveIndex] = useState(0);
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

  const videos = useMemo(
    () =>
      uniqueByFeedId(
        feedQuery.data?.pages.flatMap((page) => page.items).filter((item) => Boolean(item.videoUrl)) ?? [],
      ),
    [feedQuery.data?.pages],
  );

  const totalVideos = videos.length;
  const hasMore = Boolean(feedQuery.hasNextPage);
  const isFetchingNextPage = feedQuery.isFetchingNextPage;

  useEffect(() => {
    setActiveIndex(0);
    setScrollToIndex(null);
    appliedInitialVideoIdRef.current = null;
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

    setActiveIndex(targetIndex);
    setScrollToIndex(targetIndex);
    appliedInitialVideoIdRef.current = initialVideoId;
  }, [initialVideoId, videos]);

  const safeIndex = useMemo(() => {
    if (!totalVideos) {
      return 0;
    }
    return Math.max(0, Math.min(activeIndex, totalVideos - 1));
  }, [activeIndex, totalVideos]);

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
      void feedQuery.fetchNextPage();
    }
  }, [enabled, feedQuery.fetchNextPage, hasMore, isFetchingNextPage, safeIndex, totalVideos]);

  useEffect(() => {
    if (activeIndex <= safeIndex) {
      return;
    }
    setActiveIndex(safeIndex);
  }, [activeIndex, safeIndex]);

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
    setActiveIndex((current) => {
      const nextIndex = Math.min(current + 1, totalVideos - 1);
      setScrollToIndex(nextIndex);
      return nextIndex;
    });
  }, [totalVideos]);

  const goPrevImmediate = useCallback(() => {
    if (!totalVideos) {
      return;
    }
    setActiveIndex((current) => {
      const nextIndex = Math.max(current - 1, 0);
      setScrollToIndex(nextIndex);
      return nextIndex;
    });
  }, [totalVideos]);

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
      setScrollToIndex(nextIndex);
      setActiveIndex(nextIndex);
    },
    [totalVideos],
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
    isFetching: feedQuery.isFetching,
    error: feedQuery.error,
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
