"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Flag, Pause, Play, Clapperboard, Settings, ChevronRight, ChevronLeft, Check, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
import { useQuizById, useUpdateQuiz } from "../../api/course-management.hooks";
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
}

export function VideoPreview({
  courseId,
  lessonId,
  videoUrl,
  videoDurationSeconds,
  videoLoading,
  timelineMarkers = [],
}: Props) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineTrackRef = useRef<HTMLDivElement>(null);
  const tooltipHideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hoveredMarkerKey, setHoveredMarkerKey] = useState<string | null>(null);

  const hlsRef = useRef<Hls | null>(null);
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
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (!videoUrl) {
      videoElement.removeAttribute("src");
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      setQualityLevels([]);
      setCurrentQualityLevel(-1);
      return;
    }

    const isHls = videoUrl.includes(".m3u8");

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
      }
    } else {
      videoElement.src = videoUrl;
      setQualityLevels([]);
      setCurrentQualityLevel(-1);
    }

    return () => {
      if (videoElement) {
        videoElement.pause();
        videoElement.removeAttribute("src");
        try {
          videoElement.load();
        } catch (_) {}
      }
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [videoUrl]);

  const safeDuration = useMemo(() => {
    const fromVideo = Number(videoRef.current?.duration ?? 0);
    if (Number.isFinite(fromVideo) && fromVideo > 0) {
      return fromVideo;
    }
    return Number.isFinite(videoDurationSeconds) ? videoDurationSeconds : 0;
  }, [videoDurationSeconds, currentTime]);

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

  return (
    <Card className="border-border/60 shadow-sm">
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <Clapperboard className="h-4 w-4" />
          </div>
          <div>
            <p className="text-base font-semibold">Trình phát video & timeline Quiz</p>
            <p className="text-xs text-muted-foreground">
              Phát video bài học và quản lý các mốc câu hỏi trắc nghiệm (Quiz) tích hợp trực tiếp trên timeline.
            </p>
          </div>
        </div>

        <div className="pt-2">
          <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl bg-black">
            {videoLoading ? (
              <div className="text-xs text-muted-foreground">
                Đang tải video...
              </div>
            ) : videoUrl ? (
              <video
                ref={videoRef}
                className="h-full w-full cursor-pointer"
                playsInline
                preload="metadata"
                onClick={handleTogglePlayback}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={(event) =>
                  setCurrentTime(event.currentTarget.currentTime)
                }
                onLoadedMetadata={(event) =>
                  setCurrentTime(event.currentTarget.currentTime)
                }
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="text-center text-muted-foreground">
                <p className="mb-2 text-sm">Chưa chọn video cho bài học này.</p>
                <Link
                  href="/upload"
                  className="text-xs font-medium text-primary underline-offset-2 hover:underline"
                >
                  Hãy upload video trước
                </Link>
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
                    className="relative z-10 h-4 w-full appearance-none bg-transparent"
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
                          left: `${Math.max(0.5, Math.min(99.5, left))}%`,
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

              {hoveredMarker ? (
                <div
                  className="pointer-events-auto absolute bottom-full z-30 mb-2 w-62 max-w-[calc(100vw-3rem)] -translate-x-1/2 rounded-lg border border-border/70 bg-background/95 p-2 text-foreground shadow-lg"
                  style={{ left: `${hoveredLeft}%` }}
                  onMouseEnter={clearTooltipHideTimeout}
                  onMouseLeave={scheduleTooltipHide}
                >
                  <p className="line-clamp-1 text-xs font-semibold">
                    {hoveredMarker.quizName}
                  </p>
                  <p className="line-clamp-1 text-[11px] text-muted-foreground">
                    {hoveredMarker.questionText}
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 rounded-md border border-border/60 px-1.5 py-0.5 text-[11px]">
                      <Flag className="h-3 w-3 text-primary" />
                      {hoveredMarker.timestampLabel}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="pointer-events-auto h-7 px-2 text-[11px]"
                        onClick={() => seekTo(hoveredMarker.timestampSeconds)}
                      >
                        Tới mốc
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="pointer-events-auto h-7 px-2 text-[11px]"
                        onClick={() => setEditingMarker(hoveredMarker)}
                      >
                        Sửa ngay
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      </CardContent>

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

            <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4 lg:p-5">
              {editingQuizState ? (
                <QuizEditor
                  quiz={editingQuizState}
                  showSaveButton={false}
                  onStateChange={setDraftQuizState}
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
    </Card>
  );
}
