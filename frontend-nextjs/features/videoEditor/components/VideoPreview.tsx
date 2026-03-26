import type { TextLayer, TextOption } from "@/features/videoEditor/types";
import type { LayerItem } from "@/features/videoEditor/types";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

// Component hiển thị text layer trên video preview,
// xử lý drag bằng dnd-kit và áp dụng style theo trạng thái dragging / selected
function DraggableTextLayer({
  layer,
  index,
  total,
  selectedTextId,
  onTextSelect,
}: {
  layer: TextLayer;
  index: number;
  total: number;
  selectedTextId?: string | null;
  onTextSelect?: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `${layer.id}`,
      data: {
        source: "preview",
        layerId: layer.id,
      },
    });

  const style = {
    left: `${layer.data.position.x}%`,
    top: `${layer.data.position.y}%`,
    transform: isDragging
      ? `${CSS.Translate.toString(transform)} translate(-50%, -50%)`
      : "translate(-50%, -50%)",
    zIndex: total - index + 1,
    opacity: isDragging ? 0.5 : 1,
    position: "absolute" as const,
    cursor: "grab",
    border:
      selectedTextId === layer.id
        ? "2px solid #3b82f6"
        : "2px solid transparent",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onTextSelect?.(layer.id)}
    >
      <p
        style={{
          fontSize: `${layer.data.fontSize}px`,
          color: layer.data.color,
          fontWeight: layer.data.fontWeight,
          padding: "4px 8px",
          borderRadius: "4px",
          userSelect: "none",
          whiteSpace: "nowrap",
        }}
      >
        {layer.data.text}
      </p>
    </div>
  );
}

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
    <div className="relative mx-auto w-full max-w-7xl aspect-video max-h-[62vh] bg-black rounded-md overflow-hidden flex items-center justify-center">
      <video
        ref={videoRef}
        src={src}
        controls
        className="h-full w-full object-contain"
        style={{ filter }}
      >
        Your browser does not support video.
      </video>

      {/* Text overlays */}
      {layers?.map((layer, index) => {
        if (layer.type !== "text") return null;
        //TODO: bổ sung thêm cho trường hợp không phải là text (vd: mascot)
        return (
          <DraggableTextLayer
            key={layer.id}
            layer={layer}
            index={index}
            total={layers.length}
            selectedTextId={selectedTextId}
            onTextSelect={onTextSelect}
          />
        );
      })}
    </div>
  );
}
