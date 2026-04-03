"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  LayerItem,
  MascotOption,
  TextOption,
  VideoFrameSize,
} from "@/features/videoEditor/types";
import { useDndMonitor, useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  applyCornerSnap,
  clampPreviewPlacement,
  createDefaultPreviewPlacement,
  getMascotDisplaySize,
} from "@/features/videoEditor/utils/mascotPlacement";

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
    t: "top-0 left-1/2 -translate-x-1/2 cursor-ns-resize",
    b: "bottom-0 left-1/2 -translate-x-1/2 cursor-ns-resize",
    l: "top-1/2 left-0 -translate-y-1/2 cursor-ew-resize",
    r: "top-1/2 right-0 -translate-y-1/2 cursor-ew-resize",
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
  const width = layer.data.width ?? 200;
  const height = layer.data.height ?? 60;

  // ─── Inline edit ─────────────────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(layer.data.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const enterEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(layer.id);
    setEditText(layer.data.text);
    setIsEditing(true);
  };

  const commitEdit = () => {
    setIsEditing(false);
    onUpdate(layer.id, { text: editText });
  };

  const handleTextareaKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (e.key === "Escape") {
      setIsEditing(false);
      setEditText(layer.data.text);
    }
    // Shift+Enter = newline, Enter alone = commit
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      commitEdit();
    }
  };

  // Auto-focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  // ─── Drag ────────────────────────────────────────────────────────────────────
  const dragRef = useRef<{
    startMouseX: number;
    startMouseY: number;
    startPosX: number;
    startPosY: number;
  } | null>(null);

  const handleDragMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    if (isEditing) return; // don't drag while editing
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
      const dx =
        ((ev.clientX - dragRef.current.startMouseX) / rect.width) * 100;
      const dy =
        ((ev.clientY - dragRef.current.startMouseY) / rect.height) * 100;
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

  const handleResizeMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
    handle: HandlePos,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    resizeRef.current = {
      handle,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startWidth: width,
      startHeight: height,
      startFontSize: layer.data.fontSize,
    };

    const onMouseMove = (ev: MouseEvent) => {
      if (!resizeRef.current) return;
      const {
        handle: h,
        startMouseX,
        startMouseY,
        startWidth,
        startHeight,
        startFontSize,
      } = resizeRef.current;
      const dx = ev.clientX - startMouseX;
      const dy = ev.clientY - startMouseY;

      let nw = startWidth;
      let nh = startHeight;
      if (h.includes("r")) nw = Math.max(60, startWidth + dx);
      if (h.includes("l")) nw = Math.max(60, startWidth - dx);
      if (h.includes("b")) nh = Math.max(30, startHeight + dy);
      if (h.includes("t")) nh = Math.max(30, startHeight - dy);

      // Scale font theo min(ratioW, ratioH) — không để chữ tràn theo cả 2 chiều
      const ratioW = nw / startWidth;
      const ratioH = nh / startHeight;
      const ratio = Math.min(ratioW, ratioH);
      const newFontSize = Math.min(
        96,
        Math.max(8, Math.round(startFontSize * ratio)),
      );

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

  const textStyle: React.CSSProperties = {
    fontSize: layer.data.fontSize,
    color: layer.data.color,
    fontWeight: layer.data.fontWeight,
    fontStyle: layer.data.fontStyle,
    textDecoration: layer.data.textDecoration,
    textAlign: layer.data.textAlign,
    fontFamily: layer.data.fontFamily,
    padding: "4px 8px",
    width: "100%",
    height: "100%",
  };

  return (
    <div
      style={{
        position: "absolute",
        left: `${layer.data.position.x}%`,
        top: `${layer.data.position.y}%`,
        width,
        height,
        transform: "translate(-50%, -50%)",
        zIndex,
        cursor: isEditing ? "text" : "grab",
        border: isSelected ? "2px solid #3b82f6" : "2px solid transparent",
        boxSizing: "border-box",
        userSelect: "none",
      }}
      onMouseDown={handleDragMouseDown}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(layer.id);
      }}
      onDoubleClick={enterEdit}
    >
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleTextareaKeyDown}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            ...textStyle,
            background: "rgba(0,0,0,0.55)",
            border: "none",
            outline: "none",
            resize: "none",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            overflow: "hidden",
            cursor: "text",
            boxSizing: "border-box",
          }}
        />
      ) : (
        <p
          style={{
            ...textStyle,
            whiteSpace: "normal",
            wordBreak: "break-word",
            overflow: "hidden",
            pointerEvents: "none",
          }}
        >
          {layer.data.text}
        </p>
      )}

      {isSelected && !isEditing && (
        <>
          {(["tl", "tr", "bl", "br", "t", "b", "l", "r"] as HandlePos[]).map(
            (pos) => (
              <ResizeHandle
                key={pos}
                position={pos}
                onMouseDown={(e) => handleResizeMouseDown(e, pos)}
              />
            ),
          )}
        </>
      )}
    </div>
  );
}

