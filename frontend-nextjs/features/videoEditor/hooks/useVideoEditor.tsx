"use client";

import { useRef, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { mascotService } from "@/services/mascotService";
import type {
  MascotOption,
  VoiceOption,
  TextOption,
  EffectOption,
} from "@/features/videoEditor/types";

export default function useVideoEditor(initialSrc?: string) {
  const searchParams = useSearchParams();
  const videoRef = useRef<HTMLVideoElement>(null);

  // ===== Xử lý nguồn video
  const [videoSrc, setVideoSrc] = useState<string>(() => {
    // return searchParams.get('src') || initialSrc || "/videos/sample-video.mp4";
    return searchParams.get("src") || initialSrc || "/videos/Download.mp4";
  });

  // ===== Lưu trữ file video gốc để gọi API xử lý
  const [originalVideoFile, setOriginalVideoFile] = useState<File | null>(null);
  // Tải video gốc khi videoSrc thay đổi
  useEffect(() => {
    const loadVideoFile = async () => {
      try {
        const response = await fetch(videoSrc);
        const blob = await response.blob();
        const file = new File([blob], "video.mp4", { type: "video/mp4" });
        setOriginalVideoFile(file);
      } catch (error) {
        console.error("Failed to load video file:", error);
      }
    };

    loadVideoFile();
  }, []); // Chỉ tải một lần khi component mount

  // ===== Xử lý dừng phát video
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

  // ===== Xử lý hiệu ứng video
  const [effect, setEffect] = useState<EffectOption>({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    hue: 0,
    filter: "none",
  });
  const cssFilter = () => {
    const { brightness, contrast, saturation, hue } = effect;
    return `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) hue-rotate(${hue}deg)`;
  };

  // ===== Quản lý lớp chữ trên video
  const [textOverlays, setTextOverlays] = useState<TextOption[]>([]);
  const addTextOverlay = (text: TextOption) => {
    console.log("Adding text overlay:", text);
    setTextOverlays((prev) => [...prev, text]);
  };
  const updateTextOverlay = (
    id: string,
    updates: Partial<TextOption> | TextOption
  ) => {
    console.log("Updating text overlay:", id, updates);
    setTextOverlays((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };
  const removeTextOverlay = (id: string) => {
    console.log("Removing text overlay:", id);
    setTextOverlays((prev) => prev.filter((t) => t.id !== id));
  };

  // ===== Quản lý mascot
  const [mascot, setMascot] = useState<MascotOption>({
    type: "none",
    position: "bottom-right",
    margin_x: 40,
    margin_y: 40,
    scale: 1,
  });

  // ===== Áp dụng mascot lên video
  const [isApplyingMascot, setIsApplyingMascot] = useState(false);
  const [mascotProgress, setMascotProgress] = useState<string>(""); // Track progress
  const applyMascot = async (
    mascotOption: MascotOption,
    videoFile: File,
    onSuccess: (blobUrl: string) => void
  ) => {
    if (mascotOption.type === "none") {
      console.log("No mascot to apply");
      return;
    }

    // Get mascot file (from custom upload OR preset URL)
    let mascotFile: File;

    if (mascotOption.type === "custom" && mascotOption.customFile) {
      mascotFile = mascotOption.customFile;
    } else if (mascotOption.type === "preset" && mascotOption.presetUrl) {
      try {
        console.log("Fetching preset mascot from:", mascotOption.presetUrl);
        const response = await fetch(mascotOption.presetUrl);
        const blob = await response.blob();
        mascotFile = new File([blob], `${mascotOption.presetId}.jpg`, {
          type: "image/jpg",
        });
        console.log("Preset mascot loaded:", mascotFile);
      } catch (error) {
        console.error("Failed to load preset mascot:", error);
        alert("Không thể tải mascot có sẵn. Vui lòng thử lại.");
        return;
      }
    } else {
      alert("Vui lòng chọn file mascot");
      return;
    }

    // Validate params
    const validation = mascotService.validateMascotParams(
      mascotOption.position,
      mascotOption.margin_x,
      mascotOption.margin_y,
      mascotOption.scale
    );

    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setIsApplyingMascot(true);
    setMascotProgress("Đang tải lên...");

    try {
      console.log("Applying mascot with params:", {
        position: mascotOption.position,
        margin_x: mascotOption.margin_x,
        margin_y: mascotOption.margin_y,
        scale: mascotOption.scale,
        type: mascotOption.type,
        audio: mascotOption.audioFile?.name,
      });

      // Call API
      const blobUrl = await mascotService.addMascotAndDownload(
        videoFile,
        mascotFile,
        mascotOption.position,
        mascotOption.margin_x,
        mascotOption.margin_y,
        mascotOption.scale,
        mascotOption.audioFile,
        (stage) => {
          setMascotProgress(stage);
        }
      );

      console.log("Mascot applied successfully. New video URL:", blobUrl);

      // Update mascot state
      setMascot(mascotOption);

      // Callback to update video source
      onSuccess(blobUrl);

      alert("Mascot đã được áp dụng thành công!");
    } catch (error) {
      console.error("Failed to apply mascot:", error);
      alert("Không thể áp dụng mascot. Vui lòng thử lại.");
    } finally {
      setIsApplyingMascot(false);
    }
  };

  // ===== Quản lý voice
  const [voice, setVoice] = useState<VoiceOption>({
    type: "none",
    speed: 1,
    volume: 100,
    pitch: 0,
  });

  // ===== Tải video đã chỉnh sửa
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
    textOverlays,
    addTextOverlay,
    updateTextOverlay,
    removeTextOverlay,

    // Mascot
    mascot,
    setMascot,
    applyMascot,
    isApplyingMascot,
    mascotProgress,

    // Voice
    voice,
    setVoice,

    // Download
    download,
  } as const;
}
