"use client";

import type { TextOption, LayerItem } from "@/features/videoEditor/types";
import { useRef } from "react";

type HandlePos = "tl" | "tr" | "bl" | "br" | "t" | "b" | "l" | "r";

function ResizeHandle({
  position,
  onMouseDown,
}: {
  position: HandlePos;
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
}) {
  const cls: Record<HandlePos, string> = {
    tl: "top-0 left-0 cursor-nwse-resize",
    tr: "top-0 right-0 cursor-nesw-resize",
    bl: "bottom-0 left-0 cursor-nesw-resize",
    br: "bottom-0 right-0 cursor-nwse-resize",
    t:  "top-0 left-1/2 -translate-x-1/2 cursor-ns-resize",
    b:  "bottom-0 left-1/2 -translate-x-1/2 cursor-ns-resize",
    l:  "top-1/2 left-0 -translate-y-1/2 cursor-ew-resize",
    r:  "top-1/2 right-0 -translate-y-1/2 cursor-ew-resize",
  };
  return (
    <div
      onMouseDown={onMouseDown}
      className={`absolute w-2.5 h-2.5 bg-blue-500 border-2 border-white rounded-full z-50 ${cls[position]} hover:scale-125 transition-transform`}
    />
  );
}

interface TextLayerDef {
  id: string;
  type: "text";
  data: TextOption;
}

function DraggableResizableTextLayer({
  layer,
  zIndex,
  isSelected,
  onSelect,
  onUpdate,
  containerRef,
}: {
  layer: TextLayerDef;
  zIndex: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<TextOption>) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const width  = layer.data.width  ?? 200;
  const height = layer.data.height ?? 60;

  // ─── Drag ────────────────────────────────────────────────────────────────────
  const dragRef = useRef<{
    startMouseX: number;
    startMouseY: number;
    startPosX: number;
    startPosY: number;
  } | null>(null);

  const handleDragMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    onSelect(layer.id);
    const container = containerRef.current;
    if (!container) return;

    dragRef.current = {
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startPosX: layer.data.position.x,
      startPosY: layer.data.position.y,
    };

    const onMouseMove = (ev: MouseEvent) => {
      if (!dragRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dx = ((ev.clientX - dragRef.current.startMouseX) / rect.width)  * 100;
      const dy = ((ev.clientY - dragRef.current.startMouseY) / rect.height) * 100;
      onUpdate(layer.id, {
        position: {
          x: Math.min(100, Math.max(0, dragRef.current.startPosX + dx)),
          y: Math.min(100, Math.max(0, dragRef.current.startPosY + dy)),
        },
      });
    };
    const onMouseUp = () => {
      dragRef.current = null;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  // ─── Resize (scale font theo min ratio W/H) ───────────────────────────────
  const resizeRef = useRef<{
    handle: HandlePos;
    startMouseX: number;
    startMouseY: number;
    startWidth: number;
    startHeight: number;
    startFontSize: number;
  } | null>(null);

  const handleResizeMouseDown = (e: React.MouseEvent<HTMLDivElement>, handle: HandlePos) => {
    e.preventDefault();
    e.stopPropagation();
    resizeRef.current = {
      handle,
      startMouseX:  e.clientX,
      startMouseY:  e.clientY,
      startWidth:   width,
      startHeight:  height,
      startFontSize: layer.data.fontSize,
    };

    const onMouseMove = (ev: MouseEvent) => {
      if (!resizeRef.current) return;
      const { handle: h, startMouseX, startMouseY,
              startWidth, startHeight, startFontSize } = resizeRef.current;
      const dx = ev.clientX - startMouseX;
      const dy = ev.clientY - startMouseY;

      let nw = startWidth;
      let nh = startHeight;
      if (h.includes("r")) nw = Math.max(60,  startWidth  + dx);
      if (h.includes("l")) nw = Math.max(60,  startWidth  - dx);
      if (h.includes("b")) nh = Math.max(30,  startHeight + dy);
      if (h.includes("t")) nh = Math.max(30,  startHeight - dy);

      // Scale font theo min(ratioW, ratioH) — không để chữ tràn theo cả 2 chiều
      const ratioW = nw / startWidth;
      const ratioH = nh / startHeight;
      const ratio  = Math.min(ratioW, ratioH);
      const newFontSize = Math.min(96, Math.max(8, Math.round(startFontSize * ratio)));

      onUpdate(layer.id, { width: nw, height: nh, fontSize: newFontSize });
    };
    const onMouseUp = () => {
      resizeRef.current = null;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  return (
    <div
      style={{
        position:  "absolute",
        left:      `${layer.data.position.x}%`,
        top:       `${layer.data.position.y}%`,
        width,
        height,
        transform: "translate(-50%, -50%)",
        zIndex,
        cursor:    "grab",
        border:    isSelected ? "2px solid #3b82f6" : "2px solid transparent",
        boxSizing: "border-box",
        userSelect: "none",
      }}
      onMouseDown={handleDragMouseDown}
      onClick={(e) => { e.stopPropagation(); onSelect(layer.id); }}
    >
      <p
        style={{
          fontSize:       layer.data.fontSize,
          color:          layer.data.color,
          fontWeight:     layer.data.fontWeight,
          fontStyle:      layer.data.fontStyle,
          textDecoration: layer.data.textDecoration,
          textAlign:      layer.data.textAlign,
          fontFamily:     layer.data.fontFamily,
          padding:        "4px 8px",
          whiteSpace:     "normal",
          wordBreak:      "break-word",
          width:          "100%",
          height:         "100%",
          overflow:       "hidden",
          pointerEvents:  "none",
        }}
      >
        {layer.data.text}
      </p>

      {isSelected && (
        <>
          {(["tl","tr","bl","br","t","b","l","r"] as HandlePos[]).map((pos) => (
            <ResizeHandle
              key={pos}
              position={pos}
              onMouseDown={(e) => handleResizeMouseDown(e, pos)}
            />
          ))}
        </>
      )}
    </div>
  );
}

// ─── VideoPreview ─────────────────────────────────────────────────────────────
interface Props {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  src?: string;
  filter: string;
  layers?: LayerItem[];
  selectedTextId?: string | null;
  onTextSelect?: (id: string | null) => void;
  onTextUpdate?: (id: string, updates: Partial<TextOption>) => void;
}

export default function VideoPreview({
  videoRef, src, filter,
  layers = [], selectedTextId, onTextSelect, onTextUpdate,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className="relative mx-auto w-full max-w-7xl aspect-video max-h-[62vh] bg-black rounded-md overflow-hidden flex items-center justify-center"
      onClick={() => onTextSelect?.(null)}
    >
      <video
        ref={videoRef}
        src={src}
        controls
        className="h-full w-full object-contain"
        style={{ filter }}
        onClick={(e) => e.stopPropagation()}
      >
        Your browser does not support video.
      </video>

      {layers.map((layer, index) => {
        if (layer.type !== "text") return null;
        return (
          <DraggableResizableTextLayer
            key={layer.id}
            layer={layer as TextLayerDef}
            zIndex={layers.length - index + 1}
            isSelected={selectedTextId === layer.id}
            onSelect={(id) => onTextSelect?.(id)}
            onUpdate={(id, updates) => onTextUpdate?.(id, updates)}
            containerRef={containerRef}
          />
        );
      })}
    </div>
  );
}