// ─── DraggableMascotLayer ─────────────────────────────────────────────────────
function DraggableMascotLayer({
  mascot,
  mascotSrc,
  frame,
}: {
  mascot: MascotOption;
  mascotSrc: string;
  frame: VideoFrameSize;
}) {
  const placement = mascot.previewPlacement || {
    x: 0,
    y: 0,
    aspectRatio: 1,
    hasPlaced: false,
  };

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: "mascot-preview",
      data: { source: "mascot-preview" },
    });

  const {
    attributes: resizeAttributes,
    listeners: resizeListeners,
    setNodeRef: setResizeRef,
    isDragging: isResizing,
  } = useDraggable({
    id: "mascot-resize-handle",
    data: { source: "mascot-resize" },
  });

  const size = getMascotDisplaySize(
    frame,
    mascot.scale,
    placement.aspectRatio,
    mascot.sourceWidth,
    mascot.sourceHeight,
  );

  const scaleX = frame.scaleX ?? 1;
  const scaleY = frame.scaleY ?? 1;

  const containerStyle = {
    left: `${placement.x * scaleX}px`,
    top: `${placement.y * scaleY}px`,
    width: `${size.width}px`,
    height: `${size.height}px`,
    position: "absolute" as const,
    zIndex: 25,
  };

  const style = {
    transform: isDragging
      ? `${CSS.Translate.toString(transform)}`
      : "translate3d(0px, 0px, 0px)",
    cursor: "grab",
    opacity: isDragging || isResizing ? 0.72 : 1,
    border: "2px solid rgba(59, 130, 246, 0.85)",
    borderRadius: "8px",
    boxShadow: "0 12px 24px rgba(0, 0, 0, 0.35)",
    touchAction: "none" as const,
    position: "absolute" as const,
    inset: 0,
    overflow: "hidden" as const,
    background: "rgba(0, 0, 0, 0.15)",
  };

  const resizeStyle = {
    position: "absolute" as const,
    right: "-8px",
    bottom: "-8px",
    width: "18px",
    height: "18px",
    borderRadius: "999px",
    border: "2px solid rgba(255,255,255,0.95)",
    background: "rgba(59, 130, 246, 0.95)",
    cursor: "nwse-resize",
    zIndex: 30,
    boxShadow: "0 2px 10px rgba(0,0,0,0.4)",
    touchAction: "none" as const,
  };

  if (!mascot.previewPlacement || mascot.type === "none") {
    return null;
  }

  return (
    <div style={containerStyle} className="group">
      <button
        ref={setNodeRef}
        style={style}
        type="button"
        {...listeners}
        {...attributes}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mascotSrc}
          alt="Mascot preview"
          className="h-full w-full object-contain"
          draggable={false}
        />
        <span className="pointer-events-none absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
          Kéo để đặt vị trí
        </span>
      </button>

      <button
        ref={setResizeRef}
        type="button"
        style={resizeStyle}
        {...resizeListeners}
        {...resizeAttributes}
        aria-label="Resize mascot"
      />
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
  mascot?: MascotOption;
  onMascotChange?: (mascot: MascotOption) => void;
  onMascotFrameChange?: (frame: VideoFrameSize | null) => void;
}

