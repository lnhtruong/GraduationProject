"use client";

// VideoPreview.tsx
// THAY ĐỔI CHÍNH:
// - Text layer KHÔNG dùng useDraggable nữa → dùng onMouseDown thuần
//   → fix position không update, fix bóng thừa khi kéo
// - Resize giữ nguyên logic mouse event
// - Vẫn export interface Props như cũ để CoreVideoEditor không cần sửa

import type { TextOption, LayerItem } from "@/features/videoEditor/types";
import { useRef, useState, useEffect } from "react";

// ─── Resize handle ─────────────────────────────────────────────────────────────
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

// ─── Text layer (thuần mouse — không dùng dnd-kit) ────────────────────────────
interface TextLayer {
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
  layer: TextLayer;
  zIndex: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<TextOption>) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const width  = layer.data.width  ?? 200;
  const height = layer.data.height ?? 60;

  // ─── Drag (thuần mouse) ──────────────────────────────────────────────────────
  const dragRef = useRef<{
    startMouseX: number;
    startMouseY: number;
    startPosX: number; // % 
    startPosY: number; // %
  } | null>(null);

  const handleDragMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Chỉ drag bằng button trái, và không phải đang resize
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
      const newX = Math.min(100, Math.max(0, dragRef.current.startPosX + dx));
      const newY = Math.min(100, Math.max(0, dragRef.current.startPosY + dy));
      onUpdate(layer.id, { position: { x: newX, y: newY } });
    };

    const onMouseUp = () => {
      dragRef.current = null;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup",  onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup",   onMouseUp);
  };

  // ─── Resize ──────────────────────────────────────────────────────────────────
  const resizeRef = useRef<{
    handle: HandlePos;
    startMouseX: number;
    startMouseY: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);

  const handleResizeMouseDown = (e: React.MouseEvent<HTMLDivElement>, handle: HandlePos) => {
    e.preventDefault();
    e.stopPropagation();

    resizeRef.current = {
      handle,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startWidth:  width,
      startHeight: height,
    };

    const onMouseMove = (ev: MouseEvent) => {
      if (!resizeRef.current) return;
      const { handle: h, startMouseX, startMouseY, startWidth, startHeight } = resizeRef.current;
      const dx = ev.clientX - startMouseX;
      const dy = ev.clientY - startMouseY;
      let nw = startWidth, nh = startHeight;
      if (h.includes("r")) nw = Math.max(60, startWidth  + dx);
      if (h.includes("l")) nw = Math.max(60, startWidth  - dx);
      if (h.includes("b")) nh = Math.max(30, startHeight + dy);
      if (h.includes("t")) nh = Math.max(30, startHeight - dy);
      onUpdate(layer.id, { width: nw, height: nh });
    };

    const onMouseUp = () => {
      resizeRef.current = null;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup",   onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup",   onMouseUp);
  };

  return (
    <div
      style={{
        position: "absolute",
        left:   `${layer.data.position.x}%`,
        top:    `${layer.data.position.y}%`,
        width,
        height,
        transform: "translate(-50%, -50%)",
        zIndex,
        cursor: "grab",
        border: isSelected ? "2px solid #3b82f6" : "2px solid transparent",
        boxSizing: "border-box",
        userSelect: "none",
      }}
      onMouseDown={handleDragMouseDown}
      onClick={(e) => { e.stopPropagation(); onSelect(layer.id); }}
    >
      {/* Text content */}
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
          pointerEvents:  "none", // tránh cản mouse event của wrapper
        }}
      >
        {layer.data.text}
      </p>

      {/* Resize handles — chỉ hiện khi selected */}
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
  onTextSelect?: (id: string) => void;
  onTextUpdate?: (id: string, updates: Partial<TextOption>) => void;
}

export default function VideoPreview({
  videoRef,
  src,
  filter,
  layers = [],
  selectedTextId,
  onTextSelect,
  onTextUpdate,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Click vùng trống → deselect
  const handleContainerClick = () => {
    onTextSelect?.(null as unknown as string);
  };

  return (
    <div
      ref={containerRef}
      className="relative mx-auto w-full max-w-7xl aspect-video max-h-[62vh] bg-black rounded-md overflow-hidden flex items-center justify-center"
      onClick={handleContainerClick}
    >
      <video
        ref={videoRef}
        src={src}
        controls
        className="h-full w-full object-contain"
        style={{ filter }}
        // Ngăn click video bubble lên container (tránh deselect khi click controls)
        onClick={(e) => e.stopPropagation()}
      >
        Your browser does not support video.
      </video>

      {layers.map((layer, index) => {
        if (layer.type !== "text") return null;
        return (
          <DraggableResizableTextLayer
            key={layer.id}
            layer={layer as TextLayer}
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