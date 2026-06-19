import React, { forwardRef } from "react";
import { PlayCircle, Pause, Play } from "lucide-react";
import { InVideoQuizPoint } from "../../utils";

interface LessonVideoPlayerProps {
  selectedLessonVideoUrl?: string;
  activeQuizPoint: InVideoQuizPoint | null;
  isPlaying: boolean;
  playerBlocked: boolean;
  currentLessonDurationLabel: string;
  onTogglePlayback: () => void;
  onVideoKeyDown: (event: React.KeyboardEvent<HTMLVideoElement>) => void;
  onTimeUpdate: (event: React.SyntheticEvent<HTMLVideoElement>) => void;
  onVideoEnded: () => void;
  onVideoMetadataLoaded: (duration: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setCurrentTime: (time: number) => void;
  setLastVideoTime: (time: number) => void;
}

export const LessonVideoPlayer = forwardRef<HTMLVideoElement, LessonVideoPlayerProps>(
  (
    {
      selectedLessonVideoUrl,
      activeQuizPoint,
      isPlaying,
      playerBlocked,
      currentLessonDurationLabel,
      onTogglePlayback,
      onVideoKeyDown,
      onTimeUpdate,
      onVideoEnded,
      onVideoMetadataLoaded,
      setIsPlaying,
      setCurrentTime,
      setLastVideoTime,
    },
    ref
  ) => {
    return (
      <>
        {selectedLessonVideoUrl ? (
          <video
            ref={ref}
            className={`h-full w-full cursor-pointer object-contain transition duration-300 ${
              activeQuizPoint ? "blur-[1.5px] brightness-75" : ""
            }`}
            src={selectedLessonVideoUrl}
            playsInline
            preload="metadata"
            onClick={onTogglePlayback}
            tabIndex={0}
            onKeyDown={onVideoKeyDown}
            onPlay={(event) => {
              if (activeQuizPoint) {
                event.currentTarget.pause();
                return;
              }
              setIsPlaying(true);
            }}
            onPause={() => setIsPlaying(false)}
            onTimeUpdate={onTimeUpdate}
            onEnded={onVideoEnded}
            onLoadedMetadata={(event) => {
              onVideoMetadataLoaded(event.currentTarget.duration);
              setCurrentTime(event.currentTarget.currentTime);
              setLastVideoTime(event.currentTarget.currentTime);
            }}
          >
            Your browser does not support the video tag.
          </video>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_65%)] text-center text-white">
            <div className="mb-3 rounded-full border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
              <PlayCircle className="h-12 w-12 text-white" />
            </div>
            <p className="text-base font-medium">Bài học chưa có video gắn kèm</p>
            <p className="mt-1 text-xs text-white/80">
              Thời lượng bài: {currentLessonDurationLabel}
            </p>
          </div>
        )}

        {selectedLessonVideoUrl && !playerBlocked ? (
          <button
            type="button"
            onClick={onTogglePlayback}
            className={`absolute inset-0 z-15 flex items-center justify-center transition-opacity duration-300 ${
              isPlaying ? "opacity-0" : "opacity-100"
            }`}
            aria-label={isPlaying ? "Tạm dừng video" : "Phát video"}
          >
            <span className="flex h-20 w-20 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-md transition-transform hover:scale-105">
              {isPlaying ? (
                <Pause className="h-9 w-9" />
              ) : (
                <Play className="ml-1 h-9 w-9" />
              )}
            </span>
          </button>
        ) : null}
      </>
    );
  }
);

LessonVideoPlayer.displayName = "LessonVideoPlayer";
