// import { useEffect } from 'react';
import type { TextOption } from '@/features/videoEditor/types';

interface Props {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  src?: string;
  filter: string;
  textOverlays?: TextOption[];
  selectedTextId?: string | null;
  onTextSelect?: (id: string) => void;
}

export default function VideoPreview({ 
  videoRef, 
  src, 
  filter, 
  textOverlays = [],
  selectedTextId,
  onTextSelect,
}: Props) {
  // // Apply filter khi thay đổi
  // useEffect(() => {
  //   if (videoRef.current) {
  //     videoRef.current.style.filter = filter;
  //   }
  // }, [filter, videoRef]);

  return (
    <div className="relative w-full bg-black rounded-md overflow-hidden flex items-center justify-center">
      <video
        ref={videoRef}
        src={src}
        controls
        className="max-w-full max-h-full"
        style={{ filter }}
      >
        Your browser does not support video.
      </video>

      {/* Text Overlays */}
      {textOverlays.map((text) => {
        const isSelected = selectedTextId === text.id;
        
        return (
          <div
            key={text.id}
            onClick={(e) => {
              e.stopPropagation();
              onTextSelect?.(text.id);
            }}
            className={`
              absolute transition-all duration-200
              ${onTextSelect ? 'cursor-pointer hover:scale-105' : 'pointer-events-none'}
              ${isSelected ? 'z-20' : 'z-10'}
            `}
            style={{
              left: `${text.position.x}%`,
              top: `${text.position.y}%`,
              transform: isSelected 
                ? 'translate(-50%, -50%) scale(1.05)' 
                : 'translate(-50%, -50%)',
              fontSize: `${text.fontSize}px`,
              color: text.color,
              fontFamily: text.fontFamily,
              fontWeight: text.fontWeight,
              fontStyle: text.fontStyle,
              textDecoration: text.textDecoration,
              textAlign: text.textAlign,
              textShadow: isSelected
                ? '0 0 10px rgba(59, 130, 246, 0.8), 2px 2px 4px rgba(0,0,0,0.8)'
                : '2px 2px 4px rgba(0,0,0,0.8)',
              whiteSpace: 'pre-wrap',
              maxWidth: '80%',
              userSelect: 'none',
              padding: isSelected ? '4px 8px' : '0',
              borderRadius: '4px',
              backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              outline: isSelected ? '2px solid rgb(59, 130, 246)' : 'none',
              outlineOffset: '4px',
            }}
          >
            {text.text}
          </div>
        );
      })}
    </div>
  );
}