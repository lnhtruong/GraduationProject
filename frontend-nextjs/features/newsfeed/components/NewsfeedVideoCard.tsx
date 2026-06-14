"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bookmark,
  Ellipsis,
  Eye,
  EyeOff,
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
import { useNewsfeedUiStore } from "../store/newsfeed-ui.store";
import { NEWSFEED_PLAYBACK_RATE_OPTIONS } from "../constants";
import { NewsfeedTimeline } from "./NewsfeedTimeline";

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

  const isGlobalPaused = useNewsfeedUiStore((state) => state.isGlobalPaused);
  const setGlobalPaused = useNewsfeedUiStore((state) => state.setGlobalPaused);

  const [videoAspectRatio, setVideoAspectRatio] = useState(16 / 9);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isVolumeHovered, setIsVolumeHovered] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(video.isLiked);
  const [isSaved, setIsSaved] = useState(video.isSaved);
  const [localLikeCount, setLocalLikeCount] = useState(video.stats.likes);
  const [localSaveCount, setLocalSaveCount] = useState(video.stats.saves);
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);
  const [isOverlayHidden, setIsOverlayHidden] = useState(false);
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>([]);
  const clickTimeoutRef = useRef<number | null>(null);
  const likeMutation = useNewsfeedInteractMutation();
  const saveMutation = useNewsfeedInteractMutation();
  useNewsfeedViewTracker({
    feedId: video.feedId,
    isActive,
    videoRef,
  });

  useEffect(() => {
    setIsLiked(video.isLiked);
  }, [video.feedId, video.isLiked]);

  useEffect(() => {
    setIsSaved(video.isSaved);
  }, [video.feedId, video.isSaved]);

  useEffect(() => {
    setLocalLikeCount(video.stats.likes);
  }, [video.feedId, video.stats.likes]);

  useEffect(() => {
    setLocalSaveCount(video.stats.saves);
  }, [video.feedId, video.stats.saves]);

  useEffect(() => {
    setIsCaptionExpanded(false);
    setIsOverlayHidden(false);
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
      const isCurrentlyActive = type === "like" ? isLiked : isSaved;
      const nextActiveState = !isCurrentlyActive;

      // Optimistic Update
      if (type === "like") {
        setIsLiked(nextActiveState);
        setLocalLikeCount((prev) => prev + (nextActiveState ? 1 : -1));
      } else {
        setIsSaved(nextActiveState);
        setLocalSaveCount((prev) => prev + (nextActiveState ? 1 : -1));
      }

      try {
        const mutation = type === "like" ? likeMutation : saveMutation;
        const result = await mutation.mutateAsync({
          feedId: video.feedId,
          type,
        });

        // Sync with actual server response
        if (type === "like") {
          setIsLiked(result.active);
          if (result.active !== nextActiveState) {
            setLocalLikeCount((prev) => prev + (result.active ? 1 : -1));
          }
        } else {
          setIsSaved(result.active);
          if (result.active !== nextActiveState) {
            setLocalSaveCount((prev) => prev + (result.active ? 1 : -1));
          }
        }
      } catch {
        // Rollback on failure
        if (type === "like") {
          setIsLiked(isCurrentlyActive);
          setLocalLikeCount((prev) => prev + (isCurrentlyActive ? 1 : -1));
        } else {
          setIsSaved(isCurrentlyActive);
          setLocalSaveCount((prev) => prev + (isCurrentlyActive ? 1 : -1));
        }
      }
    },
    [isLiked, isSaved, likeMutation, saveMutation, video.feedId],
  );

  const handleTogglePlay = useCallback(() => {
    const { toggleGlobalPaused } = useNewsfeedUiStore.getState();
    toggleGlobalPaused();
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

    if (!isActive) {
      element.pause();
      setIsPaused(true);
      return;
    }

    if (isGlobalPaused) {
      element.pause();
      setIsPaused(true);
    } else {
      const tryPlay = async () => {
        await element.play();
        setIsPaused(false);
      };

      void tryPlay().catch((error) => {
        if (isAbortError(error)) {
          return;
        }

        const shouldRestoreAudio = !element.muted;
        element.muted = true;
        void tryPlay()
          .then(() => {
            if (shouldRestoreAudio) {
              window.setTimeout(() => {
                if (videoRef.current) {
                  videoRef.current.muted = false;
                }
              }, 0);
            }
          })
          .catch(() => {
            setIsPaused(true);
            setGlobalPaused(true);
          });
      });
    }
  }, [isActive, isGlobalPaused, setGlobalPaused]);

  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        window.clearTimeout(longPressTimer.current);
      }
      if (clickTimeoutRef.current) {
        window.clearTimeout(clickTimeoutRef.current);
      }

      const element = videoRef.current;
      if (element) {
        try {
          element.pause();
          element.src = "";
          element.removeAttribute("src");
          while (element.firstChild) {
            element.removeChild(element.firstChild);
          }
          element.load();
        } catch {
          // ignore errors during unmount cleanup
        }
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

  const handleDoubleClick = useCallback(
    (clientX: number, clientY: number, currentTarget: HTMLDivElement) => {
      // Trigger like if not liked
      if (!isLiked) {
        void toggleInteraction("like");
      }

      // Add a heart animation
      const rect = currentTarget.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      const newHeart = {
        id: Date.now() + Math.random(),
        x,
        y,
      };

      setHearts((prev) => [...prev, newHeart]);

      // Remove after animation completes
      window.setTimeout(() => {
        setHearts((prev) => prev.filter((h) => h.id !== newHeart.id));
      }, 800);
    },
    [isLiked, toggleInteraction],
  );

  const handleVideoClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (isCaptionExpanded) {
        setIsCaptionExpanded(false);
        return;
      }

      if (clickTimeoutRef.current) {
        // Double click detected!
        window.clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
        
        handleDoubleClick(event.clientX, event.clientY, event.currentTarget);
      } else {
        // Set timeout to wait for possible double click
        const clientX = event.clientX;
        const clientY = event.clientY;
        const currentTarget = event.currentTarget;
        
        clickTimeoutRef.current = window.setTimeout(() => {
          clickTimeoutRef.current = null;
          void handleTogglePlay();
        }, 220);
      }
    },
    [isCaptionExpanded, handleTogglePlay, handleDoubleClick],
  );

  return (
    <article
      ref={containerRef}
      className="relative flex h-[calc(100vh-64px)] w-full snap-start items-center justify-center"
    >
      <div className="relative flex h-full w-full items-center justify-center gap-4 p-0 md:px-6">
        {/* Style block for floating heart animation */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes heartPopFade {
            0% {
              opacity: 0;
              transform: scale(0.3) rotate(-15deg);
            }
            15% {
              opacity: 0.95;
              transform: scale(1.3) rotate(15deg);
            }
            30% {
              transform: scale(0.95) rotate(-10deg);
            }
            80% {
              opacity: 0.95;
              transform: scale(1.05) translateY(-40px) rotate(0deg);
            }
            100% {
              opacity: 0;
              transform: scale(0.8) translateY(-85px) rotate(0deg);
            }
          }
          .animate-heart-pop-fade {
            animation: heartPopFade 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          }
        `}} />

        <div
          className={cn(
            "relative overflow-hidden bg-background dark:bg-black md:bg-black shadow-xl",
            "w-full h-full rounded-none border-0",
            "md:rounded-2xl md:border md:border-border/60",
            isPortraitVideo
              ? "md:h-[calc(100vh-96px)] md:max-h-full md:aspect-[9/16] md:max-w-full"
              : "md:w-full md:max-w-[min(78vw,1100px)] md:aspect-video md:max-h-[calc(100vh-120px)]",
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
          >
            <source src={video.videoUrl} type="video/mp4" />
          </video>

          {/* Floating Hearts for Double-tap to Like */}
          {hearts.map((heart) => (
            <div
              key={heart.id}
              className="absolute pointer-events-none select-none z-30 animate-heart-pop-fade text-red-500"
              style={{
                left: heart.x - 24,
                top: heart.y - 24,
              }}
            >
              <Heart className="h-12 w-12 fill-red-500 stroke-white stroke-2 drop-shadow-lg" />
            </div>
          ))}

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
              className="h-9 w-9 rounded-full border border-border/40 bg-background/80 text-foreground hover:bg-muted dark:border-white/20 dark:bg-black/70 dark:text-white dark:hover:bg-white/15 md:border-white/20 md:bg-black/70 md:text-white md:hover:bg-white/15"
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
              className="h-9 w-9 rounded-full border border-border/40 bg-background/80 text-foreground hover:bg-muted dark:border-white/20 dark:bg-black/70 dark:text-white dark:hover:bg-white/15 md:border-white/20 md:bg-black/70 md:text-white md:hover:bg-white/15"
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
                "relative h-9 overflow-hidden rounded-full border border-border/40 bg-background/80 px-3 shadow-lg backdrop-blur-sm transition-all duration-200 dark:border-white/10 dark:bg-black/65 md:border-white/10 md:bg-black/65",
                isVolumeHovered
                  ? "w-28 opacity-100"
                  : "w-0 opacity-0 pointer-events-none",
              )}
            >
              <div className="absolute inset-x-3 top-1/2 h-1 -translate-y-1/2 rounded-full bg-muted dark:bg-white/15 md:bg-white/15">
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
              "absolute right-4 top-4 flex items-center gap-2 transition-opacity z-30",
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
                  className="h-9 w-9 rounded-full border border-border/40 bg-background/80 text-foreground hover:bg-muted dark:border-white/15 dark:bg-black/60 dark:text-white dark:hover:bg-white/10 md:border-white/15 md:bg-black/60 md:text-white md:hover:bg-white/10"
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
              className="h-9 w-9 rounded-full border border-border/40 bg-background/80 text-foreground hover:bg-muted dark:border-white/20 dark:bg-black/70 dark:text-white dark:hover:bg-white/15 md:border-white/20 md:bg-black/70 md:text-white md:hover:bg-white/15"
              onClick={(event) => {
                event.stopPropagation();
                setIsOverlayHidden((prev) => !prev);
              }}
              title={isOverlayHidden ? "Hiện giao diện chữ" : "Ẩn giao diện chữ (Clear Display)"}
            >
              {isOverlayHidden ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full border border-border/40 bg-background/80 text-foreground hover:bg-muted dark:border-white/20 dark:bg-black/70 dark:text-white dark:hover:bg-white/15 md:border-white/20 md:bg-black/70 md:text-white md:hover:bg-white/15"
              onClick={(event) => {
                event.stopPropagation();
                handleFullscreen();
              }}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Nút Toggle Clear Display độc lập cho Mobile khi đang ẩn overlay */}
          {isOverlayHidden && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 h-9 w-9 rounded-full border border-white/10 bg-black/45 text-white/70 hover:bg-black/60 hover:text-white z-30 md:hidden"
              onClick={(event) => {
                event.stopPropagation();
                setIsOverlayHidden(false);
              }}
              title="Hiện giao diện chữ"
            >
              <EyeOff className="h-4 w-4" />
            </Button>
          )}

          {/* Subtle gradient overlay at the bottom to ensure text readability */}
          <div className={cn(
            "absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background via-background/60 to-transparent dark:from-black/85 dark:via-black/25 dark:to-transparent md:from-black/85 md:via-black/25 md:to-transparent pointer-events-none z-10 transition-opacity duration-300 hidden md:block",
            isOverlayHidden && "opacity-0"
          )} />

          {!isCaptionExpanded ? (
            <div
              className={cn(
                "absolute bottom-5 left-5 right-16 md:right-5 z-20 text-foreground md:text-white transition-all duration-300",
                isOverlayHidden && "opacity-0 pointer-events-none"
              )}
              onClick={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-base font-semibold leading-tight line-clamp-1 max-w-[75%] drop-shadow-md select-none">
                  {video.title}
                </p>
                {(captionText.length > 0 || hashtagItems.length > 0) && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setIsCaptionExpanded(true);
                    }}
                    className="rounded-full bg-black/40 hover:bg-black/60 border border-white/20 px-2.5 py-0.5 text-xs font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:scale-105 active:scale-95 flex items-center shadow-sm"
                  >
                    Xem thêm
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div
              className={cn(
                "absolute bottom-0 left-0 right-0 z-20 text-white transition-all duration-300",
                "bg-black/50 backdrop-blur-xl border-t border-white/10 px-6 pt-2.5 pb-3.5",
                "rounded-b-none md:rounded-b-2xl", // Khớp bo góc dưới của video container ở desktop
                isOverlayHidden && "opacity-0 pointer-events-none"
              )}
              onClick={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
            >
              <div className="max-h-[140px] overflow-y-auto pr-8 md:pr-0">
                <p className="text-sm font-bold mb-0.5 leading-tight text-white">{video.title}</p>
                <div className="whitespace-normal break-words opacity-90 text-[13px] leading-normal">
                  {fullCaptionSegments.map((segment, index) => {
                    const content =
                      segment.kind === "hashtag" && segment.tag ? (
                        <button
                          key={`${segment.text}-${index}`}
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleHashtagClick(segment.tag ?? segment.text);
                          }}
                          className="font-bold text-primary underline-offset-2 transition-opacity hover:underline hover:opacity-90"
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
                  })}
                </div>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setIsCaptionExpanded(false);
                  }}
                  className="mt-1 text-[11px] font-semibold text-primary dark:text-white/80 md:text-white/80 hover:text-primary dark:hover:text-primary underline underline-offset-2 hover:opacity-95 block"
                >
                  Ẩn bớt
                </button>
              </div>
            </div>
          )}

          <NewsfeedTimeline
            videoRef={videoRef}
            duration={duration}
            isHovered={isHovered}
            isOverlayHidden={isOverlayHidden}
          />
        </div>

        <div
          className={cn(
            "absolute right-2 bottom-20 md:static flex flex-col items-center gap-3 pb-6 z-20 transition-all duration-300",
            isOverlayHidden && "opacity-0 pointer-events-none"
          )}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <Button
            onClick={(event) => {
              event.stopPropagation();
              onOpenCourse();
            }}
            className="h-12 w-12 rounded-full border border-border bg-background shadow-sm hover:scale-110 active:scale-95 hover:shadow transition-all duration-200 dark:border-border/80 dark:bg-card flex items-center justify-center p-0 cursor-pointer"
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
            className="h-11 w-11 rounded-full border border-border bg-background text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground hover:scale-110 active:scale-95 hover:shadow transition-all duration-200 dark:border-border/80 dark:bg-card dark:hover:bg-accent dark:hover:text-accent-foreground cursor-pointer flex items-center justify-center"
            disabled={likeMutation.isPending}
            onClick={(event) => {
              event.stopPropagation();
              void toggleInteraction("like");
            }}
          >
            <Heart className={cn("h-5 w-5", isLiked && "fill-red-500 text-red-500")} />
          </Button>
          <span className="-mt-2 text-xs font-semibold text-muted-foreground select-none">
            {localLikeCount.toLocaleString("vi-VN")}
          </span>

          <Button
            variant="ghost"
            className="h-11 w-11 rounded-full border border-border bg-background text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground hover:scale-110 active:scale-95 hover:shadow transition-all duration-200 dark:border-border/80 dark:bg-card dark:hover:bg-accent dark:hover:text-accent-foreground cursor-pointer flex items-center justify-center"
            onClick={(event) => {
              event.stopPropagation();
              onOpenComments();
            }}
          >
            <MessageCircle className="h-5 w-5" />
          </Button>
          <span className="-mt-2 text-xs font-semibold text-muted-foreground select-none">
            {displayStats.comments.toLocaleString("vi-VN")}
          </span>

          <Button
            variant="ghost"
            className="h-11 w-11 rounded-full border border-border bg-background text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground hover:scale-110 active:scale-95 hover:shadow transition-all duration-200 dark:border-border/80 dark:bg-card dark:hover:bg-accent dark:hover:text-accent-foreground cursor-pointer flex items-center justify-center"
            disabled={saveMutation.isPending}
            onClick={async (event) => {
              event.stopPropagation();
              void toggleInteraction("save");
            }}
          >
            <Bookmark className={cn("h-5 w-5", isSaved && "fill-foreground")} />
          </Button>
          <span className="-mt-2 text-xs font-semibold text-muted-foreground select-none">
            {localSaveCount.toLocaleString("vi-VN")}
          </span>

          <Button
            variant="ghost"
            className="h-11 w-11 rounded-full border border-border bg-background text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground hover:scale-110 active:scale-95 hover:shadow transition-all duration-200 dark:border-border/80 dark:bg-card dark:hover:bg-accent dark:hover:text-accent-foreground cursor-pointer flex items-center justify-center"
            onClick={(event) => {
              event.stopPropagation();
              onOpenShare(`${window.location.origin}/newsfeed?videoId=${video.feedId}&courseId=${video.course.id}`);
            }}
          >
            <Share2 className="h-5 w-5" />
          </Button>
          <span className="-mt-2 text-xs font-semibold text-muted-foreground select-none">
            {displayStats.shares.toLocaleString("vi-VN")}
          </span>
        </div>

		
      </div>
    </article>
  );
}
