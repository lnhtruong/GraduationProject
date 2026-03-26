// VideoPreview.tsx
// THAY ĐỔI CHÍNH:
// 1. Drag xong → tính lại position % và gọi onTextUpdate để persist
// 2. Resize vẫn giữ nguyên logic cũ
// 3. Truyền containerRef để tính toán chính xác

import type { TextLayer, TextOption, LayerItem } from "@/features/videoEditor/types";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useRef, useState, useEffect } from "react";

function ResizeHandle({
  position,
  onMouseDown,
}: {
  position: "tl" | "tr" | "bl" | "br" | "t" | "b" | "l" | "r";
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
}) {
  const positionClasses = {
    tl: "top-0 left-0 cursor-nwse-resize",
    tr: "top-0 right-0 cursor-nesw-resize",
    bl: "bottom-0 left-0 cursor-nesw-resize",
    br: "bottom-0 right-0 cursor-nwse-resize",
    t: "top-0 left-1/2 -translate-x-1/2 cursor-ns-resize",
    b: "bottom-0 left-1/2 -translate-x-1/2 cursor-ns-resize",
    l: "top-1/2 left-0 -translate-y-1/2 cursor-ew-resize",
    r: "top-1/2 right-0 -translate-y-1/2 cursor-ew-resize",
  };
  return (
    <div
      onMouseDown={onMouseDown}
      className={`absolute w-2 h-2 bg-blue-500 border border-white rounded-full ${positionClasses[position]} hover:w-3 hover:h-3`}
      style={{ zIndex: 50 }}
    />
  );
}

function DraggableResizableTextLayer({
  layer,
  index,
  total,
  selectedTextId,
  onTextSelect,
  onTextUpdate,
  containerRef,
}: {
  layer: TextLayer;
  index: number;
  total: number;
  selectedTextId?: string | null;
  onTextSelect?: (id: string) => void;
  onTextUpdate?: (id: string, updates: Partial<TextOption>) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: layer.id,
      data: { source: "preview", layerId: layer.id },
    });

  // ─── persist position khi drag kết thúc ───────────────────────────────────
  // dnd-kit chỉ cho visual transform; ta dùng useEffect theo dõi isDragging
  // Khi isDragging chuyển false → transform vừa được reset → tính delta
  const prevTransformRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (isDragging && transform) {
      prevTransformRef.current = { x: transform.x, y: transform.y };
    }
    if (!isDragging && prevTransformRef.current) {
      const { x: dx, y: dy } = prevTransformRef.current;
      prevTransformRef.current = null;
      if (!containerRef.current || (dx === 0 && dy === 0)) return;

      const rect = containerRef.current.getBoundingClientRect();
      const newX = layer.data.position.x + (dx / rect.width) * 100;
      const newY = layer.data.position.y + (dy / rect.height) * 100;

      onTextUpdate?.(layer.id, {
        position: {
          x: Math.min(100, Math.max(0, newX)),
          y: Math.min(100, Math.max(0, newY)),
        },
      });
    }
  }, [isDragging]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── resize ───────────────────────────────────────────────────────────────
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartRef = useRef<{
    startX: number; startY: number;
    startWidth: number; startHeight: number;
    handle: string;
  } | null>(null);

  const isSelected = selectedTextId === layer.id;
  const width = layer.data.width ?? 200;
  const height = layer.data.height ?? 60;

  const style: React.CSSProperties = {
    left: `${layer.data.position.x}%`,
    top: `${layer.data.position.y}%`,
    width,
    height,
    transform: isDragging
      ? `${CSS.Translate.toString(transform)} translate(-50%, -50%)`
      : "translate(-50%, -50%)",
    zIndex: total - index + 1,
    opacity: isDragging ? 0.5 : 1,
    position: "absolute",
    cursor: isDragging ? "grabbing" : "grab",
    border: isSelected ? "2px solid #3b82f6" : "2px solid transparent",
    boxSizing: "border-box",
  };

  const handleResizeStart = (e: React.MouseEvent<HTMLDivElement>, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeStartRef.current = {
      startX: e.clientX, startY: e.clientY,
      startWidth: width, startHeight: height, handle,
    };
  };

  useEffect(() => {
    if (!isResizing) return;
    const onMove = (e: MouseEvent) => {
      if (!resizeStartRef.current) return;
      const { startX, startY, startWidth, startHeight, handle } = resizeStartRef.current;
      const dx = e.clientX - startX, dy = e.clientY - startY;
      let nw = startWidth, nh = startHeight;
      if (handle.includes("r")) nw = Math.max(60, startWidth + dx);
      if (handle.includes("l")) nw = Math.max(60, startWidth - dx);
      if (handle.includes("b")) nh = Math.max(30, startHeight + dy);
      if (handle.includes("t")) nh = Math.max(30, startHeight - dy);
      onTextUpdate?.(layer.id, { width: nw, height: nh });
    };
    const onUp = () => { setIsResizing(false); resizeStartRef.current = null; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [isResizing, layer.id, onTextUpdate]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onTextSelect?.(layer.id)}
      className="relative group"
    >
      <p
        style={{
          fontSize: layer.data.fontSize,
          color: layer.data.color,
          fontWeight: layer.data.fontWeight,
          fontStyle: layer.data.fontStyle,
          textDecoration: layer.data.textDecoration,
          textAlign: layer.data.textAlign,
          fontFamily: layer.data.fontFamily,
          padding: "4px 8px",
          userSelect: "none",
          whiteSpace: "normal",
          wordBreak: "break-word",
          width: "100%",
          height: "100%",
          overflow: "hidden",
        }}
      >
        {layer.data.text}
      </p>
      {isSelected && !isDragging && (
        <>
          {(["tl","tr","bl","br","t","b","l","r"] as const).map((pos) => (
            <ResizeHandle key={pos} position={pos} onMouseDown={(e) => handleResizeStart(e, pos)} />
          ))}
        </>
      )}
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
  onTextUpdate?: (id: string, updates: Partial<TextOption>) => void;
}

export default function VideoPreview({
  videoRef, src, filter, layers = [], selectedTextId, onTextSelect, onTextUpdate,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className="relative mx-auto w-full max-w-7xl aspect-video max-h-[62vh] bg-black rounded-md overflow-hidden flex items-center justify-center"
    >
      <video ref={videoRef} src={src} controls className="h-full w-full object-contain" style={{ filter }}>
        Your browser does not support video.
      </video>
      {layers.map((layer, index) => {
        if (layer.type !== "text") return null;
        return (
          <DraggableResizableTextLayer
            key={layer.id}
            layer={layer}
            index={index}
            total={layers.length}
            selectedTextId={selectedTextId}
            onTextSelect={onTextSelect}
            onTextUpdate={onTextUpdate}
            containerRef={containerRef}
          />
        );
      })}
    </div>
  );
}