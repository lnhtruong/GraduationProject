/**
 * Video Playback Hook
 * Manages play/pause/toggle state
 */

import { useRef, useState, useEffect } from "react";

export function useVideoPlayback() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
    };
  }, []);

  const play = () => videoRef.current?.play();
  const pause = () => videoRef.current?.pause();
  const toggle = () => (isPlaying ? pause() : play());

  return {
    videoRef,
    isPlaying,
    play,
    pause,
    toggle,
  } as const;
}
