import { useRef, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { VideoStyle, TextOption } from '@/features/videoEditor/types';

export default function useVideoEditor(initialSrc?: string) {
  const [searchParams] = useSearchParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [videoSrc, setVideoSrc] = useState<string>(() => {
    return searchParams.get('src') || initialSrc || "/sample-video.mp4";
  });
  
  const [isPlaying, setIsPlaying] = useState(false);
  
  const [style, setStyle] = useState<VideoStyle>({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    hue: 0,
  });

  const [textOverlays, setTextOverlays] = useState<TextOption[]>([]);

  useEffect(() => {
    const src = searchParams.get('src');
    if (src) setVideoSrc(src);
  }, [searchParams]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, []);

  const play = () => videoRef.current?.play();
  const pause = () => videoRef.current?.pause();
  const toggle = () => (isPlaying ? pause() : play());

  const download = async (fileName?: string) => {
    if (!videoSrc) return;
    
    try {
      const response = await fetch(videoSrc);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || `video_${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  };

  const cssFilter = () => {
    const { brightness, contrast, saturation, hue } = style;
    return `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) hue-rotate(${hue}deg)`;
  };

  const addTextOverlay = (text: TextOption) => {
    setTextOverlays(prev => [...prev, text]);
  };

  const updateTextOverlay = (id: string, updates: Partial<TextOption>) => {
    setTextOverlays(prev => 
      prev.map(t => t.id === id ? { ...t, ...updates } : t)
    );
  };

  const removeTextOverlay = (id: string) => {
    setTextOverlays(prev => prev.filter(t => t.id !== id));
  };

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
    textOverlays,
    addTextOverlay,
    updateTextOverlay,
    removeTextOverlay,
  } as const;
}

// import { useEffect, useRef, useState } from "react";
// import { useSearchParams } from "react-router-dom";
// import type { MascotOption, VoiceOption, TextOption } from '@/features/videoEditor/types';

// export type VideoStyle = {
//   brightness: number; // percent, 100 default
//   contrast: number;
//   saturation: number;
//   hue: number;
// };

// export default function useVideoEditor(initialSrc?: string) {
//   const [searchParams] = useSearchParams();
//   const srcParam = searchParams.get("src") ?? initialSrc ?? "/sample-video.mp4";

//   const [videoSrc, setVideoSrc] = useState<string>(srcParam);
//   const videoRef = useRef<HTMLVideoElement | null>(null);
//   const [isPlaying, setIsPlaying] = useState(false);

//   const [style, setStyle] = useState<VideoStyle>({
//     brightness: 100,
//     contrast: 100,
//     saturation: 100,
//     hue: 0,
//   });

//   const [mascot, setMascot] = useState<MascotOption>({ type: 'none' });
//   const [voice, setVoice] = useState<VoiceOption>({
//     type: 'none',
//     speed: 1,
//     volume: 100,
//     pitch: 0,
//   });
//   const [text, setText] = useState<TextOption>({
//     text: '',
//     position: { x: 50, y: 50 },
//     fontSize: 24,
//     color: '#FFFFFF',
//     fontFamily: 'arial',
//   });

//   useEffect(() => {
//     // update when query param changes
//     setVideoSrc(srcParam);
//   }, [srcParam]);

//   const play = async () => {
//     try {
//       await videoRef.current?.play();
//       setIsPlaying(true);
//     } catch (e) {
//       // ignore play failures
//       console.warn("play failed", e);
//     }
//   };

//   const pause = () => {
//     videoRef.current?.pause();
//     setIsPlaying(false);
//   };

//   const toggle = () => {
//     if (isPlaying) pause();
//     else play();
//   };

//   const download = async (fileName?: string) => {
//     // Download current videoSrc by fetching and creating a blob link
//     try {
//       const resp = await fetch(videoSrc);
//       if (!resp.ok) throw new Error("Download failed");
//       const blob = await resp.blob();
//       const url = URL.createObjectURL(blob);
//       const a = document.createElement("a");
//       a.href = url;
//       a.download = fileName ?? (videoSrc.split("/").pop() || "clip.mp4");
//       document.body.appendChild(a);
//       a.click();
//       a.remove();
//       URL.revokeObjectURL(url);
//     } catch (err) {
//       console.error("Download error", err);
//       throw err;
//     }
//   };

//   const cssFilter = () =>
//     `brightness(${style.brightness}%) contrast(${style.contrast}%) saturate(${style.saturation}%) hue-rotate(${style.hue}deg)`; // ← Thêm hue-rotate

//   return {
//     videoRef,
//     videoSrc,
//     setVideoSrc,
//     isPlaying,
//     play,
//     pause,
//     toggle,
//     download,
//     style,
//     setStyle,
//     cssFilter,
//     mascot,
//     setMascot,
//     voice,
//     setVoice,
//     text,
//     setText,
//   } as const;
// }
