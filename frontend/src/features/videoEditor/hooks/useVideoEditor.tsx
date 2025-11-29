import { useRef, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { MascotOption, VoiceOption, TextOption, EffectOption } from '@/features/videoEditor/types';

export default function useVideoEditor(initialSrc?: string) {
  const [searchParams] = useSearchParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // ===== Xử lý nguồn video
  const [videoSrc, setVideoSrc] = useState<string>(() => {
    return searchParams.get('src') || initialSrc || "/videos/sample-video.mp4";
  });
  
  // ===== Xử lý dừng phát video
  const [isPlaying, setIsPlaying] = useState(false);
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
  
  // ===== Xử lý hiệu ứng video
  const [effect, setEffect] = useState<EffectOption>({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    hue: 0,
  });
  const cssFilter = () => {
    const { brightness, contrast, saturation, hue } = effect;
    return `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) hue-rotate(${hue}deg)`;
  };

  // ===== Quản lý lớp chữ trên video
  const [textOverlays, setTextOverlays] = useState<TextOption[]>([]);
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

  // ===== Quản lý mascot
  const [mascot, setMascot] = useState<MascotOption>({ type: 'none' });
  const updateMascot = (updates: Partial<MascotOption>) => {
    setMascot(prev => ({ ...prev, ...updates }));
  };

  // ===== Quản lý voice
  const [voice, setVoice] = useState<VoiceOption>({
    type: 'none',
    speed: 1,
    volume: 100,
    pitch: 0,
  });
  const updateVoice = (updates: Partial<VoiceOption>) => {
    setVoice(prev => ({ ...prev, ...updates }));
  };

  // ===== Tải video đã chỉnh sửa
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

  return {
    videoRef,
    videoSrc,
    setVideoSrc,
    isPlaying,
    play,
    pause,
    toggle,
    effect,
    setEffect,
    cssFilter,
    textOverlays,
    addTextOverlay,
    updateTextOverlay,
    removeTextOverlay,
    mascot,
    updateMascot,
    voice,
    updateVoice,
    download,
  } as const;
}