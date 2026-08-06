"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, RotateCcw, RotateCw } from "lucide-react";
import Hls from "hls.js";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  quizMode: "in_video" | "outside_video";
  onQuizModeChange: (mode: "in_video" | "outside_video") => void;
  quizTimestamp: string;
  onTimestampChange: (timestamp: string) => void;
  canUseInVideoQuiz: boolean;
  lessonVideoUrl?: string;
  lessonVideoDuration?: number;
}

function toTimestamp(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const totalMillis = Math.round(safe * 1000);
  const wholeSeconds = Math.floor(totalMillis / 1000);
  const hours = Math.floor(wholeSeconds / 3600);
  const minutes = Math.floor((wholeSeconds % 3600) / 60);
  const seconds = wholeSeconds % 60;
  const millis = totalMillis % 1000;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
}

function timestampToSeconds(timestamp: string): number {
  const [base = "00:00:00", decimal = "0"] = timestamp.split(".");
  const [h = "0", m = "0", s = "0"] = base.split(":");
  const millis = Number(decimal.slice(0, 3).padEnd(3, "0"));
  return Number(h) * 3600 + Number(m) * 60 + Number(s) + millis / 1000;
}

function formatClockNormal(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function QuizModeSection({
  quizMode,
  onQuizModeChange,
  quizTimestamp,
  onTimestampChange,
  canUseInVideoQuiz,
  lessonVideoUrl,
  lessonVideoDuration,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const safeDuration = Math.max(0, Number(lessonVideoDuration ?? 0));

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (!lessonVideoUrl) {
      videoElement.removeAttribute("src");
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      return;
    }

    const isHls = lessonVideoUrl.includes(".m3u8");

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (isHls) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          maxMaxBufferLength: 15,
          enableWorker: true,
          lowLatencyMode: true,
        });
        hlsRef.current = hls;
        hls.loadSource(lessonVideoUrl);
        hls.attachMedia(videoElement);

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                hls.destroy();
                hlsRef.current = null;
                break;
            }
          }
        });
      } else if (videoElement.canPlayType("application/vnd.apple.mpegurl")) {
        videoElement.src = lessonVideoUrl;
      }
    } else {
      videoElement.src = lessonVideoUrl;
    }

    return () => {
      if (videoElement) {
        videoElement.pause();
        videoElement.removeAttribute("src");
        try {
          videoElement.load();
        } catch {}
      }
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [lessonVideoUrl, quizMode]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startSeconds, setStartSeconds] = useState(0);
  const [showSwipeIndicator, setShowSwipeIndicator] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<"forward" | "backward" | null>(null);

  const [isSliderDragging, setIsSliderDragging] = useState(false);

  useEffect(() => {
    if (!canUseInVideoQuiz && quizMode === "in_video") {
      onQuizModeChange("outside_video");
    }
  }, [canUseInVideoQuiz, onQuizModeChange, quizMode]);

  const syncFromVideoTime = (currentTime: number) => {
    onTimestampChange(toTimestamp(currentTime));
  };

  const selectedSeconds = useMemo(() => {
    if (!safeDuration) {
      return 0;
    }
    const raw = timestampToSeconds(quizTimestamp);
    return Math.min(safeDuration, Math.max(0, raw));
  }, [quizTimestamp, safeDuration]);

  // Sync video position when selectedSeconds changes externally
  useEffect(() => {
    const element = videoRef.current;
    if (!element || safeDuration === 0) {
      return;
    }

    const diff = Math.abs(element.currentTime - selectedSeconds);
    if (isSliderDragging || diff > 0.8) {
      element.currentTime = selectedSeconds;
    }
  }, [selectedSeconds, safeDuration, isSliderDragging]);

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch((err) => console.log("Play error:", err));
    }
  };

  // Video Drag-to-Seek Handlers (Gestures on Video Screen)
  const handleVideoMouseDown = (e: React.MouseEvent<HTMLVideoElement>) => {
    if (!videoRef.current || !safeDuration) return;
    setIsMouseDown(true);
    setStartX(e.clientX);
    setStartSeconds(videoRef.current.currentTime);
  };

  const handleVideoMouseMove = (e: React.MouseEvent<HTMLVideoElement>) => {
    if (!isMouseDown || !videoRef.current || !safeDuration) return;
    const diffX = e.clientX - startX;
    
    // 1px clientX equivalent to 0.15 seconds
    const seekDelta = diffX * 0.15;
    let nextSeconds = startSeconds + seekDelta;
    nextSeconds = Math.min(safeDuration, Math.max(0, nextSeconds));
    
    videoRef.current.currentTime = nextSeconds;
    syncFromVideoTime(nextSeconds);

    if (Math.abs(diffX) > 8) {
      setShowSwipeIndicator(true);
      setSwipeDirection(diffX > 0 ? "forward" : "backward");
    }
  };

  const handleVideoMouseUp = () => {
    setIsMouseDown(false);
    setShowSwipeIndicator(false);
    setSwipeDirection(null);
  };

  const handleVideoMouseLeave = () => {
    if (isMouseDown) {
      setIsMouseDown(false);
      setShowSwipeIndicator(false);
      setSwipeDirection(null);
    }
  };

  return (
    <div className="grid gap-4 rounded-xl border border-border/80 bg-muted/20 p-4 transition-all duration-200">
      {/* Quiz Mode Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Label className="text-sm font-bold text-foreground">Vị trí hiển thị Quiz</Label>
          <p className="text-[11px] text-muted-foreground max-w-md leading-relaxed">
            Chọn mốc thời gian hiển thị bài tập trong video hoặc hiển thị sau bài học.
          </p>
        </div>
        <Select
          value={quizMode}
          onValueChange={(value: "in_video" | "outside_video") =>
            onQuizModeChange(value)
          }
        >
          <SelectTrigger className="w-full sm:w-48 bg-background border-border shadow-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="outside_video">Ngoài video</SelectItem>
            {canUseInVideoQuiz ? (
              <SelectItem value="in_video">Trong video</SelectItem>
            ) : null}
          </SelectContent>
        </Select>
      </div>

      {/* Timeline selector for in-video mode */}
      {quizMode === "in_video" ? (
        <div className="grid gap-4 rounded-xl border border-border/60 bg-card p-4 shadow-sm animate-fadeIn">

          {lessonVideoUrl ? (
            <div className="relative group overflow-hidden rounded-xl border border-border bg-black shadow-lg">
              {/* Main Video Element */}
              <video
                ref={videoRef}
                className="mx-auto block h-auto max-h-[300px] w-full object-contain cursor-pointer select-none"
                preload="metadata"
                playsInline
                onClick={togglePlay}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={(event) => {
                  if (isPlaying) {
                    syncFromVideoTime(event.currentTarget.currentTime);
                  }
                }}
                onMouseDown={handleVideoMouseDown}
                onMouseMove={handleVideoMouseMove}
                onMouseUp={handleVideoMouseUp}
                onMouseLeave={handleVideoMouseLeave}
              />

              {/* Large Play Overlay on Pause */}
              {!isPlaying && !isMouseDown && (
                <div 
                  className="absolute inset-0 flex items-center justify-center bg-black/40 transition-all cursor-pointer"
                  onClick={togglePlay}
                >
                  <div className="p-4 rounded-full bg-background/95 text-foreground shadow-lg hover:scale-105 transition-transform duration-200">
                    <Play className="h-6 w-6 fill-foreground text-foreground" />
                  </div>
                </div>
              )}

              {/* Swipe/Drag gesture feedback Indicator */}
              {showSwipeIndicator && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white text-xs font-bold px-3 py-2 rounded-full flex items-center gap-1.5 shadow-md select-none pointer-events-none z-10 border border-white/10 animate-pulse">
                  {swipeDirection === "forward" ? (
                    <RotateCw className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <RotateCcw className="h-3.5 w-3.5 text-primary" />
                  )}
                  <span>Tua tới: {quizTimestamp}</span>
                </div>
              )}

              {/* Custom Bottom Controller Bar */}
              <div 
                className={`absolute inset-x-3 bottom-3 z-20 rounded-xl border border-white/10 bg-black/75 px-3 py-2.5 backdrop-blur-md shadow-lg flex flex-col gap-2 transition-opacity duration-200 ${
                  isPlaying ? "opacity-0 group-hover:opacity-100" : "opacity-100"
                }`}
              >
                {/* Custom Progress Bar / Slider */}
                <div className="relative h-1.5 w-full bg-white/20 rounded-full cursor-pointer group/timeline">
                  {/* Progress fill */}
                  <div 
                    className="absolute h-full bg-primary rounded-full"
                    style={{ width: `${(selectedSeconds / (safeDuration || 1)) * 100}%` }}
                  />
                  {/* Overlay Range Input for smooth slider handling */}
                  <input
                    type="range"
                    min={0}
                    max={safeDuration || 0}
                    step={0.1}
                    value={selectedSeconds}
                    onMouseDown={() => setIsSliderDragging(true)}
                    onMouseUp={() => setIsSliderDragging(false)}
                    onTouchStart={() => setIsSliderDragging(true)}
                    onTouchEnd={() => setIsSliderDragging(false)}
                    onChange={(event) => {
                      const nextValue = Number(event.target.value || 0);
                      onTimestampChange(toTimestamp(nextValue));
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                  />
                  {/* Thumb Indicator */}
                  <div 
                    className="absolute h-3 w-3 rounded-full bg-white border-2 border-primary -top-[3px] -translate-x-1/2 transition-transform duration-100 shadow-md pointer-events-none group-hover/timeline:scale-125"
                    style={{ left: `${(selectedSeconds / (safeDuration || 1)) * 100}%` }}
                  />
                </div>

                {/* Sub Controls Row */}
                <div className="flex items-center justify-between text-white text-xs font-semibold select-none">
                  <div className="flex items-center gap-3">
                    <button 
                      type="button" 
                      onClick={togglePlay} 
                      className="hover:text-primary transition-colors focus:outline-none p-1 cursor-pointer"
                    >
                      {isPlaying ? (
                        <Pause className="h-4 w-4 fill-white text-white" />
                      ) : (
                        <Play className="h-4 w-4 fill-white text-white" />
                      )}
                    </button>
                    <span className="font-mono text-[11px] tracking-wide text-zinc-200">
                      {formatClockNormal(selectedSeconds)} / {formatClockNormal(safeDuration)}
                    </span>
                  </div>
                  <div>
                    <span className="bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-md text-[10px] font-bold">
                      Mốc Quiz: {quizTimestamp}
                    </span>
                  </div>
                </div>

              </div>
            </div>
          ) : null}

        </div>
      ) : null}
    </div>
  );
}
