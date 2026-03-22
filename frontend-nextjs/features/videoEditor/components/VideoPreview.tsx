import { useEffect, useMemo, useState } from "react";
import type { LayerItem, MascotOption, TextLayer } from "@/features/videoEditor/types";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

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
                source: "preview-text",
                layerId: layer.id,
            },
        });

    const style = {
        left: `${layer.data.position.x}%`,
        top: `${layer.data.position.y}%`,
        transform: isDragging
            ? `${CSS.Translate.toString(transform)} translate(-50%, -50%)`
            : "translate(-50%, -50%)",
        zIndex: total - index + 2,
        opacity: isDragging ? 0.5 : 1,
        position: "absolute" as const,
        cursor: "grab",
        border:
            selectedTextId === layer.id
                ? "2px solid hsl(var(--primary))"
                : "2px solid transparent",
    };


    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            onClick={() => onTextSelect?.(layer.id)}
            className="rounded-sm"
        >
            <p
                style={{
                    fontSize: `${layer.data.fontSize}px`,
                    color: layer.data.color,
                    fontWeight: layer.data.fontWeight,
                    fontStyle: layer.data.fontStyle,
                    textDecoration: layer.data.textDecoration,
                    textAlign: layer.data.textAlign,
                    padding: "4px 8px",
                    borderRadius: "4px",
                    userSelect: "none",
                    whiteSpace: "nowrap",
                    textShadow: "0 1px 2px rgba(0,0,0,.45)",
                }}
            >
                {layer.data.text}
            </p>
        </div>
    );
}

function DraggableMascotLayer({
    mascot,
    src,
}: {
    mascot: MascotOption;
    src: string;
}) {
    const placement = mascot.uiPlacement;
    const { attributes, listeners, setNodeRef, transform, isDragging } =
        useDraggable({
            id: "mascot-instance",
            data: {
                source: "preview-mascot",
            },
        });

    const scaleHandle = useDraggable({
        id: "mascot-scale-handle",
        data: {
            source: "preview-mascot",
            action: "scale",
        },
    });

    if (!placement) return null;

    const style = {
        left: `${placement.xPercent}%`,
        top: `${placement.yPercent}%`,
        width: `${placement.widthPercent}%`,
        transform: isDragging
            ? `${CSS.Translate.toString(transform)} translate(-50%, -50%)`
            : "translate(-50%, -50%)",
        opacity: isDragging ? 0.65 : 0.95,
        position: "absolute" as const,
        zIndex: 30,
    };

    return (
        <div ref={setNodeRef} style={style} className="group">
            <img
                src={src}
                alt="Mascot"
                className="w-full h-auto object-contain pointer-events-none rounded-sm border border-primary/40 shadow-md"
            />
            <div
                {...listeners}
                {...attributes}
                className="absolute inset-0 cursor-grab active:cursor-grabbing"
            />
            <button
                type="button"
                ref={scaleHandle.setNodeRef}
                {...scaleHandle.listeners}
                {...scaleHandle.attributes}
                className="absolute -right-2 -bottom-2 h-6 w-6 rounded-full bg-primary text-primary-foreground shadow-sm cursor-nwse-resize flex items-center justify-center"
            >
                <GripVertical className="h-3.5 w-3.5 rotate-45" />
            </button>
        </div>
    );
}

interface Props {
  videoRef: React.RefObject<HTMLVideoElement | null>;
    containerRef: React.RefObject<HTMLDivElement | null>;
  src?: string;
  filter: string;
  layers?: LayerItem[];
    mascot: MascotOption;
  selectedTextId?: string | null;
  onTextSelect?: (id: string) => void;
}



export default function VideoPreview({
  videoRef,
    containerRef,
  src,
  filter,
  layers = [],
    mascot,
  selectedTextId,
  onTextSelect,
}: Props) {
    const { setNodeRef, isOver } = useDroppable({
        id: "video-canvas",
    });

    const [customMascotSrc, setCustomMascotSrc] = useState<string | null>(null);

    useEffect(() => {
        if (!mascot.customFile || mascot.type !== "custom") {
            setCustomMascotSrc(null);
            return;
        }

        const objectUrl = URL.createObjectURL(mascot.customFile);
        setCustomMascotSrc(objectUrl);

        return () => {
            URL.revokeObjectURL(objectUrl);
        };
    }, [mascot.customFile, mascot.type]);

    const mascotSrc = useMemo(() => {
        if (mascot.type === "preset") {
            return mascot.presetUrl;
        }
        if (mascot.type === "custom") {
            return customMascotSrc;
        }
        return null;
    }, [customMascotSrc, mascot.presetUrl, mascot.type]);

  return (
        <div
            ref={(node) => {
                setNodeRef(node);
                containerRef.current = node;
            }}
            className={`relative w-full h-full bg-black rounded-xl overflow-hidden flex items-center justify-center border ${
                isOver ? "border-primary" : "border-border"
            }`}
        >
      <video
        ref={videoRef}
        src={src}
        controls
                className="max-w-full max-h-full object-contain"
        style={{ filter }}
      >
        Your browser does not support video.
      </video>

      {/* Text overlays */}
            {layers?.map((layer, index) => {
                if (layer.type !== "text") return null;
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

            {mascot.type !== "none" && mascot.position !== "replace" && mascotSrc && (
                <DraggableMascotLayer mascot={mascot} src={mascotSrc} />
            )}

            {mascot.type !== "none" && !mascot.uiPlacement && (
                <div className="absolute bottom-3 left-3 text-[11px] px-2 py-1 rounded bg-background/80 text-foreground border">
                    Kéo mascot vào video để đặt vị trí
                </div>
            )}
    </div>
  );
}
