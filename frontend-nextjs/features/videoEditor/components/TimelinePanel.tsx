"use client";

// TimelinePanel.tsx
// Thay đổi so với bản trước:
// - Playhead có thể kéo để seek video (2 chiều)
// - Thêm prop onSeek: (ms: number) => void
// - Playhead indicator rộng hơn, dễ grab hơn

import { useRef, useState, useCallback, useEffect } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import { Trash2, ChevronUp, ChevronDown, Type } from "lucide-react";
import type { LayerItem, TextOption } from "@/features/videoEditor/types";
import { cn } from "@/lib/utils";

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));
const fmt = (ms: number) => {
  const s = ms / 1000;
  const m = Math.floor(s / 60);
  const sec = (s % 60).toFixed(1);
  return `${m}:${sec.padStart(4, "0")}`;
};

type DragTarget =
  | { kind: "move"; layerId: string; startMs: number; mouseXStart: number }
  | {
      kind: "resize-left";
      layerId: string;
      startMs: number;
      mouseXStart: number;
    }
  | {
      kind: "resize-right";
      layerId: string;
      endMs: number;
      mouseXStart: number;
    };

// ─── TimelineTrack ─────────────────────────────────────────────────────────────
function TimelineTrack({
  layer,
  selected,
  totalMs,
  pxPerMs,
  onSelect,
  onUpdate,
  onRemove,
}: {
  layer: LayerItem & { type: "text" };
  selected: boolean;
  totalMs: number;
  pxPerMs: number;
  onSelect: () => void;
  onUpdate: (id: string, updates: Partial<TextOption>) => void;
  onRemove: (id: string) => void;
}) {
  const startMs = layer.data.startTime ?? 0;
  const durationMs =
    layer.data.duration && layer.data.duration > 0
      ? layer.data.duration
      : totalMs;
  const endMs = Math.min(startMs + durationMs, totalMs);
  const left = startMs * pxPerMs;
  const width = Math.max(8, (endMs - startMs) * pxPerMs);

  const dragRef = useRef<DragTarget | null>(null);

  const startDrag = useCallback(
    (e: React.MouseEvent, kind: DragTarget["kind"]) => {
      e.stopPropagation();
      e.preventDefault();
      onSelect();
      if (kind === "move")
        dragRef.current = {
          kind,
          layerId: layer.id,
          startMs,
          mouseXStart: e.clientX,
        };
      else if (kind === "resize-left")
        dragRef.current = {
          kind,
          layerId: layer.id,
          startMs,
          mouseXStart: e.clientX,
        };
      else
        dragRef.current = {
          kind,
          layerId: layer.id,
          endMs,
          mouseXStart: e.clientX,
        };

      const onMove = (ev: MouseEvent) => {
        if (!dragRef.current) return;
        const dx = ev.clientX - dragRef.current.mouseXStart;
        const deltaMs = dx / pxPerMs;
        if (dragRef.current.kind === "move") {
          const newStart = clamp(
            dragRef.current.startMs + deltaMs,
            0,
            totalMs - 100,
          );
          const dur = durationMs < totalMs ? durationMs : totalMs - newStart;
          onUpdate(layer.id, {
            startTime: Math.round(newStart),
            duration: Math.round(dur),
          });
        } else if (dragRef.current.kind === "resize-left") {
          const newStart = clamp(
            dragRef.current.startMs + deltaMs,
            0,
            endMs - 100,
          );
          onUpdate(layer.id, {
            startTime: Math.round(newStart),
            duration: Math.round(endMs - newStart),
          });
        } else {
          const newEnd = clamp(
            dragRef.current.endMs + deltaMs,
            startMs + 100,
            totalMs,
          );
          onUpdate(layer.id, { duration: Math.round(newEnd - startMs) });
        }
      };
      const onUp = () => {
        dragRef.current = null;
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [
      layer.id,
      startMs,
      endMs,
      durationMs,
      totalMs,
      pxPerMs,
      onSelect,
      onUpdate,
    ],
  );

  return (
    <div className="relative" style={{ height: 32, marginBottom: 2 }}>
      <div
        className={cn(
          "absolute top-1 bottom-1 rounded flex items-center select-none",
          "bg-blue-500/80 border",
          selected ? "border-blue-300 shadow-md" : "border-blue-700/50",
        )}
        style={{ left, width }}
        onMouseDown={(e) => startDrag(e, "move")}
        onClick={onSelect}
      >
        <div
          className="absolute left-0 top-0 bottom-0 w-2 cursor-w-resize hover:bg-white/30 rounded-l"
          onMouseDown={(e) => startDrag(e, "resize-left")}
        />
        <span className="px-3 text-[11px] text-white font-medium truncate pointer-events-none flex-1">
          {layer.data.text || "Text"}
        </span>
        <div
          className="absolute right-0 top-0 bottom-0 w-2 cursor-e-resize hover:bg-white/30 rounded-r"
          onMouseDown={(e) => startDrag(e, "resize-right")}
        />
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
interface Props {
  layers: LayerItem[];
  selectedId?: string | null;
  onSelect: (id: string | null) => void;
  onReorder: (newOrder: LayerItem[]) => void;
  onUpdate: (id: string, updates: Partial<TextOption>) => void;
  onRemove: (id: string) => void;
  videoDurationMs?: number;
  currentTimeMs?: number;
  /** Callback để seek video khi kéo playhead */
  onSeek?: (ms: number) => void;
}

const RULER_HEIGHT = 24;
const TRACK_WIDTH = 140;
const MIN_PX_PER_SEC = 10;
const MAX_PX_PER_SEC = 120;

export default function TimelinePanel({
  layers,
  selectedId,
  onSelect,
  onReorder,
  onUpdate,
  onRemove,
  videoDurationMs = 30_000,
  currentTimeMs = 0,
  onSeek,
}: Props) {
  const textLayers = layers.filter(
    (l): l is LayerItem & { type: "text" } => l.type === "text",
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(600);
  const [pxPerSec, setPxPerSec] = useState(40);

  useEffect(() => {
    const obs = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width - TRACK_WIDTH - 16);
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const pxPerMs = pxPerSec / 1000;
  const totalPx = Math.max(containerWidth, (videoDurationMs / 1000) * pxPerSec);
  const ticksEvery = pxPerSec >= 60 ? 1 : pxPerSec >= 20 ? 2 : 5;
  const ticks: number[] = [];
  for (let s = 0; s <= videoDurationMs / 1000; s += ticksEvery) ticks.push(s);

  const moveLayer = (id: string, dir: -1 | 1) => {
    const idx = layers.findIndex((l) => l.id === id);
    if (idx === -1) return;
    const next = idx + dir;
    if (next < 0 || next >= layers.length) return;
    onReorder(arrayMove(layers, idx, next));
  };

  // ─── Playhead drag (seek) ──────────────────────────────────────────────────
  const playheadDragging = useRef(false);

  const seekFromMouseX = useCallback(
    (clientX: number) => {
      if (!scrollAreaRef.current) return;
      const rect = scrollAreaRef.current.getBoundingClientRect();
      const scrollLeft = scrollAreaRef.current.scrollLeft;
      const relX = clientX - rect.left + scrollLeft;
      const ms = clamp(relX / pxPerMs, 0, videoDurationMs);
      onSeek?.(ms);
    },
    [pxPerMs, videoDurationMs, onSeek],
  );

  const handlePlayheadMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    playheadDragging.current = true;

    const onMove = (ev: MouseEvent) => {
      if (!playheadDragging.current) return;
      seekFromMouseX(ev.clientX);
    };
    const onUp = () => {
      playheadDragging.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // Click trên ruler để seek trực tiếp
  const handleRulerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    seekFromMouseX(e.clientX);
  };

  const [trashHover, setTrashHover] = useState(false);
  const playheadLeft = currentTimeMs * pxPerMs;

  return (
    <div
      ref={containerRef}
      className="flex flex-col gap-1 select-none w-full h-full min-h-0"
    >
      {/* Controls */}
      <div className="flex items-center justify-between px-2 pb-1 border-b border-border shrink-0">
        <span className="text-xs font-semibold">Timeline</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">
            {fmt(currentTimeMs)} / {fmt(videoDurationMs)}
          </span>
          <span className="text-[10px] text-muted-foreground">Zoom</span>
          <input
            type="range"
            min={MIN_PX_PER_SEC}
            max={MAX_PX_PER_SEC}
            value={pxPerSec}
            onChange={(e) => setPxPerSec(Number(e.target.value))}
            className="w-20 h-1 accent-primary"
          />
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Label column */}
        <div className="shrink-0 flex flex-col" style={{ width: TRACK_WIDTH }}>
          <div style={{ height: RULER_HEIGHT }} />
          {textLayers.length === 0 && (
            <div className="flex items-center text-[11px] text-muted-foreground px-2 h-8">
              Chưa có layer
            </div>
          )}
          {textLayers.map((layer) => (
            <div
              key={layer.id}
              className={cn(
                "flex items-center gap-1 px-1 rounded-l cursor-pointer border-r border-border",
                selectedId === layer.id ? "bg-primary/15" : "hover:bg-muted/50",
              )}
              style={{ height: 34, marginBottom: 2 }}
              onClick={() => onSelect(layer.id)}
            >
              <Type size={12} className="shrink-0 text-muted-foreground" />
              <span className="text-[11px] truncate flex-1 font-medium">
                {layer.data.text || "Text"}
              </span>
              <button
                type="button"
                title="Lên trên"
                onClick={(e) => {
                  e.stopPropagation();
                  moveLayer(layer.id, -1);
                }}
                className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
              >
                <ChevronUp size={10} />
              </button>
              <button
                type="button"
                title="Xuống dưới"
                onClick={(e) => {
                  e.stopPropagation();
                  moveLayer(layer.id, 1);
                }}
                className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
              >
                <ChevronDown size={10} />
              </button>
              <button
                type="button"
                title="Xóa layer"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(layer.id);
                }}
                className="p-0.5 rounded hover:bg-red-500/20 text-muted-foreground hover:text-red-500"
              >
                <Trash2 size={10} />
              </button>
            </div>
          ))}
        </div>

        {/* Scrollable area */}
        <div
          ref={scrollAreaRef}
          className="flex-1 overflow-x-auto overflow-y-hidden min-w-0 relative"
        >
          <div
            style={{ width: totalPx, minWidth: "100%", position: "relative" }}
          >
            {/* Ruler — click để seek */}
            <div
              className="relative bg-muted/40 border-b border-border cursor-pointer"
              style={{ height: RULER_HEIGHT }}
              onClick={handleRulerClick}
            >
              {ticks.map((s) => (
                <div
                  key={s}
                  className="absolute top-0 flex flex-col items-start"
                  style={{ left: s * pxPerSec }}
                >
                  <div className="w-px h-3 bg-border/80" />
                  <span className="text-[9px] text-muted-foreground ml-0.5">
                    {s}s
                  </span>
                </div>
              ))}
            </div>

            {/* Grid lines */}
            {ticks.map((s) => (
              <div
                key={s}
                className="absolute bottom-0 w-px bg-border/25 pointer-events-none"
                style={{ left: s * pxPerSec, top: RULER_HEIGHT }}
              />
            ))}

            {/* Tracks */}
            <div className="relative" style={{ paddingTop: 4 }}>
              {textLayers.map((layer) => (
                <TimelineTrack
                  key={layer.id}
                  layer={layer}
                  selected={selectedId === layer.id}
                  totalMs={videoDurationMs}
                  pxPerMs={pxPerMs}
                  onSelect={() => onSelect(layer.id)}
                  onUpdate={onUpdate}
                  onRemove={onRemove}
                />
              ))}
            </div>

            {/* ── Playhead (kéo được) ── */}
            <div
              className="absolute top-0 bottom-0 pointer-events-none"
              style={{ left: playheadLeft, top: 0 }}
            >
              {/* Đường kẻ đỏ */}
              <div className="absolute top-0 bottom-0 w-px bg-red-500/80 left-0" />

              {/* Handle ở trên ruler — pointer-events bật lại */}
              <div
                className="absolute flex flex-col items-center pointer-events-auto cursor-ew-resize"
                style={{ top: 0, left: -6, width: 13 }}
                onMouseDown={handlePlayheadMouseDown}
                title={fmt(currentTimeMs)}
              >
                {/* Mũi tên tam giác */}
                <div
                  className="w-3 h-3 bg-red-500 rotate-45 rounded-sm shadow-md"
                  style={{ marginTop: 2 }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trash zone */}
      {selectedId && (
        <div
          className={cn(
            "flex items-center justify-center gap-2 h-8 rounded border border-dashed cursor-pointer transition-colors mx-2 mb-1",
            trashHover
              ? "bg-red-500 border-red-400 text-white"
              : "border-red-300/50 text-red-400 hover:border-red-400 hover:bg-red-500/10",
          )}
          onMouseEnter={() => setTrashHover(true)}
          onMouseLeave={() => setTrashHover(false)}
          onClick={() => {
            if (selectedId) onRemove(selectedId);
          }}
        >
          <Trash2 size={13} />
          <span className="text-xs font-medium">Xóa layer đang chọn</span>
        </div>
      )}
    </div>
  );
}
