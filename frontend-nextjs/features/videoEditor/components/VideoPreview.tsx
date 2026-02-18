import type { TextOption } from "@/features/videoEditor/types";

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

      {/* Text overlays */}
      {textOverlays.map((text) => (
        <div
          key={text.id}
          className="absolute cursor-pointer"
          style={{
            left: `${text.position.x}%`,
            top: `${text.position.y}%`,
            transform: "translate(-50%, -50%)",
            zIndex: selectedTextId === text.id ? 50 : 10,
            border:
              selectedTextId === text.id
                ? "2px solid #3b82f6"
                : "2px solid transparent",
          }}
          onClick={() => onTextSelect?.(text.id)}
        >
          <p
            style={{
              fontSize: `${text.fontSize}px`,
              color: text.color,
              fontWeight: text.fontWeight,
              padding: "4px 8px",
              borderRadius: "4px",
              userSelect: "none",
              whiteSpace: "nowrap",
            }}
          >
            {text.text}
          </p>
        </div>
      ))}
    </div>
  );
}
