import { useEffect } from 'react';
import type { TextOption } from '@/features/videoEditor/types';

interface Props {
  videoRef: React.RefObject<HTMLVideoElement>;
  src?: string;
  filter: string;
  textOverlays?: TextOption[];
}

export default function VideoPreview({ videoRef, src, filter, textOverlays = [] }: Props) {
  // Apply filter khi thay đổi
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.style.filter = filter;
    }
  }, [filter, videoRef]);

  return (
    <div className="relative w-full bg-black rounded-md overflow-hidden flex items-center justify-center">
      <video
        ref={videoRef}
        src={src}
        controls
        className="max-h-[60vh] w-auto"
        style={{ filter }}
      >
        Your browser does not support video.
      </video>

      {/* Text Overlays */}
      {textOverlays.map((text) => (
        <div
          key={text.id}
          className="absolute pointer-events-none"
          style={{
            left: `${text.position.x}%`,
            top: `${text.position.y}%`,
            transform: 'translate(-50%, -50%)',
            fontSize: `${text.fontSize}px`,
            color: text.color,
            fontFamily: text.fontFamily,
            fontWeight: text.fontWeight,
            textAlign: text.textAlign,
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
            whiteSpace: 'pre-wrap',
            maxWidth: '80%',
          }}
        >
          {text.text}
        </div>
      ))}
    </div>
  );
}