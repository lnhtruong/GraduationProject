"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Flag, Pause, Play, Clapperboard, Settings, ChevronRight, ChevronLeft, Check, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import Hls from "hls.js";
import { QuizEditor } from "../QuizEditor";
import {
  invalidateLessonQuizCache,
  useQuizById,
  useUpdateQuiz,
} from "../../api/course-management.hooks";
import type { QuizEditorState } from "../../types";
import { mapQuizToEditorState } from "../../utils/quiz-editor.utils";
import type { QuizTimelineMarker } from "../../utils/quiz-timeline.utils";

interface Props {
  courseId: number;
  lessonId: number;
  videoUrl?: string | null;
  videoDurationSeconds: number;
  videoLoading: boolean;
  timelineMarkers?: QuizTimelineMarker[];
  isProcessing?: boolean;
  thumbnailUrl?: string | null;
}

export function VideoPreview({
  lessonId,
  videoUrl,
  videoDurationSeconds,
  videoLoading,
  timelineMarkers = [],
  isProcessing = false,
  thumbnailUrl,
}: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineTrackRef = useRef<HTMLDivElement>(null);
  const tooltipHideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [currentTime, setCurrentTime] = useState(0);
  const [mediaDuration, setMediaDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hoveredMarkerKey, setHoveredMarkerKey] = useState<string | null>(null);

  const hlsRef = useRef<Hls | null>(null);
  const previousVideoUrlRef = useRef<string | null>(null);
  const currentTimeRef = useRef(0);
  const sourceSwitchResumeRef = useRef({
    time: 0,
    wasPlaying: false,
  });
  const [qualityLevels, setQualityLevels] = useState<{ id: number; name: string }[]>([]);
  const [currentQualityLevel, setCurrentQualityLevel] = useState<number>(-1);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [menuView, setMenuView] = useState<"main" | "speed" | "quality">("main");

  const currentQualityName = useMemo(() => {
    return qualityLevels.find((level) => level.id === currentQualityLevel)?.name || "Tự động";
  }, [qualityLevels, currentQualityLevel]);
  const [editingMarker, setEditingMarker] = useState<QuizTimelineMarker | null>(
    null,
  );
  const [draftQuizState, setDraftQuizState] = useState<QuizEditorState | null>(
    null,
  );

  useEffect(() => {
    if (editingMarker) {
      videoRef.current?.pause();
    }
  }, [editingMarker]);

  const clearTooltipHideTimeout = () => {
    if (tooltipHideTimeoutRef.current) {
      clearTimeout(tooltipHideTimeoutRef.current);
      tooltipHideTimeoutRef.current = null;
    }
  };

  const openMarkerTooltip = (markerKey: string) => {
    clearTooltipHideTimeout();
    setHoveredMarkerKey(markerKey);
  };

  const scheduleTooltipHide = () => {
    clearTooltipHideTimeout();
    tooltipHideTimeoutRef.current = setTimeout(() => {
      setHoveredMarkerKey(null);
    }, 140);
  };

  useEffect(() => {
    return () => {
      clearTooltipHideTimeout();
    };
  }, []);

  useEffect(() => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = currentQualityLevel;
    }
  }, [currentQualityLevel]);

  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (!videoUrl) {
      videoElement.removeAttribute("src");
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      queueMicrotask(() => {
        setQualityLevels([]);
        setCurrentQualityLevel(-1);
      });
      return;
    }

    const isHls = videoUrl.includes(".m3u8");
    const previousVideoUrl = previousVideoUrlRef.current;
    const isSourceSwitch = Boolean(previousVideoUrl && previousVideoUrl !== videoUrl);
    const resumeTime = isSourceSwitch
      ? Math.max(
          0,
          sourceSwitchResumeRef.current.time ||
            videoElement.currentTime ||
            currentTimeRef.current ||
            0,
        )
      : 0;
    const shouldResumePlayback = isSourceSwitch
      ? sourceSwitchResumeRef.current.wasPlaying
      : true;

    let didRestorePlayback = false;
    const restorePlayback = () => {
      if (didRestorePlayback) return;
      if (resumeTime > 0 && !Number.isFinite(videoElement.duration)) return;
      didRestorePlayback = true;

      if (resumeTime > 0 && Number.isFinite(videoElement.duration)) {
        videoElement.currentTime = Math.min(resumeTime, videoElement.duration);
        setCurrentTime(videoElement.currentTime);
      }

      if (shouldResumePlayback) {
        videoElement.play().catch(() => {});
      }
    };

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (isHls) {
      if (Hls.isSupported()) {
        videoElement.addEventListener("loadedmetadata", restorePlayback, {
          once: true,
        });

        const hls = new Hls({
          maxMaxBufferLength: 15,
          enableWorker: true,
          lowLatencyMode: true,
        });
        hlsRef.current = hls;
        hls.loadSource(videoUrl);
        hls.attachMedia(videoElement);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          const levels = hls.levels.map((level, idx) => ({
            id: idx,
            name: level.height ? `${level.height}p` : `Chất lượng ${idx + 1}`,
          }));
          const sortedLevels = [
            { id: -1, name: "Tự động" },
            ...[...levels].reverse()
          ];
          setQualityLevels(sortedLevels);
          if (videoElement.readyState >= HTMLMediaElement.HAVE_METADATA) {
            restorePlayback();
          }
        });

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
        videoElement.src = videoUrl;
        videoElement.addEventListener("loadedmetadata", restorePlayback, {
          once: true,
        });
      }
    } else {
      videoElement.src = videoUrl;
      videoElement.addEventListener("loadedmetadata", restorePlayback, {
        once: true,
      });
      queueMicrotask(() => {
        setQualityLevels([]);
        setCurrentQualityLevel(-1);
      });
    }

    previousVideoUrlRef.current = videoUrl;

    return () => {
      if (videoElement) {
        sourceSwitchResumeRef.current = {
          time: Math.max(0, videoElement.currentTime || currentTimeRef.current || 0),
          wasPlaying: !videoElement.paused && !videoElement.ended,
        };
        videoElement.removeEventListener("loadedmetadata", restorePlayback);
      }
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [videoUrl]);

  const safeDuration = useMemo(() => {
    if (Number.isFinite(mediaDuration) && mediaDuration > 0) {
      return mediaDuration;
    }
    return Number.isFinite(videoDurationSeconds) ? videoDurationSeconds : 0;
  }, [mediaDuration, videoDurationSeconds]);

  const seekTo = (seconds: number) => {
    if (!videoRef.current) {
      return;
    }
    videoRef.current.currentTime = seconds;
    videoRef.current.play().catch(() => undefined);
  };

  const handleTogglePlayback = () => {
    const element = videoRef.current;
    if (!element) {
      return;
    }

    if (element.paused) {
      element.play().catch(() => undefined);
      return;
    }

    element.pause();
  };

  const handleSeekChange = (nextTime: number) => {
    if (!videoRef.current || !Number.isFinite(nextTime)) {
      return;
    }
    const clamped = Math.max(0, Math.min(safeDuration, nextTime));
    videoRef.current.currentTime = clamped;
    setCurrentTime(clamped);
  };

  const formatTime = (value: number) => {
    const safe = Math.max(0, Math.floor(value));
    const hh = Math.floor(safe / 3600);
    const mm = Math.floor((safe % 3600) / 60);
    const ss = safe % 60;
    if (hh > 0) {
      return `${hh}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
    }
    return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  };


  const handleTimelineSeek = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineTrackRef.current || safeDuration <= 0) {
      return;
    }

    const rect = timelineTrackRef.current.getBoundingClientRect();
    const relative = (event.clientX - rect.left) / rect.width;
    const clamped = Math.max(0, Math.min(1, relative));
    seekTo(clamped * safeDuration);
  };

  const progressPercent =
    safeDuration > 0
      ? Math.min(100, Math.max(0, (currentTime / safeDuration) * 100))
      : 0;

  const hoveredMarker = useMemo(
    () =>
      timelineMarkers.find(
        (marker, index) =>
          `${marker.quizId}-${index}-${marker.timestampSeconds}` ===
          hoveredMarkerKey,
      ) ?? null,
    [timelineMarkers, hoveredMarkerKey],
  );

  const { data: editingQuiz } = useQuizById(editingMarker?.quizId ?? null);
  const updateQuizMutation = useUpdateQuiz();

  const editingQuizState = useMemo(() => {
    if (!editingMarker || !editingQuiz) {
      return null;
    }

    return mapQuizToEditorState(
      editingQuiz,
      editingMarker.lessonActivityId,
      editingMarker.quizName,
    );
  }, [editingMarker, editingQuiz]);

  const handleSaveQuiz = async (state: QuizEditorState) => {
    if (!editingQuiz) {
      return;
    }

    await updateQuizMutation.mutateAsync({
      id: editingQuiz.id,
      data: state,
    });
    await invalidateLessonQuizCache(queryClient, lessonId);

    setEditingMarker(null);
    router.refresh();
  };

  const hoveredLeft = useMemo(() => {
    if (!hoveredMarker || safeDuration <= 0) {
      return 0;
    }
    const raw = (hoveredMarker.timestampSeconds / safeDuration) * 100;
    return Math.max(4, Math.min(96, raw));
  }, [hoveredMarker, safeDuration]);

  const tooltipTranslateX = useMemo(() => {
    if (hoveredLeft < 25) {
      const pct = (hoveredLeft - 4) / 21; // 0 to 1
      const translate = -10 - 40 * pct;
      return `${translate}%`;
    }
    if (hoveredLeft > 75) {
      const pct = (hoveredLeft - 75) / 21; // 0 to 1
      const translate = -50 - 40 * pct;
      return `${translate}%`;
    }
    return "-50%";
  }, [hoveredLeft]);

  return (
    <>
      <div className="space-y-4">
        <div className="pt-1">
          <div className={cn(
            "relative flex aspect-video w-full items-center justify-center rounded-xl",
            videoUrl && !isProcessing ? "bg-muted/40 dark:bg-zinc-950 border border-border/50" : "bg-muted/20 border-2 border-dashed border-border/40"
          )}>
            {videoLoading ? (
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span>Đang tải video...</span>
              </div>
            ) : isProcessing ? (
              <div className="text-center text-muted-foreground px-4 flex flex-col items-center gap-2">
                <div className="rounded-full bg-muted/60 p-3 text-muted-foreground/60 animate-pulse">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
                <p className="text-sm font-semibold text-foreground mt-1">Video đang được xử lý</p>
                <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
                  Video này đang được mã hóa và tối ưu hóa trên máy chủ. Trình phát và các tính năng thiết lập câu hỏi tương tác (Quiz) sẽ sẵn sàng sau khi quá trình xử lý hoàn tất.
                </p>
              </div>
            ) : videoUrl ? (
              <video
                ref={videoRef}
                className="h-full w-full object-cover cursor-pointer bg-transparent rounded-xl"
                playsInline
                preload="metadata"
                poster={thumbnailUrl ?? undefined}
                onClick={handleTogglePlayback}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={(event) =>
                  setCurrentTime(event.currentTarget.currentTime)
                }
                onLoadedMetadata={(event) => {
                  setCurrentTime(event.currentTarget.currentTime);
                  setMediaDuration(event.currentTarget.duration);
                }}
                onDurationChange={(event) => {
                  setMediaDuration(event.currentTarget.duration);
                }}
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="text-center text-muted-foreground px-4 flex flex-col items-center gap-2">
                <div className="rounded-full bg-muted/60 p-3 text-muted-foreground/60">
                  <Clapperboard className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-foreground mt-1">Chưa chọn video cho bài học này</p>
                <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
                  Vui lòng tải lên file video mới ở khung phía trên hoặc chọn một video có sẵn từ thư viện của bạn để kích hoạt trình phát và thiết lập Quiz.
                </p>
              </div>
            )}

          {videoUrl && safeDuration > 0 ? (
            <div className="absolute inset-x-2 bottom-2 z-20 rounded-lg border border-white/20 bg-black/60 px-2 py-2 backdrop-blur-sm sm:inset-x-3 sm:bottom-3 sm:px-2.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTogglePlayback}
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/30 bg-black/35 text-white hover:bg-black/55"
                >
                  {isPlaying ? (
                    <Pause className="h-3.5 w-3.5" />
                  ) : (
                    <Play className="ml-0.5 h-3.5 w-3.5" />
                  )}
                </button>

                <span className="w-12 shrink-0 text-[11px] text-white/90">
                  {formatTime(currentTime)}
                </span>

                <div
                  ref={timelineTrackRef}
                  className="relative flex-1 cursor-pointer"
                  onClick={handleTimelineSeek}
                >
                  <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-white/25">
                    <div
                      className="h-full bg-primary/85"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <input
                    type="range"
                    min={0}
                    max={safeDuration}
                    step={0.01}
                    value={Math.min(safeDuration, Math.max(0, currentTime))}
                    onChange={(event) => {
                      handleSeekChange(Number(event.target.value));
                    }}
                    className="relative z-10 h-4 w-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:shadow-xs [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:shadow-xs [&::-moz-range-thumb]:border-0"
                  />

                  {timelineMarkers.map((marker, index) => {
                    const left = (marker.timestampSeconds / safeDuration) * 100;
                    const isActive =
                      Math.abs(currentTime - marker.timestampSeconds) <= 1.2;

                    return (
                      <button
                        key={`${marker.quizId}-${index}-${marker.timestampSeconds}`}
                        type="button"
                        title={`${marker.timestampLabel} - ${marker.questionText}`}
                        className={`absolute top-1/2 z-20 h-3.5 w-3.5 -translate-y-1/2 -translate-x-1/2 rounded-full border-2 transition ${
                          isActive
                            ? "border-primary bg-primary shadow-[0_0_0_3px_rgba(59,130,246,0.35)]"
                            : "border-black/60 bg-amber-300 hover:scale-110"
                        }`}
                        style={{
                          left: `calc(${left}% - ${(left / 100) * 12}px + 6px)`,
                        }}
                        onMouseEnter={() =>
                          openMarkerTooltip(
                            `${marker.quizId}-${index}-${marker.timestampSeconds}`,
                          )
                        }
                        onMouseLeave={scheduleTooltipHide}
                        onClick={(event) => {
                          event.stopPropagation();
                          setEditingMarker(marker);
                        }}
                      />
                    );
                  })}

                  {hoveredMarker ? (
                    <div
                      className="pointer-events-auto absolute bottom-full z-30 mb-4 w-62 max-w-[calc(100vw-3rem)] rounded-lg border border-border/70 bg-background/95 p-2.5 text-foreground shadow-lg transition-all duration-150"
                      style={{
                        left: `calc(${hoveredLeft}% - ${(hoveredLeft / 100) * 12}px + 6px)`,
                        transform: `translateX(${tooltipTranslateX})`,
                      }}
                      onMouseEnter={clearTooltipHideTimeout}
                      onMouseLeave={scheduleTooltipHide}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <p className="line-clamp-1 text-xs font-semibold">
                        {hoveredMarker.quizName}
                      </p>
                      <p className="line-clamp-1 text-[11px] text-muted-foreground mt-0.5">
                        {hoveredMarker.questionText}
                      </p>
                      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-border/40 pt-2">
                        <span className="inline-flex items-center gap-1 rounded-md border border-border/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          <Flag className="h-3 w-3 text-primary" />
                          {hoveredMarker.timestampLabel}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            className="pointer-events-auto h-7 px-2.5 text-[11px] font-bold text-white bg-primary hover:bg-primary/90 rounded-md transition-all shadow-xs cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              seekTo(hoveredMarker.timestampSeconds);
                            }}
                          >
                            Tới mốc
                          </button>
                          <button
                            type="button"
                            className="pointer-events-auto h-7 px-2.5 text-[11px] font-bold bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700/80 rounded-md transition-all shadow-xs cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingMarker(hoveredMarker);
                            }}
                          >
                            Sửa ngay
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

                <span className="w-12 shrink-0 text-right text-[11px] text-white/90 mr-1.5">
                  {formatTime(safeDuration)}
                </span>

                <DropdownMenu onOpenChange={(open) => { if (!open) setMenuView("main"); }}>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/20 bg-black/25 text-white hover:bg-black/55 focus:outline-hidden transition-colors"
                      aria-label="Cài đặt video"
                    >
                      <Settings className="h-3.5 w-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-48 border border-white/15 bg-slate-900/95 text-white shadow-xl backdrop-blur-md"
                  >
                    {menuView === "main" && (
                      <div className="flex flex-col gap-0.5 p-1">
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault();
                            setMenuView("speed");
                          }}
                          className="focus:bg-white/10 focus:text-white cursor-pointer flex items-center justify-between rounded-lg px-2 py-1.5 text-[12px] transition-colors"
                        >
                          <span className="font-medium text-white/90">Tốc độ phát</span>
                          <span className="flex items-center gap-1 text-[11px] text-white/50">
                            {playbackRate === 1 ? "Thường" : `${playbackRate}x`}
                            <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                          </span>
                        </DropdownMenuItem>

                        {qualityLevels && qualityLevels.length > 1 && (
                          <DropdownMenuItem
                            onSelect={(e) => {
                              e.preventDefault();
                              setMenuView("quality");
                            }}
                            className="focus:bg-white/10 focus:text-white cursor-pointer flex items-center justify-between rounded-lg px-2 py-1.5 text-[12px] transition-colors"
                          >
                            <span className="font-medium text-white/90">Chất lượng</span>
                            <span className="flex items-center gap-1 text-[11px] text-white/50">
                              {currentQualityName}
                              <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                            </span>
                          </DropdownMenuItem>
                        )}
                      </div>
                    )}

                    {menuView === "speed" && (
                      <div className="flex flex-col gap-0.5 p-1">
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault();
                            setMenuView("main");
                          }}
                          className="focus:bg-white/10 focus:text-white cursor-pointer flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[12px] font-semibold text-white/70 border-b border-white/5 mb-1"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                          <span>Tốc độ phát</span>
                        </DropdownMenuItem>

                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => {
                          const isSelected = playbackRate === rate;
                          return (
                            <DropdownMenuItem
                              key={rate}
                              onSelect={() => {
                                setPlaybackRate(rate);
                                if (videoRef.current) {
                                  videoRef.current.playbackRate = rate;
                                }
                              }}
                              className="focus:bg-white/10 focus:text-white cursor-pointer flex items-center justify-between rounded-lg px-2 py-1 text-[12px]"
                            >
                              <span className={isSelected ? "font-semibold text-primary" : "text-white/90"}>
                                {rate === 1 ? "Thường" : `${rate}x`}
                              </span>
                              {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                            </DropdownMenuItem>
                          );
                        })}
                      </div>
                    )}

                    {menuView === "quality" && (
                      <div className="flex flex-col gap-0.5 p-1">
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault();
                            setMenuView("main");
                          }}
                          className="focus:bg-white/10 focus:text-white cursor-pointer flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[12px] font-semibold text-white/70 border-b border-white/5 mb-1"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                          <span>Chất lượng</span>
                        </DropdownMenuItem>

                        {qualityLevels.map((level) => {
                          const isSelected = currentQualityLevel === level.id;
                          return (
                            <DropdownMenuItem
                              key={level.id}
                              onSelect={() => {
                                setCurrentQualityLevel(level.id);
                              }}
                              className="focus:bg-white/10 focus:text-white cursor-pointer flex items-center justify-between rounded-lg px-2 py-1 text-[12px]"
                            >
                              <span className={isSelected ? "font-semibold text-primary" : "text-white/90"}>
                                {level.name}
                              </span>
                              {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                            </DropdownMenuItem>
                          );
                        })}
                      </div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>


            </div>
          ) : null}
        </div>
      </div>

      </div>

      <Dialog
        open={Boolean(editingMarker)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingMarker(null);
            setDraftQuizState(null);
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="h-[92vh] w-[92vw] sm:max-w-2xl overflow-hidden rounded-2xl border border-border/70 p-0 shadow-2xl flex flex-col transition-all duration-300"
        >
          <div className="flex h-full min-h-0 flex-col">
            <DialogHeader className="border-b border-border/70 bg-linear-to-r from-background to-muted/20 px-4 py-4 pr-12 text-left sm:px-6 sm:pr-16 relative">
              <DialogTitle className="text-xl font-bold">
                Chỉnh quiz trong video
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground/80 mt-1">
                Chỉnh trực tiếp quiz gắn với mốc đang chọn mà không cần chuyển trang.
              </DialogDescription>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setEditingMarker(null);
                  setDraftQuizState(null);
                }}
                className="absolute right-4 top-4 h-8 w-8 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground z-20"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </DialogHeader>

            <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4 lg:p-5 space-y-4">
              {editingQuizState ? (
                <QuizEditor
                  quiz={editingQuizState}
                  showSaveButton={false}
                  onStateChange={setDraftQuizState}
                  videoUrl={videoUrl}
                  videoDurationSeconds={safeDuration}
                />
              ) : (
                <div className="rounded-xl border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
                  Đang tải quiz...
                </div>
              )}
            </div>

            <DialogFooter className="border-t border-border/70 bg-background px-4 py-3 sm:px-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingMarker(null);
                  setDraftQuizState(null);
                }}
              >
                Hủy
              </Button>
              <Button
                type="button"
                onClick={() => {
                  const stateToSave = draftQuizState ?? editingQuizState;
                  if (!stateToSave) {
                    return;
                  }
                  void handleSaveQuiz(stateToSave);
                }}
                disabled={!editingQuizState || updateQuizMutation.isPending}
              >
                {updateQuizMutation.isPending ? "Đang lưu..." : "Lưu quiz"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
