/**
 * Video Source Hook
 * Manages video source URL and original file
 */

import { useCallback, useState } from "react";

const DEFAULT_VIDEO_SRC = "/videos/Download.mp4";

export function useVideoSource(initialSrc?: string) {
  const [sourceState, setSourceState] = useState(() => ({
    src: initialSrc || DEFAULT_VIDEO_SRC,
    initialSrcKey: initialSrc || null,
  }));
  const [fileState, setFileState] = useState<{
    file: File | null;
    sourceKey: string | null;
  }>({
    file: null,
    sourceKey: initialSrc || null,
  });

  const hasNewInitialSrc =
    Boolean(initialSrc) && initialSrc !== sourceState.initialSrcKey;
  const videoSrc = hasNewInitialSrc
    ? (initialSrc as string)
    : sourceState.src;
  const activeSourceKey = hasNewInitialSrc
    ? (initialSrc as string)
    : sourceState.initialSrcKey;
  const originalVideoFile =
    fileState.sourceKey === activeSourceKey ? fileState.file : null;

  const setVideoSrc = useCallback(
    (src: string) => {
      setSourceState({
        src,
        initialSrcKey: initialSrc || null,
      });
    },
    [initialSrc],
  );

  const setOriginalVideoFile = useCallback(
    (file: File | null) => {
      setFileState({
        file,
        sourceKey: activeSourceKey,
      });
    },
    [activeSourceKey],
  );

  // Load original video file when needed (lazy loading)
  const loadVideoFile = async () => {
    if (originalVideoFile) return originalVideoFile;

    try {
      const response = await fetch(videoSrc);
      const blob = await response.blob();
      const file = new File([blob], "video.mp4", { type: "video/mp4" });
      setFileState({
        file,
        sourceKey: activeSourceKey,
      });
      return file;
    } catch (error) {
      console.error("Failed to load video file:", error);
      throw error;
    }
  };

  return {
    videoSrc,
    setVideoSrc,
    originalVideoFile,
    setOriginalVideoFile,
    loadVideoFile,
  } as const;
}
