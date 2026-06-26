import React, { useState } from "react";
import {
  Pause,
  Play,
  VolumeX,
  Volume2,
  Minimize,
  Maximize,
  PictureInPicture2,
  Settings,
  ChevronRight,
  ChevronLeft,
  Check,
} from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { formatTime } from "../../utils";

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

interface LessonVideoControlsProps {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  currentTime: number;
  selectedLessonDuration: number;
  playbackRate: number;
  isFullscreen: boolean;
  qualityLevels: { id: number; name: string }[];
  currentQualityLevel: number;
  onSetQualityLevel: (levelId: number) => void;
  onTogglePlayback: () => void;
  onToggleMute: () => void;
  onVolumeChange: (vol: number) => void;
  onSetPlaybackRate: (rate: number) => void;
  onToggleFullscreen: () => void;
  onTogglePictureInPicture: () => void;
}

export function LessonVideoControls({
  isPlaying,
  isMuted,
  volume,
  currentTime,
  selectedLessonDuration,
  playbackRate,
  isFullscreen,
  qualityLevels,
  currentQualityLevel,
  onSetQualityLevel,
  onTogglePlayback,
  onToggleMute,
  onVolumeChange,
  onSetPlaybackRate,
  onToggleFullscreen,
  onTogglePictureInPicture,
}: LessonVideoControlsProps) {
  const [menuView, setMenuView] = useState<"main" | "speed" | "quality">("main");
  const currentQualityName =
    qualityLevels.find((level) => level.id === currentQualityLevel)?.name || "Tự động";

  return (
    <div className="flex items-center justify-between gap-1.5 sm:gap-3">
      <div className="flex min-w-0 items-center gap-1.5 sm:gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onTogglePlayback}
              className="inline-flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white shadow-[0_10px_30px_rgba(0,0,0,0.25)] transition-all hover:bg-white/15 hover:scale-[1.02]"
              aria-label={isPlaying ? "Pause video" : "Play video"}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4 sm:h-5 sm:w-5" />
              ) : (
                <Play className="ml-0.5 h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="rounded-full bg-black/85 px-3 py-1.5 text-white text-xs shadow-lg backdrop-blur-md whitespace-nowrap flex items-center gap-2"
          >
            <span className="sr-only">Phát/Tạm dừng</span>
            {isPlaying ? "Tạm dừng (Space)" : "Phát (Space)"}
          </TooltipContent>
        </Tooltip>

        <div className="group flex items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onToggleMute}
                className="inline-flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition-all hover:bg-white/15"
                aria-label={
                  isMuted || volume === 0 ? "Bật âm lượng" : "Tắt âm lượng"
                }
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                ) : (
                  <Volume2 className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="rounded-full bg-black/85 px-3 py-1.5 text-white text-xs shadow-lg backdrop-blur-md whitespace-nowrap flex items-center gap-2"
            >
              {isMuted || volume === 0 ? "Bật âm lượng (M)" : "Tắt âm lượng (M)"}
            </TooltipContent>
          </Tooltip>

          <div className="w-0 overflow-hidden opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:w-18 group-hover:opacity-100 sm:group-hover:w-24">
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={(event) => onVolumeChange(Number(event.target.value))}
              className="h-1 w-full cursor-pointer accent-primary"
              aria-label="Âm lượng"
            />
          </div>
        </div>

        <div className="min-w-0 rounded-full border border-white/10 bg-white/8 px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-[13px] font-medium text-white/90 backdrop-blur-md whitespace-nowrap">
          {formatTime(currentTime)}
          <span className="mx-1.5 text-white/40">/</span>
          {formatTime(selectedLessonDuration)}
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* settings menu (YouTube-like) */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <DropdownMenu
                onOpenChange={(open) => {
                  if (!open) {
                    setMenuView("main");
                  }
                }}
              >
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition-all hover:bg-white/15"
                    aria-label="Cài đặt video"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <Settings className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  side="top"
                  sideOffset={12}
                  className="w-56 border-white/10 bg-black/95 text-white backdrop-blur-md p-1.5 rounded-xl shadow-2xl"
                >
                  {menuView === "main" && (
                    <div className="flex flex-col gap-0.5">
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          setMenuView("speed");
                        }}
                        className="focus:bg-white/10 focus:text-white cursor-pointer flex items-center justify-between rounded-lg px-2.5 py-2 text-[13px] transition-colors"
                      >
                        <span className="font-medium text-white/90">Tốc độ phát</span>
                        <span className="flex items-center gap-1 text-[12px] text-white/50">
                          {playbackRate === 1 ? "Thường" : `${playbackRate}x`}
                          <ChevronRight className="h-4 w-4 opacity-60" />
                        </span>
                      </DropdownMenuItem>

                      {qualityLevels && qualityLevels.length > 1 && (
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault();
                            setMenuView("quality");
                          }}
                          className="focus:bg-white/10 focus:text-white cursor-pointer flex items-center justify-between rounded-lg px-2.5 py-2 text-[13px] transition-colors"
                        >
                          <span className="font-medium text-white/90">Chất lượng</span>
                          <span className="flex items-center gap-1 text-[12px] text-white/50">
                            {currentQualityName}
                            <ChevronRight className="h-4 w-4 opacity-60" />
                          </span>
                        </DropdownMenuItem>
                      )}
                    </div>
                  )}

                  {menuView === "speed" && (
                    <div className="flex flex-col gap-0.5">
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          setMenuView("main");
                        }}
                        className="focus:bg-white/10 focus:text-white cursor-pointer flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-semibold text-white/70 border-b border-white/5 mb-1"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span>Tốc độ phát</span>
                      </DropdownMenuItem>

                      {PLAYBACK_RATES.map((rate) => {
                        const isSelected = playbackRate === rate;
                        return (
                          <DropdownMenuItem
                            key={rate}
                            onSelect={() => {
                              onSetPlaybackRate(rate);
                            }}
                            className="focus:bg-white/10 focus:text-white cursor-pointer flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[13px]"
                          >
                            <span className={isSelected ? "font-semibold text-primary" : "text-white/90"}>
                              {rate === 1 ? "Thường" : `${rate}x`}
                            </span>
                            {isSelected && <Check className="h-4 w-4 text-primary" />}
                          </DropdownMenuItem>
                        );
                      })}
                    </div>
                  )}

                  {menuView === "quality" && (
                    <div className="flex flex-col gap-0.5">
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          setMenuView("main");
                        }}
                        className="focus:bg-white/10 focus:text-white cursor-pointer flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-semibold text-white/70 border-b border-white/5 mb-1"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span>Chất lượng</span>
                      </DropdownMenuItem>

                      {(() => {
                        const autoLevel = qualityLevels.find((l) => l.id === -1);
                        const otherLevels = qualityLevels.filter((l) => l.id !== -1);
                        const sortedOtherLevels = [...otherLevels].reverse();
                        const finalLevels = autoLevel ? [autoLevel, ...sortedOtherLevels] : sortedOtherLevels;

                        return finalLevels.map((level) => {
                          const isSelected = currentQualityLevel === level.id;
                          return (
                            <DropdownMenuItem
                              key={level.id}
                              onSelect={() => {
                                onSetQualityLevel(level.id);
                              }}
                              className="focus:bg-white/10 focus:text-white cursor-pointer flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[13px]"
                            >
                              <span className={isSelected ? "font-semibold text-primary" : "text-white/90"}>
                                {level.name}
                              </span>
                              {isSelected && <Check className="h-4 w-4 text-primary" />}
                            </DropdownMenuItem>
                          );
                        });
                      })()}
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="rounded-full bg-black/85 px-3 py-1.5 text-white text-xs shadow-lg backdrop-blur-md whitespace-nowrap"
          >
            Cài đặt
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onTogglePictureInPicture}
              className="hidden sm:inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition-all hover:bg-white/15"
              aria-label="Picture in Picture"
            >
              <PictureInPicture2 className="h-4.5 w-4.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="rounded-full bg-black/85 px-3 py-1.5 text-white text-xs shadow-lg backdrop-blur-md whitespace-nowrap flex items-center gap-2"
          >
            Thu nhỏ phát nổi (P)
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onToggleFullscreen}
              className="inline-flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition-all hover:bg-white/15"
              aria-label="Toàn màn hình"
            >
              {isFullscreen ? (
                <Minimize className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
              ) : (
                <Maximize className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="rounded-full bg-black/85 px-3 py-1.5 text-white text-xs shadow-lg backdrop-blur-md whitespace-nowrap flex items-center gap-2"
          >
            {isFullscreen ? "Thoát toàn màn hình (F)" : "Toàn màn hình (F)"}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
