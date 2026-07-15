"use client";

import { useState } from "react";
import { useVideoSource } from "./useVideoSource";
import { useVideoPlayback } from "./useVideoPlayback";
import { useVideoEffects } from "./useVideoEffects";
import { useTextOverlays } from "./useTextOverlays";
import { useMascot } from "./useMascot";
import type { VoiceOption } from "@/features/editor/types";

export default function useEditor(initialSrc?: string) {
  // Compose smaller hooks
  const {
    videoSrc,
    setVideoSrc,
    originalVideoFile,
    setOriginalVideoFile,
    loadVideoFile,
  } = useVideoSource(initialSrc);
  const { videoRef, isPlaying, play, pause, toggle } = useVideoPlayback();
  const { effect, setEffect, cssFilter } = useVideoEffects();
  const {
    layers,
    handleAddText,
    handleUpdateText,
    handleReorderText,
    handleRemoveText,
  } = useTextOverlays();
  const {
    mascot,
    setMascot,
    applyMascot,
    startMascotJob,
    isApplyingMascot,
    mascotProgress,
    setMascotProgress,
  } = useMascot();

  // Voice (keeping simple for now)
  const [voice, setVoice] = useState<VoiceOption>({
    type: "none",
    speed: 1,
    volume: 100,
    pitch: 0,
  });

  // Download helper
  const download = async (fileName?: string) => {
    if (!videoSrc) return;

    try {
      const response = await fetch(videoSrc);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = fileName || `video_${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      throw error;
    }
  };

  return {
    // Video
    videoRef,
    videoSrc,
    setVideoSrc,
    originalVideoFile,
    setOriginalVideoFile,
    loadVideoFile,

    // Playback
    isPlaying,
    play,
    pause,
    toggle,

    // Effect
    effect,
    setEffect,
    cssFilter,

    // Text
    layers,
    handleAddText,
    handleUpdateText,
    handleReorderText,
    handleRemoveText,

    // Mascot
    mascot,
    setMascot,
    applyMascot,
    startMascotJob,
    isApplyingMascot,
    mascotProgress,
    setMascotProgress,

    // Voice
    voice,
    setVoice,

    // Download
    download,
  } as const;
}
