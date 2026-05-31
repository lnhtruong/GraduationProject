"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { NewsfeedItem } from "../types";
import {
  NEWSFEED_PLAYBACK_RATE_OPTIONS,
  NewsfeedVideoCard,
  type NewsfeedPlaybackRate,
} from "./NewsfeedVideoCard";

const NEWSFEED_PLAYBACK_RATE_STORAGE_KEY = "newsfeed.playbackRate";

function isNewsfeedPlaybackRate(value: string): value is NewsfeedPlaybackRate {
  return NEWSFEED_PLAYBACK_RATE_OPTIONS.includes(value as NewsfeedPlaybackRate);
}

interface NewsfeedVideoFeedProps {
  videos: NewsfeedItem[];
  activeIndex: number;
  scrollToIndex?: number | null;
  onActiveIndexChange: (index: number) => void;
  onOpenCourse: () => void;
  onOpenComments: () => void;
  onOpenShare: (url: string) => void;
  className?: string;
}

export function NewsfeedVideoFeed({
  videos,
  activeIndex,
  scrollToIndex,
  onActiveIndexChange,
  onOpenCourse,
  onOpenComments,
  onOpenShare,
  className,
}: NewsfeedVideoFeedProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const ignoreObserverRef = useRef(false);
  const [playbackRate, setPlaybackRate] = useState<NewsfeedPlaybackRate>("1");

  useEffect(() => {
    const storedPlaybackRate = window.localStorage.getItem(NEWSFEED_PLAYBACK_RATE_STORAGE_KEY);
    if (storedPlaybackRate && isNewsfeedPlaybackRate(storedPlaybackRate)) {
      setPlaybackRate(storedPlaybackRate);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(NEWSFEED_PLAYBACK_RATE_STORAGE_KEY, playbackRate);
  }, [playbackRate]);

  const setItemRef = useCallback((index: number, node: HTMLDivElement | null) => {
    if (!node) {
      itemRefs.current.delete(index);
      return;
    }
    itemRefs.current.set(index, node);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (ignoreObserverRef.current) {
            return;
          }
          if (!entry.isIntersecting || entry.intersectionRatio < 0.6) {
            return;
          }
          const indexValue = entry.target.getAttribute("data-index");
          const index = indexValue ? Number(indexValue) : NaN;
          if (Number.isNaN(index)) {
            return;
          }
          onActiveIndexChange(index);
        });
      },
      {
        root: container,
        threshold: [0.4, 0.6, 0.8],
      },
    );

    itemRefs.current.forEach((node) => observer.observe(node));

    return () => observer.disconnect();
  }, [onActiveIndexChange, videos.length]);

  useEffect(() => {
    if (scrollToIndex == null) {
      return;
    }

    const target = itemRefs.current.get(scrollToIndex);
    if (!target) {
      return;
    }
    ignoreObserverRef.current = true;
    target.scrollIntoView({ behavior: "auto", block: "start" });
    const timeout = window.setTimeout(() => {
      ignoreObserverRef.current = false;
    }, 120);
    return () => window.clearTimeout(timeout);
  }, [scrollToIndex]);

  const nextIndex = useMemo(() => activeIndex + 1, [activeIndex]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "h-[calc(100vh-64px)] w-full overflow-y-auto scroll-smooth snap-y snap-mandatory",
        "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']",
        className,
      )}
    >
      {videos.map((video, index) => (
        <div
          key={video.feedId}
          ref={(node) => setItemRef(index, node)}
          data-index={index}
          className="snap-start"
        >
          <NewsfeedVideoCard
            video={video}
            isActive={index === activeIndex}
            shouldPreload={index === nextIndex}
            playbackRate={playbackRate}
            onPlaybackRateChange={setPlaybackRate}
            onOpenCourse={onOpenCourse}
            onOpenComments={onOpenComments}
            onOpenShare={onOpenShare}
          />
        </div>
      ))}
    </div>
  );
}
