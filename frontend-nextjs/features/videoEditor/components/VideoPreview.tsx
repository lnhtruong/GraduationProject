import { useEffect, useMemo, useState, type RefObject } from "react";
import type {
  LayerItem,
  MascotOption,
  TextLayer,
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
    xPct: 0,
    yPct: 0,
    aspectRatio: 1,
    hasPlaced: false,
  };

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: "mascot-preview",
      data: {
        source: "mascot-preview",
      },
    });

  const {
    attributes: resizeAttributes,
    listeners: resizeListeners,
    setNodeRef: setResizeRef,
    isDragging: isResizing,
  } = useDraggable({
    id: "mascot-resize-handle",
    data: {
      source: "mascot-resize",
    },
  });

  const size = getMascotDisplaySize(frame, mascot.scale, placement.aspectRatio);
  const containerStyle = {
    left: `${placement.xPct}%`,
    top: `${placement.yPct}%`,
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

interface Props {
  videoRef: RefObject<HTMLVideoElement | null>;
  src?: string;
  filter: string;
  layers?: LayerItem[];
  selectedTextId?: string | null;
  onTextSelect?: (id: string) => void;
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
  mascot,
  onMascotChange,
  onMascotFrameChange,
}: Props) {
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
    if (!mascot || mascot.type !== "custom" || !mascot.customFile) {
      return null;
    }
    return URL.createObjectURL(mascot.customFile);
  }, [mascot]);

  useEffect(() => {
    return () => {
      if (customMascotUrl) {
        URL.revokeObjectURL(customMascotUrl);
      }
    };
  }, [customMascotUrl]);

  const mascotSrc =
    mascot?.type === "preset"
      ? mascot.presetUrl || null
      : mascot?.type === "custom"
        ? customMascotUrl
        : null;

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: "video-preview-dropzone",
    disabled: !hasMascot,
    data: {
      source: "video-preview-dropzone",
    },
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
      const ratio = Math.min(elementWidth / mediaWidth, elementHeight / mediaHeight);
      const width = mediaWidth * ratio;
      const height = mediaHeight * ratio;
      const left = (elementWidth - width) / 2;
      const top = (elementHeight - height) / 2;

      const nextFrame = {
        width,
        height,
      };

      setFrame(nextFrame);
      setFrameOffset({ left, top });
      onMascotFrameChange?.(nextFrame);
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
    if (!mascot || mascot.type === "none" || !onMascotChange || !frame) {
      return;
    }

    const hasAspectRatio = Boolean(mascot.previewPlacement?.aspectRatio);

    if (hasAspectRatio) {
      return;
    }

    if (!mascotSrc) {
      return;
    }

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
        previewPlacement: mascot.previewPlacement
          ? {
              ...mascot.previewPlacement,
              aspectRatio,
            }
          : fallbackPlacement,
      });
    };
    image.src = mascotSrc;
  }, [frame, mascot, mascotSrc, onMascotChange]);

  useEffect(() => {
    if (!mascot || mascot.type === "none" || !onMascotChange || !frame) {
      return;
    }

    const placement = mascot.previewPlacement;
    if (!placement) {
      const defaultPlacement = createDefaultPreviewPlacement(mascot, frame, 1);
      onMascotChange({
        ...mascot,
        previewPlacement: defaultPlacement,
      });
      return;
    }

    const clampedPlacement = clampPreviewPlacement(placement, frame, mascot.scale);
    if (
      clampedPlacement.xPct !== placement.xPct ||
      clampedPlacement.yPct !== placement.yPct
    ) {
      onMascotChange({
        ...mascot,
        previewPlacement: clampedPlacement,
      });
    }
  }, [frame, mascot, onMascotChange]);

  useDndMonitor({
    onDragMove: (event) => {
      if (event.active.data.current?.source !== "mascot-preview") {
        return;
      }

      if (!frame || !mascot?.previewPlacement) {
        return;
      }

      const movedPlacement = clampPreviewPlacement(
        {
          ...mascot.previewPlacement,
          xPct:
            mascot.previewPlacement.xPct + (event.delta.x / frame.width) * 100,
          yPct:
            mascot.previewPlacement.yPct + (event.delta.y / frame.height) * 100,
        },
        frame,
        mascot.scale,
      );

      const { guides, snappedCorner } = applyCornerSnap(
        movedPlacement,
        frame,
        mascot.scale,
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

      {frame && (
        <div
          ref={setDroppableRef}
          className={`absolute border-2 pointer-events-none transition-colors ${
            isOver ? "border-primary" : "border-transparent"
          }`}
          style={{
            left: frameOffset.left,
            top: frameOffset.top,
            width: frame.width,
            height: frame.height,
          }}
        >
          {(guideState.nearLeft || guideState.nearRight) && (
            <div
              className="absolute top-0 bottom-0 w-px border-l border-dashed border-primary/80"
              style={{ left: guideState.nearLeft ? 0 : frame.width }}
            />
          )}
          {(guideState.nearTop || guideState.nearBottom) && (
            <div
              className="absolute left-0 right-0 h-px border-t border-dashed border-primary/80"
              style={{ top: guideState.nearTop ? 0 : frame.height }}
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
