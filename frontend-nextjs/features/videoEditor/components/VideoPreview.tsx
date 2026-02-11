import type { TextOption } from "@/features/videoEditor/types";
import type {LayerItem} from "@/features/videoEditor/types";

interface Props {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  src?: string;
  filter: string;
  layers?: LayerItem[];
  selectedTextId?: string | null;
  onTextSelect?: (id: string) => void;
}


export default function VideoPreview({
  videoRef,
  src,
  filter,
  layers = [],
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
        {layers?.map((layer, index) => {
            if (layer.type !== "text") return null;

            const text = layer.data;

            return (
                <div
                    key={layer.id}
                    className="absolute cursor-pointer"
                    style={{
                        left: `${text.position.x}%`,
                        top: `${text.position.y}%`,
                        transform: "translate(-50%, -50%)",
                        zIndex: layers.length- index + 1,
                        border:
                            selectedTextId === layer.id
                                ? "2px solid #3b82f6"
                                : "2px solid transparent",
                    }}
                    onClick={() => onTextSelect?.(layer.id)}
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
            );
        })}
    </div>
  );
}
