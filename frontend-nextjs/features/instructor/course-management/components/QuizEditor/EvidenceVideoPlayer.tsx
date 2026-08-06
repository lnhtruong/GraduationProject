"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import Hls from "hls.js";
import { Slider } from "@/components/ui/slider";

interface Props {
  videoUrl?: string | null;
  videoDurationSeconds?: number;
  seekToSeconds?: number | null;
  onVideoRefChange: (element: HTMLVideoElement | null) => void;
}

function formatClockNormal(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Video player độc lập dùng để lấy currentTime cho evidenceTimestamp trong
 * dialog "Chỉnh quiz trong video" — tách khỏi video timeline chính bên ngoài
 * dialog để nút "lấy thời điểm hiện tại" không đọc nhầm currentTime của video
 * đang phát ở màn hình lesson.
 */
export function EvidenceVideoPlayer({
  videoUrl,
  videoDurationSeconds,
  seekToSeconds,
  onVideoRefChange,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const onVideoRefChangeRef = useRef(onVideoRefChange);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const safeDuration = Math.max(0, Number(videoDurationSeconds ?? 0));

  useEffect(() => {
    onVideoRefChangeRef.current = onVideoRefChange;
  }, [onVideoRefChange]);

  useEffect(() => {
    const videoElement = videoRef.current;
    onVideoRefChangeRef.current(videoElement);
    if (!videoElement) return;

    if (!videoUrl) {
      videoElement.removeAttribute("src");
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
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
    }

    return () => {
      if (videoElement) {
        videoElement.pause();
        videoElement.removeAttribute("src");
        try {
          videoElement.load();
        } catch {}
      }
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [videoUrl]);

  useEffect(() => {
    return () => onVideoRefChangeRef.current(null);
  }, []);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || seekToSeconds == null) return;

    const applySeek = () => {
      videoElement.currentTime = seekToSeconds;
      setCurrentTime(seekToSeconds);
    };

    if (videoElement.readyState >= HTMLMediaElement.HAVE_METADATA) {
      applySeek();
    } else {
      videoElement.addEventListener("loadedmetadata", applySeek, { once: true });
      return () => videoElement.removeEventListener("loadedmetadata", applySeek);
    }
  }, [seekToSeconds]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => undefined);
    }
  };

  if (!videoUrl) {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-black shadow-sm">
      <video
        ref={videoRef}
        className="mx-auto block h-auto max-h-[220px] w-full object-contain cursor-pointer select-none"
        preload="metadata"
        playsInline
        onClick={togglePlay}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
      />

      <div className="absolute inset-x-2 bottom-2 flex items-center gap-2 rounded-lg border border-white/10 bg-black/75 px-2.5 py-2 backdrop-blur-md">
        <button
          type="button"
          onClick={togglePlay}
          className="shrink-0 text-white hover:text-primary transition-colors"
        >
          {isPlaying ? (
            <Pause className="h-4 w-4 fill-white text-white" />
          ) : (
            <Play className="h-4 w-4 fill-white text-white" />
          )}
        </button>
        <Slider
          value={[Math.min(currentTime, safeDuration || 0)]}
          min={0}
          max={safeDuration || 0}
          step={0.1}
          onValueChange={([value]) => {
            if (!videoRef.current) return;
            videoRef.current.currentTime = value;
            setCurrentTime(value);
          }}
          className="flex-1"
        />
        <span className="shrink-0 font-mono text-[11px] text-zinc-200">
          {formatClockNormal(currentTime)} / {formatClockNormal(safeDuration)}
        </span>
      </div>
    </div>
  );
}
