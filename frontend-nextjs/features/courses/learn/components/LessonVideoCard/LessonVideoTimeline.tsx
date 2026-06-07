import React, { useState } from "react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { InVideoQuizPoint, formatTime } from "../../utils";

interface LessonVideoTimelineProps {
  currentTime: number;
  selectedLessonDuration: number;
  progressPercent: number;
  inVideoQuizPoints: InVideoQuizPoint[];
  isQuizSolved: (point: InVideoQuizPoint) => boolean;
  onSeekChange: (nextTime: number) => void;
  onJumpToQuizPoint: (point: InVideoQuizPoint) => void;
  onOverlayScrubClick: (event: React.MouseEvent<HTMLDivElement>) => void;
}

export function LessonVideoTimeline({
  currentTime,
  selectedLessonDuration,
  progressPercent,
  inVideoQuizPoints,
  isQuizSolved,
  onSeekChange,
  onJumpToQuizPoint,
  onOverlayScrubClick,
}: LessonVideoTimelineProps) {
  const [hoverPreviewTime, setHoverPreviewTime] = useState<number | null>(null);
  const [hoverPreviewPercent, setHoverPreviewPercent] = useState<number>(0);

  return (
    <div
      className="group relative mb-3 flex h-4 w-full cursor-pointer items-center"
      onClick={onOverlayScrubClick}
      onMouseMove={(e) => {
        const target = e.currentTarget as HTMLDivElement;
        const rect = target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const pct = Math.max(0, Math.min(1, x / rect.width));
        setHoverPreviewPercent(pct);
        setHoverPreviewTime(pct * selectedLessonDuration);
      }}
      onMouseLeave={() => setHoverPreviewTime(null)}
    >
      <div className="absolute inset-x-0 h-1.5 overflow-hidden rounded-full bg-white/25">
        <div
          className="h-full bg-primary transition-[width] duration-200 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <input
        type="range"
        min={0}
        max={selectedLessonDuration}
        step={0.01}
        value={Math.min(selectedLessonDuration, Math.max(0, currentTime))}
        onChange={(event) => {
          event.stopPropagation();
          onSeekChange(Number(event.target.value));
        }}
        className="relative z-10 h-4 w-full cursor-pointer appearance-none bg-transparent opacity-0"
      />

      {inVideoQuizPoints.map((point) => {
        const left = `${(point.timestamp / Math.max(1, selectedLessonDuration)) * 100}%`;
        const solved = isQuizSolved(point);

        return (
          <Tooltip key={`overlay-${point.id}`}>
            <TooltipTrigger asChild>
              <button
                type="button"
                className={`absolute top-1/2 z-20 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-black/80 transition-transform hover:scale-150 ${
                  solved ? "bg-success" : "bg-primary"
                }`}
                style={{ left }}
                onClick={(clickEvent) => {
                  clickEvent.stopPropagation();
                  onJumpToQuizPoint(point);
                }}
                aria-label={`Đi tới quiz tại ${formatTime(point.timestamp)}`}
              />
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {solved ? "Đã trả lời" : "Câu hỏi tương tác"}
            </TooltipContent>
          </Tooltip>
        );
      })}

      {hoverPreviewTime !== null ? (
        <div
          className="absolute z-30 -top-7 w-max -translate-x-1/2 rounded-xs bg-black/85 px-2 py-1 text-xs text-white shadow-lg"
          style={{ left: `${hoverPreviewPercent * 100}%` }}
        >
          {formatTime(Math.max(0, Math.min(selectedLessonDuration, hoverPreviewTime)))}
        </div>
      ) : null}
    </div>
  );
}
