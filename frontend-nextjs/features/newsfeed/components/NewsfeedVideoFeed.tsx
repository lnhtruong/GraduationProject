"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { NewsfeedItem } from "../types";
import { NewsfeedVideoCard, type NewsfeedPlaybackRate } from "./NewsfeedVideoCard";
import {
  NEWSFEED_PLAYBACK_RATE_OPTIONS,
  NEWSFEED_PLAYBACK_RATE_STORAGE_KEY,
  NEWSFEED_WHEEL_THRESHOLD,
  NEWSFEED_WHEEL_THROTTLE_MS,
  NEWSFEED_SWIPE_THRESHOLD,
  NEWSFEED_SCROLL_DURATION_MS,
} from "../constants";

function isNewsfeedPlaybackRate(value: string): value is NewsfeedPlaybackRate {
  return (NEWSFEED_PLAYBACK_RATE_OPTIONS as readonly string[]).includes(value);
}

function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5);
}

function animateScrollTo(
  container: HTMLElement,
  targetScrollTop: number,
  duration: number,
  onCancel?: () => void,
): () => void {
  const startScrollTop = container.scrollTop;
  const distance = targetScrollTop - startScrollTop;
  const startTime = performance.now();
  let rafId = 0;
  let cancelled = false;

  function step(now: number) {
    if (cancelled) return;
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    container.scrollTop = startScrollTop + distance * easeOutQuint(progress);
    if (progress < 1) {
      rafId = requestAnimationFrame(step);
    }
  }

  rafId = requestAnimationFrame(step);

  return () => {
    cancelled = true;
    cancelAnimationFrame(rafId);
    onCancel?.();
  };
}

interface NewsfeedVideoFeedProps {
  videos: NewsfeedItem[];
  activeIndex: number;
  scrollToIndex?: number | null;
  onNext: () => void;
  onPrev: () => void;
  onOpenCourse: () => void;
  onOpenComments: () => void;
  onOpenShare: (feedId: number, url: string) => void;
  className?: string;
}

