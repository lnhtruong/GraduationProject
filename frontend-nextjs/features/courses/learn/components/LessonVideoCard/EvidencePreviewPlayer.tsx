import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import Hls from "hls.js";

interface Props {
  videoUrl?: string;
  startSeconds: number;
  onClose: () => void;
}

/**
 * Video preview độc lập để xem lại bằng chứng ngay trong overlay quiz —
 * không dùng chung videoRef/currentTime với video chính, để không phá vỡ
 * business rule "phải hoàn thành quiz theo timeline" (tua video chính sẽ
 * kích hoạt lại guard chặn-nhảy-mốc-quiz).
 */
export function EvidencePreviewPlayer({ videoUrl, startSeconds, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !videoUrl) return;

    const isHls = videoUrl.includes(".m3u8");
    const applyStart = () => {
      videoElement.currentTime = startSeconds;
      videoElement.play().catch(() => undefined);
    };

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({ maxMaxBufferLength: 15, enableWorker: true });
      hlsRef.current = hls;
      hls.loadSource(videoUrl);
      hls.attachMedia(videoElement);
      hls.on(Hls.Events.MANIFEST_PARSED, applyStart);
    } else {
      videoElement.src = videoUrl;
      videoElement.addEventListener("loadedmetadata", applyStart, { once: true });
    }

    return () => {
      videoElement.pause();
      videoElement.removeAttribute("src");
      try {
        videoElement.load();
      } catch {}
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [videoUrl, startSeconds]);

  if (!videoUrl) {
    return null;
  }

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-white/15 bg-black shadow-inner">
      <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-3 py-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-white/70">
          Xem lại bằng chứng
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-white/60 hover:text-white transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <video
        ref={videoRef}
        className="mx-auto block h-auto max-h-[240px] w-full object-contain"
        controls
        playsInline
      />
    </div>
  );
}
