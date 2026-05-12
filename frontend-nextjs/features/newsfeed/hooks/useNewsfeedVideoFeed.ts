"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNewsfeedFeed } from "../api/newsfeed.hooks";

export function useNewsfeedVideoFeed(enabled = true, searchTerm = "") {
  const feedQuery = useNewsfeedFeed(enabled, undefined, searchTerm);
  const [activeIndex, setActiveIndex] = useState(0);

  const videos = useMemo(
    () =>
      feedQuery.data?.pages.flatMap((page) => page.items).filter((item) => Boolean(item.videoUrl)) ?? [],
    [feedQuery.data?.pages],
  );

  const totalVideos = videos.length;
  const hasMore = Boolean(feedQuery.hasNextPage);
  const isFetchingNextPage = feedQuery.isFetchingNextPage;

  useEffect(() => {
    setActiveIndex(0);
  }, [searchTerm]);

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
    const shouldPrefetch = remainingVideos <= 2;

    if (shouldPrefetch && hasMore && !isFetchingNextPage) {
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

  const goNext = useCallback(() => {
    if (!totalVideos) {
      return;
    }
    setActiveIndex((current) => Math.min(current + 1, totalVideos - 1));
  }, [totalVideos]);

  const goPrev = useCallback(() => {
    if (!totalVideos) {
      return;
    }
    setActiveIndex((current) => Math.max(current - 1, 0));
  }, [totalVideos]);

  const jumpTo = useCallback(
    (index: number) => {
      if (!totalVideos) {
        return;
      }
      setActiveIndex(Math.max(0, Math.min(index, totalVideos - 1)));
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
    jumpTo,
  };
}