export default function VideoPreview({
  videoRef,
  src,
  filter,
  layers = [],
  selectedTextId,
  onTextSelect,
  onTextUpdate,
  mascot,
  onMascotChange,
  onMascotFrameChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [frame, setFrame] = useState<VideoFrameSize | null>(null);
  const [frameOffset, setFrameOffset] = useState({ left: 0, top: 0 });
  const [guideState, setGuideState] = useState({
    nearLeft: false,
    nearRight: false,
    nearTop: false,
    nearBottom: false,
    corner: null as
      | "top-left"
      | "top-right"
      | "bottom-left"
      | "bottom-right"
      | null,
  });

  const hasMascot = Boolean(mascot && mascot.type !== "none");

  const customMascotUrl = useMemo(() => {
    if (!mascot || mascot.type !== "custom" || !mascot.customFile) return null;
    return URL.createObjectURL(mascot.customFile);
  }, [mascot]);

  useEffect(() => {
    return () => {
      if (customMascotUrl) URL.revokeObjectURL(customMascotUrl);
    };
  }, [customMascotUrl]);

  const mascotSrc =
    mascot?.type === "preset"
      ? mascot.presetUrl || null
      : mascot?.type === "custom"
        ? mascot.localFileUrl || customMascotUrl || mascot.presetUrl || null
        : null;

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: "video-preview-dropzone",
    disabled: !hasMascot,
    data: { source: "video-preview-dropzone" },
  });

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) {
      onMascotFrameChange?.(null);
      return;
    }

    const updateFrame = () => {
      const elementWidth = videoEl.clientWidth;
      const elementHeight = videoEl.clientHeight;

      if (!elementWidth || !elementHeight) {
        setFrame(null);
        onMascotFrameChange?.(null);
        return;
      }

      const mediaWidth = videoEl.videoWidth || elementWidth;
      const mediaHeight = videoEl.videoHeight || elementHeight;
      const ratio = Math.min(
        elementWidth / mediaWidth,
        elementHeight / mediaHeight,
      );
      const displayWidth = mediaWidth * ratio;
      const displayHeight = mediaHeight * ratio;
      const left = (elementWidth - displayWidth) / 2;
      const top = (elementHeight - displayHeight) / 2;

      setFrame({
        width: mediaWidth,
        height: mediaHeight,
        displayWidth,
        displayHeight,
        scaleX: displayWidth / mediaWidth,
        scaleY: displayHeight / mediaHeight,
      });
      setFrameOffset({ left, top });
      onMascotFrameChange?.({
        width: mediaWidth,
        height: mediaHeight,
        displayWidth,
        displayHeight,
        scaleX: displayWidth / mediaWidth,
        scaleY: displayHeight / mediaHeight,
      });
    };

    updateFrame();
    videoEl.addEventListener("loadedmetadata", updateFrame);
    window.addEventListener("resize", updateFrame);

    return () => {
      videoEl.removeEventListener("loadedmetadata", updateFrame);
      window.removeEventListener("resize", updateFrame);
    };
  }, [videoRef, src, onMascotFrameChange]);

  useEffect(() => {
    if (!mascot || mascot.type === "none" || !onMascotChange || !frame) return;
    const hasAspectRatio = Boolean(mascot.previewPlacement?.aspectRatio);
    const hasSourceSize = Boolean(mascot.sourceWidth && mascot.sourceHeight);
    if (hasAspectRatio && hasSourceSize) return;
    if (!mascotSrc) return;

    const image = new window.Image();
    image.onload = () => {
      const aspectRatio = image.naturalWidth / image.naturalHeight || 1;
      const fallbackPlacement = createDefaultPreviewPlacement(
        mascot,
        frame,
        aspectRatio,
      );
      onMascotChange({
        ...mascot,
        sourceWidth: image.naturalWidth,
        sourceHeight: image.naturalHeight,
        previewPlacement: mascot.previewPlacement
          ? { ...mascot.previewPlacement, aspectRatio }
          : fallbackPlacement,
      });
    };
    image.src = mascotSrc;
  }, [frame, mascot, mascotSrc, onMascotChange]);

  useEffect(() => {
    if (!mascot || mascot.type === "none" || !onMascotChange || !frame) return;

    const placement = mascot.previewPlacement;
    if (!placement) {
      onMascotChange({
        ...mascot,
        previewPlacement: createDefaultPreviewPlacement(mascot, frame, 1),
      });
      return;
    }

    const clampedPlacement = clampPreviewPlacement(
      placement,
      frame,
      mascot.scale,
      mascot.sourceWidth,
      mascot.sourceHeight,
    );
    if (
      clampedPlacement.x !== placement.x ||
      clampedPlacement.y !== placement.y
    ) {
      onMascotChange({
        ...mascot,
        previewPlacement: clampedPlacement,
      });
    }
  }, [frame, mascot, onMascotChange]);

  useDndMonitor({
    onDragMove: (event) => {
      if (event.active.data.current?.source !== "mascot-preview") return;
      if (!frame || !mascot?.previewPlacement) return;

      const scaleX = frame.scaleX ?? 1;
      const scaleY = frame.scaleY ?? 1;

      const movedPlacement = clampPreviewPlacement(
        {
          ...mascot.previewPlacement,
          x:
            mascot.previewPlacement.x +
            event.delta.x / Math.max(scaleX, 0.0001),
          y:
            mascot.previewPlacement.y +
            event.delta.y / Math.max(scaleY, 0.0001),
        },
        frame,
        mascot.scale,
        mascot.sourceWidth,
        mascot.sourceHeight,
      );

      const { guides, snappedCorner } = applyCornerSnap(
        movedPlacement,
        frame,
        mascot.scale,
        mascot.sourceWidth,
        mascot.sourceHeight,
      );
      setGuideState({
        nearLeft: guides.nearLeft,
        nearRight: guides.nearRight,
        nearTop: guides.nearTop,
        nearBottom: guides.nearBottom,
        corner: snappedCorner,
      });
    },
    onDragEnd: () => {
      setGuideState({
        nearLeft: false,
        nearRight: false,
        nearTop: false,
        nearBottom: false,
        corner: null,
      });
    },
    onDragCancel: () => {
      setGuideState({
        nearLeft: false,
        nearRight: false,
        nearTop: false,
        nearBottom: false,
        corner: null,
      });
    },
  });

  const mascotPlacementReady = useMemo(
    () =>
      Boolean(
        mascot &&
        mascot.type !== "none" &&
        mascot.previewPlacement &&
        mascotSrc &&
        frame,
      ),
    [frame, mascot, mascotSrc],
  );

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

      {/* Mascot overlay with drag-and-drop */}
      {frame && (
        <div
          ref={setDroppableRef}
          className={`absolute border-2 pointer-events-none transition-colors ${
            isOver ? "border-primary" : "border-transparent"
          }`}
          style={{
            left: frameOffset.left,
            top: frameOffset.top,
            width: frame.displayWidth ?? frame.width,
            height: frame.displayHeight ?? frame.height,
          }}
        >
          {(guideState.nearLeft || guideState.nearRight) && (
            <div
              className="absolute top-0 bottom-0 w-px border-l border-dashed border-primary/80"
              style={{
                left: guideState.nearLeft
                  ? 0
                  : (frame.displayWidth ?? frame.width),
              }}
            />
          )}
          {(guideState.nearTop || guideState.nearBottom) && (
            <div
              className="absolute left-0 right-0 h-px border-t border-dashed border-primary/80"
              style={{
                top: guideState.nearTop
                  ? 0
                  : (frame.displayHeight ?? frame.height),
              }}
            />
          )}

          {guideState.corner && (
            <div className="absolute right-2 top-2 rounded-md bg-primary/90 px-2 py-1 text-[10px] font-semibold text-primary-foreground shadow">
              Snap {guideState.corner}
            </div>
          )}

          {mascotPlacementReady && mascot && mascotSrc ? (
            <div className="pointer-events-auto">
              <DraggableMascotLayer
                mascot={mascot}
                mascotSrc={mascotSrc}
                frame={frame}
              />
            </div>
          ) : null}
        </div>
      )}

      {/* Text overlays */}
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