export function NewsfeedVideoFeed({
  videos,
  activeIndex,
  scrollToIndex,
  onNext,
  onPrev,
  onOpenCourse,
  onOpenComments,
  onOpenShare,
  className,
}: NewsfeedVideoFeedProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const touchStartYRef = useRef<number | null>(null);
  const wheelLockedRef = useRef(false);
  const wheelCooldownTimeoutRef = useRef<number | null>(null);
  const cancelScrollRef = useRef<(() => void) | null>(null);
  const onNextRef = useRef(onNext);
  const onPrevRef = useRef(onPrev);
  const [playbackRate, setPlaybackRate] = useState<NewsfeedPlaybackRate>(() => {
    if (typeof window === "undefined") {
      return "1";
    }

    const storedPlaybackRate = window.localStorage.getItem(NEWSFEED_PLAYBACK_RATE_STORAGE_KEY);
    return storedPlaybackRate && isNewsfeedPlaybackRate(storedPlaybackRate) ? storedPlaybackRate : "1";
  });

  useEffect(() => {
    onNextRef.current = onNext;
    onPrevRef.current = onPrev;
  }, [onNext, onPrev]);

  useEffect(() => {
    window.localStorage.setItem(NEWSFEED_PLAYBACK_RATE_STORAGE_KEY, playbackRate);
  }, [playbackRate]);

  const alignActiveItem = useCallback(() => {
    const container = containerRef.current;
    const activeItem = itemRefs.current.get(activeIndex);
    if (!container || !activeItem) {
      return;
    }

    container.scrollTop = activeItem.offsetTop;
  }, [activeIndex]);

  const scheduleActiveItemAlign = useCallback(() => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(alignActiveItem);
    });
    window.setTimeout(alignActiveItem, 120);
  }, [alignActiveItem]);

  useEffect(() => {
    document.addEventListener("fullscreenchange", scheduleActiveItemAlign);
    return () => {
      document.removeEventListener("fullscreenchange", scheduleActiveItemAlign);
    };
  }, [scheduleActiveItemAlign]);

  const handleToggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    if (window.innerWidth < 768) {
      return;
    }

    if (document.fullscreenElement) {
      void document.exitFullscreen().finally(scheduleActiveItemAlign);
      return;
    }

    void container.requestFullscreen().then(scheduleActiveItemAlign);
  }, [scheduleActiveItemAlign]);

  const setItemRef = useCallback((index: number, node: HTMLDivElement | null) => {
    if (!node) {
      itemRefs.current.delete(index);
      return;
    }
    itemRefs.current.set(index, node);
  }, []);

  useEffect(() => {
    if (scrollToIndex == null) return;

    const container = containerRef.current;
    const target = itemRefs.current.get(scrollToIndex);
    if (!container || !target) return;

    // Cancel animation đang chạy trước khi bắt animation mới.
    cancelScrollRef.current?.();

    const targetScrollTop = target.offsetTop;
    cancelScrollRef.current = animateScrollTo(container, targetScrollTop, NEWSFEED_SCROLL_DURATION_MS, () => {
      cancelScrollRef.current = null;
    });
  }, [scrollToIndex]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const triggerMove = (direction: "next" | "prev") => {
      if (direction === "next") {
        onNextRef.current();
      } else {
        onPrevRef.current();
      }
    };

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      if (Math.abs(event.deltaY) < NEWSFEED_WHEEL_THRESHOLD) return;
      if (wheelLockedRef.current) return;
      wheelLockedRef.current = true;
      triggerMove(event.deltaY > 0 ? "next" : "prev");
      wheelCooldownTimeoutRef.current = window.setTimeout(() => {
        wheelLockedRef.current = false;
        wheelCooldownTimeoutRef.current = null;
      }, NEWSFEED_WHEEL_THROTTLE_MS);
    };

    const handleTouchStart = (event: TouchEvent) => {
      touchStartYRef.current = event.touches[0]?.clientY ?? null;
    };

    const handleTouchMove = (event: TouchEvent) => {
      event.preventDefault();
    };

    const handleTouchEnd = (event: TouchEvent) => {
      const startY = touchStartYRef.current;
      touchStartYRef.current = null;
      if (startY == null) return;
      const endY = event.changedTouches[0]?.clientY ?? startY;
      const deltaY = startY - endY;
      if (Math.abs(deltaY) < NEWSFEED_SWIPE_THRESHOLD) return;
      triggerMove(deltaY > 0 ? "next" : "prev");
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
      if (wheelCooldownTimeoutRef.current != null) {
        window.clearTimeout(wheelCooldownTimeoutRef.current);
        wheelCooldownTimeoutRef.current = null;
      }
      wheelLockedRef.current = false;
    };
  }, []);

  const nextIndex = useMemo(() => activeIndex + 1, [activeIndex]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "fullscreen-active h-[calc(100vh-64px)] w-full overflow-y-hidden bg-background",
        "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']",
        className,
      )}
    >
      {videos.map((video, index) => {
        const isVisible = Math.abs(index - activeIndex) <= 1;
        return (
          <div
            key={video.feedId}
            ref={(node) => setItemRef(index, node)}
            data-index={index}
            className="newsfeed-video-item h-[calc(100vh-64px)]"
          >
            {isVisible ? (
              <NewsfeedVideoCard
                video={video}
                isActive={index === activeIndex}
                shouldPreload={index === nextIndex}
                playbackRate={playbackRate}
                onPlaybackRateChange={setPlaybackRate}
                onOpenCourse={onOpenCourse}
                onOpenComments={onOpenComments}
                onOpenShare={onOpenShare}
                onToggleFullscreen={handleToggleFullscreen}
              />
            ) : (
              <div className="h-full w-full bg-background flex items-center justify-center text-muted-foreground/20 text-xs" />
            )}
          </div>
        );
      })}

      <div className="newsfeed-fullscreen-nav">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-14 w-14 rounded-full bg-white/12 text-white hover:bg-white/20 hover:text-white"
          onClick={onPrev}
          aria-label="Video trước"
        >
          <ArrowUp className="h-7 w-7" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-14 w-14 rounded-full bg-white/12 text-white hover:bg-white/20 hover:text-white"
          onClick={onNext}
          aria-label="Video tiếp theo"
        >
          <ArrowDown className="h-7 w-7" />
        </Button>
      </div>
    </div>
  );
}
