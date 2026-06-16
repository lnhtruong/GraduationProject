import React from "react";
import {
  Pause,
  Play,
  VolumeX,
  Volume2,
  Minimize,
  Maximize,
} from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
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
  onTogglePlayback: () => void;
  onToggleMute: () => void;
  onVolumeChange: (vol: number) => void;
  onSetPlaybackRate: (rate: number) => void;
  onToggleFullscreen: () => void;
}

export function LessonVideoControls({
  isPlaying,
  isMuted,
  volume,
  currentTime,
  selectedLessonDuration,
  playbackRate,
  isFullscreen,
  onTogglePlayback,
  onToggleMute,
  onVolumeChange,
  onSetPlaybackRate,
  onToggleFullscreen,
}: LessonVideoControlsProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onTogglePlayback}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white shadow-[0_10px_30px_rgba(0,0,0,0.25)] transition-all hover:bg-white/15 hover:scale-[1.02]"
              aria-label={isPlaying ? "Pause video" : "Play video"}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="ml-0.5 h-5 w-5" />
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
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition-all hover:bg-white/15"
                aria-label={
                  isMuted || volume === 0 ? "Bật âm lượng" : "Tắt âm lượng"
                }
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-4.5 w-4.5" />
                ) : (
                  <Volume2 className="h-4.5 w-4.5" />
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

        <div className="min-w-0 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-[13px] font-medium text-white/90 backdrop-blur-md">
          {formatTime(currentTime)}
          <span className="mx-1.5 text-white/40">/</span>
          {formatTime(selectedLessonDuration)}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Select
                value={String(playbackRate)}
                onValueChange={(value) => onSetPlaybackRate(Number(value))}
              >
                <SelectTrigger
                  className="h-8 w-17 border border-white/20 bg-black/45 px-2 text-[13px] font-semibold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_8px_20px_rgba(0,0,0,0.25)] transition-all hover:border-white/35 hover:bg-black/60 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_10px_24px_rgba(0,0,0,0.32)] focus:border-white/40 focus:ring-0 focus:ring-offset-0"
                  onClick={(event) => event.stopPropagation()}
                >
                  <SelectValue placeholder="1x" />
                </SelectTrigger>
                <SelectContent
                  align="end"
                  side="top"
                  sideOffset={12}
                  className="border-white/10 bg-black/90 text-white backdrop-blur-md"
                >
                  {PLAYBACK_RATES.map((rate) => (
                    <SelectItem
                      key={rate}
                      value={String(rate)}
                      className="focus:bg-white/20 focus:text-white"
                    >
                      {rate}x
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="rounded-full bg-black/85 px-3 py-1.5 text-white text-xs shadow-lg backdrop-blur-md whitespace-nowrap flex items-center gap-2"
          >
            Tốc độ phát: {playbackRate}x
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onToggleFullscreen}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition-all hover:bg-white/15"
              aria-label="Toàn màn hình"
            >
              {isFullscreen ? (
                <Minimize className="h-4.5 w-4.5" />
              ) : (
                <Maximize className="h-4.5 w-4.5" />
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
