"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Flag, Pause, Play } from "lucide-react";
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
    const mm = Math.floor(safe / 60);
    const ss = safe % 60;
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
    <Card className="overflow-hidden border-0 bg-background shadow-md">
      <CardContent className="space-y-3 p-0">
        <div className="relative flex aspect-video w-full items-center justify-center bg-black">
          {videoLoading ? (
            <div className="text-xs text-muted-foreground">
              Đang tải video...
            </div>
          ) : videoUrl ? (
            <video
              ref={videoRef}
              className="h-full w-full cursor-pointer"
              src={videoUrl}
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

                <span className="w-12 shrink-0 text-right text-[11px] text-white/90">
                  {formatTime(safeDuration)}
                </span>
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

        {videoUrl ? (
          <div className="px-4 pb-4">
            {timelineMarkers.length ? null : (
              <div className="rounded-lg border border-dashed border-border/60 bg-background px-3 py-2 text-xs text-muted-foreground">
                Chưa có quiz gắn mốc trong video. Tạo quiz với mode "Trong
                video" để hiển thị marker.
              </div>
            )}
          </div>
        ) : null}
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
        <DialogContent className="h-[92vh] w-[96vw] max-w-none overflow-hidden rounded-2xl border border-border/70 p-0 shadow-2xl sm:w-[92vw] lg:w-7xl">
          <div className="flex h-full min-h-0 flex-col">
            <DialogHeader className="border-b border-border/70 bg-linear-to-r from-background to-muted/20 px-4 py-4 text-left sm:px-6">
              <DialogTitle className="text-xl">
                Chỉnh quiz trong video
              </DialogTitle>
              <DialogDescription>
                Chỉnh trực tiếp quiz gắn với mốc đang chọn mà không cần chuyển
                trang.
              </DialogDescription>
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
