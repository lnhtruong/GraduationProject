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
    <div className="overflow-hidden rounded-lg border border-border bg-zinc-950 shadow-sm">
      <video
        ref={videoRef}
        className="mx-auto block aspect-video max-h-[180px] w-full cursor-pointer select-none object-contain"
        preload="metadata"
        playsInline
        onClick={togglePlay}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
      />

      <div className="border-t border-white/10 bg-zinc-950 px-3 py-2.5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={togglePlay}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-zinc-950 shadow-sm transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            {isPlaying ? (
              <Pause className="h-3.5 w-3.5 fill-current" />
            ) : (
              <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />
            )}
          </button>
          <span className="shrink-0 rounded-full bg-white/10 px-2.5 py-1 font-mono text-[11px] text-zinc-100">
            {formatClockNormal(currentTime)} / {formatClockNormal(safeDuration)}
          </span>
        </div>
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
        />
      </div>
    </div>
  );
}
