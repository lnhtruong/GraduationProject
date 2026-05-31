"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bookmark,
  Ellipsis,
  Flag,
  Gauge,
  Heart,
  Maximize2,
  MessageCircle,
  Pause,
  PictureInPicture2,
  Play,
  Settings2,
  Share2,
  Subtitles,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { NewsfeedItem } from "../types";
import { useNewsfeedInteractMutation } from "../api/newsfeed.hooks";
import { useNewsfeedViewTracker } from "../hooks/useNewsfeedFeedStrategy";
import { getInitials } from "./newsfeed-ui";

export const NEWSFEED_PLAYBACK_RATE_OPTIONS = ["0.5", "0.75", "1", "1.25", "1.5", "2"] as const;

export type NewsfeedPlaybackRate = (typeof NEWSFEED_PLAYBACK_RATE_OPTIONS)[number];

function sanitizeDescriptionHtml(input?: string) {
  if (!input) {
    return "";
  }

  return input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/\son\w+=("[^"]*"|'[^']*')/gi, "")
    .replace(/javascript:/gi, "");
}

function stripHtml(input?: string) {
  const safeHtml = sanitizeDescriptionHtml(input);
  return safeHtml.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeHashtag(tag: string) {
  return tag.replace(/^#+/, "").trim();
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

interface CaptionSegment {
  kind: "text" | "hashtag";
  text: string;
  tag?: string;
}

interface NewsfeedVideoCardProps {
  video: NewsfeedItem;
  isActive: boolean;
  shouldPreload: boolean;
  playbackRate: NewsfeedPlaybackRate;
  onPlaybackRateChange: (rate: NewsfeedPlaybackRate) => void;
  onOpenCourse: () => void;
  onOpenComments: () => void;
  onOpenShare: (url: string) => void;
}

export function NewsfeedVideoCard({
  video,
  isActive,
  shouldPreload,
  playbackRate,
  onPlaybackRateChange,
  onOpenCourse,
  onOpenComments,
  onOpenShare,
}: NewsfeedVideoCardProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const longPressTimer = useRef<number | null>(null);
  const longPressTriggered = useRef(false);

  const [videoAspectRatio, setVideoAspectRatio] = useState(16 / 9);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isVolumeHovered, setIsVolumeHovered] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isLiked, setIsLiked] = useState(video.isLiked);
  const [isSaved, setIsSaved] = useState(video.isSaved);
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const interactMutation = useNewsfeedInteractMutation();
  useNewsfeedViewTracker({
    feedId: video.feedId,
    isActive,
    currentTime,
    duration,
  });

  useEffect(() => {
    setIsLiked(video.isLiked);
  }, [video.feedId, video.isLiked]);

  useEffect(() => {
    setIsSaved(video.isSaved);
  }, [video.feedId, video.isSaved]);

  useEffect(() => {
    setIsCaptionExpanded(false);
  }, [video.feedId]);

  useEffect(() => {
    const element = videoRef.current;
    if (!element) {
      return;
    }

    element.playbackRate = Number(playbackRate);
  }, [playbackRate, video.id]);

  const isPortraitVideo = videoAspectRatio < 1;
  const captionText = useMemo(
    () => stripHtml(video.caption ?? video.description),
    [video.caption, video.description],
  );
  const hashtagItems = useMemo(
    () =>
      video.hashtags
        .map((tag) => normalizeHashtag(tag))
        .filter((tag) => tag.length > 0),
    [video.hashtags],
  );
  const fullCaptionSegments = useMemo(() => {
    const segments: CaptionSegment[] = [];

    if (captionText) {
      segments.push({ kind: "text", text: captionText });
    }

    hashtagItems.forEach((tag) => {
      segments.push({ kind: "hashtag", text: `#${tag}`, tag });
    });

    return segments;
  }, [captionText, hashtagItems]) as CaptionSegment[];
  const collapsedCaptionSegments = useMemo(() => {
    const limit = 110;
    const segments: CaptionSegment[] = [];
    let consumedLength = 0;

    for (const segment of fullCaptionSegments) {
      const separatorLength = segments.length > 0 ? 1 : 0;
      const availableLength = limit - consumedLength - separatorLength;

      if (availableLength <= 0) {
        break;
      }

      if (separatorLength > 0) {
        consumedLength += separatorLength;
      }

      if (segment.text.length <= availableLength) {
        segments.push(segment);
        consumedLength += segment.text.length;
        continue;
      }

      if (segment.kind === "text") {
        const clippedText = segment.text.slice(0, availableLength).trimEnd();
        if (clippedText) {
          segments.push({ kind: "text", text: clippedText });
        }
      }

      break;
    }

    return segments;
  }, [fullCaptionSegments]);
  const fullCaptionText = useMemo(
    () => fullCaptionSegments.map((segment) => segment.text).join(" "),
    [fullCaptionSegments],
  );
  const collapsedCaptionText = useMemo(
    () => collapsedCaptionSegments.map((segment) => segment.text).join(" "),
    [collapsedCaptionSegments],
  );
  const captionHasOverflow = fullCaptionText.length > collapsedCaptionText.length;

  const displayStats = video.stats;
  const progressPercent =
    duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;
  const volumePercent = isMuted ? 0 : volume * 100;

  const handleHashtagClick = useCallback(
    (tag: string) => {
      const query = normalizeHashtag(tag);
      if (!query) {
        return;
      }
      router.push(`/newsfeed/search?q=${encodeURIComponent(query)}`);
    },
    [router],
  );

  const toggleInteraction = useCallback(
    async (type: "like" | "save") => {
      try {
        const result = await interactMutation.mutateAsync({
          feedId: video.feedId,
          type,
        });

        if (type === "like") {
          setIsLiked(result.active);
          return;
        }

        setIsSaved(result.active);
      } catch {
        // Keep the current UI state if the toggle fails.
      }
    },
    [interactMutation, video.feedId],
  );

  const handleTogglePlay = useCallback(async () => {
    const element = videoRef.current;
    if (!element) {
      return;
    }

    const tryPlay = async () => {
      await element.play();
      setIsPaused(false);
    };

    if (element.paused) {
      try {
        await tryPlay();
      } catch (error) {
        if (isAbortError(error)) {
          return;
        }
        const shouldRestoreAudio = !element.muted;
        element.muted = true;
        try {
          await tryPlay();
          if (shouldRestoreAudio) {
            window.setTimeout(() => {
              const currentElement = videoRef.current;
              if (currentElement) {
                currentElement.muted = false;
              }
            }, 0);
          }
        } catch {
          setIsPaused(true);
        }
      }
      return;
    }

    element.pause();
    setIsPaused(true);
  }, []);

  const handleToggleMute = useCallback(() => {
    setIsMuted((current) => {
      const next = !current;
      if (videoRef.current) {
        videoRef.current.muted = next;
      }
      if (!next && volume <= 0) {
        setVolume(0.5);
      }
      return next;
    });
  }, [volume]);

  const handleVolumeChange = (value: number) => {
    const clamped = Math.max(0, Math.min(value, 1));
    setVolume(clamped);
    setIsMuted(clamped <= 0);
  };

  useEffect(() => {
    const element = videoRef.current;
    if (!element) {
      return;
    }
    element.muted = isMuted;
    element.volume = volume;
  }, [isMuted, volume]);

  useEffect(() => {
    const element = videoRef.current;
    if (!element) {
      return;
    }

    if (isActive) {
      element.currentTime = 0;
      void element.play()
        .then(() => {
          setIsPaused(false);
        })
        .catch((error) => {
          if (isAbortError(error)) {
            return;
          }

          const shouldRestoreAudio = !element.muted;
          element.muted = true;
          void element.play()
            .then(() => {
              setIsPaused(false);
              if (shouldRestoreAudio) {
                window.setTimeout(() => {
                  const currentElement = videoRef.current;
                  if (currentElement) {
                    currentElement.muted = false;
                  }
                }, 0);
              }
            })
            .catch(() => {
              setIsPaused(true);
            });
        });
      return;
    }

    element.pause();
    setIsPaused(true);
  }, [isActive]);

  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        window.clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  const handlePointerDown = () => {
    longPressTriggered.current = false;
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
    }
    longPressTimer.current = window.setTimeout(() => {
      longPressTriggered.current = true;
      void handleTogglePlay();
    }, 350);
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const seekFromClientX = useCallback(
    (clientX: number) => {
      const track = timelineRef.current;
      if (!track || duration <= 0) {
        return;
      }
      const rect = track.getBoundingClientRect();
      const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
      const ratio = rect.width > 0 ? x / rect.width : 0;
      const nextTime = ratio * duration;
      if (videoRef.current) {
        videoRef.current.currentTime = nextTime;
      }
      setCurrentTime(nextTime);
    },
    [duration],
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

  const handleFullscreen = () => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void container.requestFullscreen();
    }
  };

  const handleVideoClick = () => {
    if (isCaptionExpanded) {
      setIsCaptionExpanded(false);
      return;
    }

    void handleTogglePlay();
  };

  return (
    <article
      ref={containerRef}
      className="relative flex h-[calc(100vh-64px)] w-full snap-start items-center justify-center"
    >
      <div className="flex h-full w-full items-center justify-center gap-4 px-2 md:px-6">
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl border border-border/60 bg-black shadow-xl",
            isPortraitVideo
              ? "h-[calc(100vh-96px)] aspect-[9/16]"
              : "w-full max-w-[min(78vw,1100px)] aspect-video max-h-[calc(100vh-120px)]",
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => {
            if (!isMenuOpen) {
              setIsHovered(false);
            }
          }}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onClick={handleVideoClick}
        >
          <video
            ref={videoRef}
            key={video.id}
            poster={video.thumbnail ?? undefined}
            data-active={isActive}
            className="h-full w-full object-contain"
            autoPlay
            playsInline
            loop
            muted={isMuted}
            preload={shouldPreload ? "auto" : "metadata"}
            crossOrigin="anonymous"
            onLoadedMetadata={(event) => {
              const { videoWidth, videoHeight } = event.currentTarget;
              if (videoWidth > 0 && videoHeight > 0) {
                setVideoAspectRatio(videoWidth / videoHeight);
              }
              setDuration(event.currentTarget.duration || 0);
            }}
            onTimeUpdate={(event) => {
              setCurrentTime(event.currentTarget.currentTime || 0);
            }}
          >
            <source src={video.videoUrl} type="video/mp4" />
          </video>

          <div
            className={cn(
              "absolute left-4 top-4 flex items-center gap-2 transition-opacity",
              isHovered ? "opacity-100" : "opacity-0",
            )}
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
            onMouseEnter={() => setIsVolumeHovered(true)}
            onMouseLeave={() => setIsVolumeHovered(false)}
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full border border-white/20 bg-black/70 text-white hover:bg-white/15"
              onClick={(event) => {
                event.stopPropagation();
                void handleTogglePlay();
              }}
            >
              {isPaused ? (
                <Play className="h-4 w-4" />
              ) : (
                <Pause className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full border border-white/20 bg-black/70 text-white hover:bg-white/15"
              onClick={(event) => {
                event.stopPropagation();
                handleToggleMute();
              }}
            >
              {isMuted || volume <= 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            <div
              className={cn(
                "relative h-9 overflow-hidden rounded-full border border-white/10 bg-black/65 px-3 shadow-lg backdrop-blur-sm transition-all duration-200",
                isVolumeHovered
                  ? "w-28 opacity-100"
                  : "w-0 opacity-0 pointer-events-none",
              )}
            >
              <div className="absolute inset-x-3 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-150"
                  style={{ width: `${volumePercent}%` }}
                />
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                onChange={(event) => handleVolumeChange(Number(event.target.value))}
                className={cn(
                  "relative z-10 h-full w-full appearance-none bg-transparent",
                  "[&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-transparent",
                  "[&::-moz-range-track]:h-1 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-transparent",
                  "[&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-sm",
                  "[&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-background [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:shadow-sm",
                )}
              />
            </div>
          </div>

          <div
            className={cn(
              "absolute right-4 top-4 flex items-center gap-2 transition-opacity",
              isHovered ? "opacity-100" : "opacity-0",
            )}
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <DropdownMenu
              open={isMenuOpen}
              onOpenChange={(open) => {
                setIsMenuOpen(open);
                if (open) {
                  setIsHovered(true);
                }
              }}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full border border-white/15 bg-black/60 text-white hover:bg-white/10"
                  onClick={(event) => event.stopPropagation()}
                >
                  <Ellipsis className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel>Tùy chọn video</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings2 className="h-4 w-4" />Chất lượng
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Gauge className="h-4 w-4" />
                    <span>Tốc độ phát</span>
                    <span className="ml-auto text-xs font-medium text-muted-foreground">
                      {playbackRate}x
                    </span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-44">
                    <DropdownMenuLabel>Tốc độ hiện tại</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup
                      value={playbackRate}
                      onValueChange={(value) => {
                        const selectedRate = NEWSFEED_PLAYBACK_RATE_OPTIONS.includes(
                          value as NewsfeedPlaybackRate,
                        )
                          ? (value as NewsfeedPlaybackRate)
                          : "1";
                        onPlaybackRateChange(selectedRate);
                      }}
                    >
                      {NEWSFEED_PLAYBACK_RATE_OPTIONS.map((value) => (
                        <DropdownMenuRadioItem key={value} value={value}>
                          {value}x
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuItem>
                  <Subtitles className="h-4 w-4" />Phụ đề
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Volume2 className="h-4 w-4" />Tự động cuộn
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <PictureInPicture2 className="h-4 w-4" />Picture in Picture
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Flag className="h-4 w-4" />Báo cáo
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full border border-white/20 bg-black/70 text-white hover:bg-white/15"
              onClick={(event) => {
                event.stopPropagation();
                handleFullscreen();
              }}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>

          <div
            className="absolute bottom-5 left-5 right-5 z-10 text-white"
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <p className="text-lg font-semibold leading-tight">
              {video.title}
            </p>
            <div
              className={cn(
                "mt-1 rounded-2xl px-3 py-2 text-sm leading-6 text-white/90 transition-all duration-200",
                isCaptionExpanded
                  ? "bg-black/35 backdrop-blur-sm"
                  : "bg-black/20 backdrop-blur-[1px]",
              )}
            >
              <div className="whitespace-normal break-words">
                {(isCaptionExpanded ? fullCaptionSegments : collapsedCaptionSegments).map(
                  (segment, index) => {
                    const content =
                      segment.kind === "hashtag" && segment.tag ? (
                        <button
                          key={`${segment.text}-${index}`}
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleHashtagClick(segment.tag ?? segment.text);
                          }}
                          className="font-bold text-white underline-offset-2 transition-opacity hover:underline hover:opacity-90"
                        >
                          {segment.text}
                        </button>
                      ) : (
                        <span key={`${segment.text}-${index}`}>{segment.text}</span>
                      );

                    return (
                      <span key={`${segment.text}-${index}`}>
                        {index > 0 ? " " : null}
                        {content}
                      </span>
                    );
                  },
                )}
                {!isCaptionExpanded && captionHasOverflow ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setIsCaptionExpanded(true);
                    }}
                    className="ml-1 font-bold text-primary underline-offset-2 hover:underline"
                  >
                    ...xem thêm
                  </button>
                ) : null}
              </div>
              {isCaptionExpanded ? (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setIsCaptionExpanded(false);
                  }}
                  className="mt-1 text-xs font-semibold text-primary underline-offset-2 hover:underline"
                >
                  ẩn bớt
                </button>
              ) : null}
            </div>
          </div>

          <div
            ref={timelineRef}
            className={cn(
              "absolute bottom-0 left-0 right-0 h-1 cursor-pointer bg-white/10 transition-opacity",
              isHovered ? "opacity-100" : "opacity-35",
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
        </div>

        <div
          className="flex flex-col items-center gap-3 pb-6"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <Button
            onClick={(event) => {
              event.stopPropagation();
              onOpenCourse();
            }}
            className="h-12 w-12 rounded-full border border-border/60 bg-background hover:bg-accent"
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={video.course.thumbnail ?? undefined} />
              <AvatarFallback className="text-sm font-semibold">
                {getInitials(video.course.name)}
              </AvatarFallback>
            </Avatar>
          </Button>

          <Button
            variant="ghost"
            className="h-11 w-11 rounded-full border border-border/60 bg-background text-foreground hover:bg-accent"
            disabled={interactMutation.isPending}
            onClick={(event) => {
              event.stopPropagation();
              void toggleInteraction("like");
            }}
          >
            <Heart className={cn("h-5 w-5", isLiked && "fill-red-500 text-red-500")} />
          </Button>
          <span className="-mt-2 text-xs font-semibold text-muted-foreground">
            {displayStats.likes.toLocaleString("vi-VN")}
          </span>

          <Button
            variant="ghost"
            className="h-11 w-11 rounded-full border border-border/60 bg-background text-foreground hover:bg-accent"
            onClick={(event) => {
              event.stopPropagation();
              onOpenComments();
            }}
          >
            <MessageCircle className="h-5 w-5" />
          </Button>
          <span className="-mt-2 text-xs font-semibold text-muted-foreground">
            {displayStats.comments.toLocaleString("vi-VN")}
          </span>

          <Button
            variant="ghost"
            className="h-11 w-11 rounded-full border border-border/60 bg-background text-foreground hover:bg-accent"
            disabled={interactMutation.isPending}
            onClick={async (event) => {
              event.stopPropagation();
              void toggleInteraction("save");
            }}
          >
            <Bookmark className={cn("h-5 w-5", isSaved && "fill-foreground")} />
          </Button>
          <span className="-mt-2 text-xs font-semibold text-muted-foreground">
            {displayStats.saves.toLocaleString("vi-VN")}
          </span>

          <Button
            variant="ghost"
            className="h-11 w-11 rounded-full border border-border/60 bg-background text-foreground hover:bg-accent"
            onClick={(event) => {
              event.stopPropagation();
              onOpenShare(video.videoUrl);
            }}
          >
            <Share2 className="h-5 w-5" />
          </Button>
          <span className="-mt-2 text-xs font-semibold text-muted-foreground">
            {displayStats.shares.toLocaleString("vi-VN")}
          </span>
        </div>

		
      </div>
    </article>
  );
}
