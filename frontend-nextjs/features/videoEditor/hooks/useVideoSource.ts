/**
 * Video Source Hook
 * Manages video source URL and original file
 */

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export function useVideoSource(initialSrc?: string) {
  const searchParams = useSearchParams();
  const querySrc = searchParams.get("src");

  const [videoSrc, setVideoSrc] = useState<string>(() => {
    return searchParams.get("src") || initialSrc || "/videos/Download.mp4";
  });

  const [originalVideoFile, setOriginalVideoFile] = useState<File | null>(null);

  useEffect(() => {
    // Keep editor source in sync when query param changes (e.g. selecting/dragging a highlight video).
    if (querySrc && querySrc !== videoSrc) {
      setVideoSrc(querySrc);
      setOriginalVideoFile(null);
    }
  }, [querySrc, videoSrc]);

  // Load original video file when needed (lazy loading)
  const loadVideoFile = async () => {
    if (originalVideoFile) return originalVideoFile;

    try {
      const response = await fetch(videoSrc);
      const blob = await response.blob();
      const file = new File([blob], "video.mp4", { type: "video/mp4" });
      setOriginalVideoFile(file);
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
    setOriginalVideoFile, // Expose setter for VideoUploader
    loadVideoFile,
  } as const;
}
