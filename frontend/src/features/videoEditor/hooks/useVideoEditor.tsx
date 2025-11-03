import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

export type VideoStyle = {
  brightness: number; // percent, 100 default
  contrast: number;
  saturation: number;
};

export default function useVideoEditor(initialSrc?: string) {
  const [searchParams] = useSearchParams();
  const srcParam = searchParams.get("src") ?? initialSrc ?? "/sample-video.mp4";

  const [videoSrc, setVideoSrc] = useState<string>(srcParam);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const [style, setStyle] = useState<VideoStyle>({
    brightness: 100,
    contrast: 100,
    saturation: 100,
  });

  useEffect(() => {
    // update when query param changes
    setVideoSrc(srcParam);
  }, [srcParam]);

  const play = async () => {
    try {
      await videoRef.current?.play();
      setIsPlaying(true);
    } catch (e) {
      // ignore play failures
      console.warn("play failed", e);
    }
  };

  const pause = () => {
    videoRef.current?.pause();
    setIsPlaying(false);
  };

  const toggle = () => {
    if (isPlaying) pause();
    else play();
  };

  const download = async (fileName?: string) => {
    // Download current videoSrc by fetching and creating a blob link
    try {
      const resp = await fetch(videoSrc);
      if (!resp.ok) throw new Error("Download failed");
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName ?? (videoSrc.split("/").pop() || "clip.mp4");
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error", err);
      throw err;
    }
  };

  const cssFilter = () =>
    `brightness(${style.brightness}%) contrast(${style.contrast}%) saturate(${style.saturation}%)`;

  return {
    videoRef,
    videoSrc,
    setVideoSrc,
    isPlaying,
    play,
    pause,
    toggle,
    download,
    style,
    setStyle,
    cssFilter,
  } as const;
}
