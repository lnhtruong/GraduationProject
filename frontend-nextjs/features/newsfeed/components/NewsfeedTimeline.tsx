"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface NewsfeedTimelineProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  duration: number;
  isHovered: boolean;
  isOverlayHidden: boolean;
}

export function NewsfeedTimeline({
  videoRef,
  duration,
  isHovered,
  isOverlayHidden,
}: NewsfeedTimelineProps) {
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);

  // Theo dõi timeupdate trực tiếp từ video element
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (!isSeeking) {
        setCurrentTime(video.currentTime || 0);
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [videoRef, isSeeking]);

  const seekFromClientX = useCallback(
    (clientX: number) => {
      const track = timelineRef.current;
      const video = videoRef.current;
      if (!track || !video || duration <= 0) {
        return;
      }
      const rect = track.getBoundingClientRect();
      const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
      const ratio = rect.width > 0 ? x / rect.width : 0;
      const nextTime = ratio * duration;
      
      video.currentTime = nextTime;
      setCurrentTime(nextTime);
    },
    [videoRef, duration],
  );

  useEffect(() => {
    if (!isSeeking) {
      return;
    }
    const onMove = (event: MouseEvent) => {
      seekFromClientX(event.clientX);
    };
    const onUp = () => {
      setIsSeeking(false);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isSeeking, seekFromClientX]);

  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  return (
    <div
      ref={timelineRef}
      className={cn(
        "absolute bottom-0 left-0 right-0 h-1 cursor-pointer bg-muted/30 dark:bg-white/10 md:bg-white/10 transition-all duration-300 z-30",
        isHovered ? "opacity-100" : (isOverlayHidden ? "opacity-0 pointer-events-none" : "opacity-35"),
      )}
      onClick={(event) => {
        event.stopPropagation();
        seekFromClientX(event.clientX);
      }}
      onMouseDown={(event) => {
        event.stopPropagation();
        setIsSeeking(true);
        seekFromClientX(event.clientX);
      }}
    >
      <div className="h-full bg-primary" style={{ width: `${progressPercent}%` }} />
    </div>
  );
}
