import React, { forwardRef, useEffect, useRef } from "react";
import { PlayCircle, Pause, Play } from "lucide-react";
import { InVideoQuizPoint } from "../../utils";
import Hls from "hls.js";

interface LessonVideoPlayerProps {
  selectedLessonVideoUrl?: string;
  activeQuizPoint: InVideoQuizPoint | null;
  isPlaying: boolean;
  playerBlocked: boolean;
  currentLessonDurationLabel: string;
  currentQualityLevel: number;
  onQualityLevelsLoaded: (levels: { id: number; name: string }[]) => void;
  onTogglePlayback: () => void;
  onVideoKeyDown: (event: React.KeyboardEvent<HTMLVideoElement>) => void;
  onTimeUpdate: (event: React.SyntheticEvent<HTMLVideoElement>) => void;
  onVideoEnded: () => void;
  onVideoPause: (event: React.SyntheticEvent<HTMLVideoElement>) => void;
  onVideoMetadataLoaded: (duration: number, aspectRatio?: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setCurrentTime: (time: number) => void;
  setLastVideoTime: (time: number) => void;
  setIsFullscreen?: (isFullscreen: boolean) => void;
}

export const LessonVideoPlayer = forwardRef<HTMLVideoElement, LessonVideoPlayerProps>(
  (
    {
      selectedLessonVideoUrl,
      activeQuizPoint,
      isPlaying,
      playerBlocked,
      currentLessonDurationLabel,
      currentQualityLevel,
      onQualityLevelsLoaded,
      onTogglePlayback,
      onVideoKeyDown,
      onTimeUpdate,
      onVideoEnded,
      onVideoPause,
      onVideoMetadataLoaded,
      setIsPlaying,
      setCurrentTime,
      setLastVideoTime,
      setIsFullscreen,
    },
    ref
  ) => {
    const hlsRef = useRef<Hls | null>(null);

    useEffect(() => {
      if (hlsRef.current) {
        hlsRef.current.currentLevel = currentQualityLevel;
      }
    }, [currentQualityLevel]);

    useEffect(() => {
      let videoElement: HTMLVideoElement | null = null;
      if (ref) {
        if (typeof ref === "function") {
          // Hỗ trợ callback ref
        } else if ("current" in ref) {
          videoElement = ref.current;
        }
      }

      if (!videoElement) return;

      if (!selectedLessonVideoUrl) {
        videoElement.src = "";
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }
        return;
      }

      const isHls = selectedLessonVideoUrl.includes(".m3u8");

      // Reset HLS instance cũ nếu có
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      const handleWebKitBegin = () => {
        setIsFullscreen?.(true);
      };
      const handleWebKitEnd = () => {
        setIsFullscreen?.(false);
      };

      videoElement.addEventListener("webkitbeginfullscreen", handleWebKitBegin);
      videoElement.addEventListener("webkitendfullscreen", handleWebKitEnd);

      if (isHls) {
        if (Hls.isSupported()) {
          const hls = new Hls({
            maxMaxBufferLength: 15,
            enableWorker: true,
            lowLatencyMode: true,
          });
          hlsRef.current = hls;
          hls.loadSource(selectedLessonVideoUrl);
          hls.attachMedia(videoElement);

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            const levels = hls.levels.map((level, idx) => ({
              id: idx,
              name: level.height ? `${level.height}p` : `Chất lượng ${idx + 1}`,
            }));
            const allLevels = [{ id: -1, name: "Tự động" }, ...levels];
            onQualityLevelsLoaded(allLevels);
          });

          hls.on(Hls.Events.ERROR, (event, data) => {
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  console.warn("[HLS.js] Lỗi mạng, đang thử load lại...", data);
                  hls.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  console.warn("[HLS.js] Lỗi giải mã media, đang thử khôi phục...", data);
                  hls.recoverMediaError();
                  break;
                default:
                  console.error("[HLS.js] Lỗi nghiêm trọng, hủy trình phát:", data);
                  hls.destroy();
                  hlsRef.current = null;
                  break;
              }
            }
          });
        } else if (videoElement.canPlayType("application/vnd.apple.mpegurl")) {
          // Support native HLS (như Safari trên macOS/iOS)
          videoElement.src = selectedLessonVideoUrl;
          // Safari không có manifest parse qua hls.js nên ta không thể lấy danh sách levels dễ dàng từ hls.js.
          // Nhưng trình phát Safari có UI chọn native hoặc ta có thể map các mức cơ bản nếu cần.
        } else {
          console.error("Trình duyệt không hỗ trợ MSE phát HLS");
        }
      } else {
        // Hỗ trợ video MP4 thông thường
        videoElement.src = selectedLessonVideoUrl;
      }

      return () => {
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }
        if (videoElement) {
          videoElement.removeEventListener("webkitbeginfullscreen", handleWebKitBegin);
          videoElement.removeEventListener("webkitendfullscreen", handleWebKitEnd);
        }
      };
    }, [selectedLessonVideoUrl, ref, onQualityLevelsLoaded, setIsFullscreen]);

    return (
      <>
        {selectedLessonVideoUrl ? (
          <video
            ref={ref}
            className={`h-full w-full cursor-pointer object-contain transition duration-300 ${
              activeQuizPoint ? "blur-[1.5px] brightness-75" : ""
            }`}
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
            onPause={(event) => {
              setIsPlaying(false);
              onVideoPause(event);
            }}
            onTimeUpdate={onTimeUpdate}
            onEnded={onVideoEnded}
            onResize={(event) => {
              const video = event.currentTarget;
              if (video.videoWidth > 0 && video.videoHeight > 0) {
                const aspect = video.videoWidth / video.videoHeight;
                onVideoMetadataLoaded(video.duration, aspect);
              }
            }}
            onLoadedMetadata={(event) => {
              const aspect = event.currentTarget.videoWidth / event.currentTarget.videoHeight;
              onVideoMetadataLoaded(event.currentTarget.duration, aspect);
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

        {!playerBlocked ? (
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
