// TimelinePanel.tsx  (thay thế hoàn toàn LayersPanel + TrashDropZone)
// Chức năng:
//  - Hiển thị timeline theo videoDuration
//  - Kéo thanh start / end của từng text layer
//  - Kéo toàn bộ block để dời startTime
//  - Click chọn layer
//  - Drag-to-trash: giữ Ctrl + kéo layer ra vùng trash hoặc dùng nút ×
//  - Reorder (z-index) bằng nút ▲ ▼
"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import { Trash2, ChevronUp, ChevronDown, Type } from "lucide-react";
import type { LayerItem, TextOption } from "@/features/videoEditor/types";
import { cn } from "@/lib/utils";

// ─── helpers ──────────────────────────────────────────────────────────────────
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const fmt = (ms: number) => {
  const s = ms / 1000;
  const m = Math.floor(s / 60);
  const sec = (s % 60).toFixed(1);
  return `${m}:${sec.padStart(4, "0")}`;
};

// ─── types ────────────────────────────────────────────────────────────────────
type DragTarget =
  | { kind: "move"; layerId: string; startMs: number; mouseXStart: number }
  | { kind: "resize-left"; layerId: string; startMs: number; mouseXStart: number }
  | { kind: "resize-right"; layerId: string; endMs: number; mouseXStart: number };

// ─── TimelineTrack (single row) ───────────────────────────────────────────────
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
  const durationMs = layer.data.duration && layer.data.duration > 0
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
      if (kind === "move") {
        dragRef.current = { kind, layerId: layer.id, startMs, mouseXStart: e.clientX };
      } else if (kind === "resize-left") {
        dragRef.current = { kind, layerId: layer.id, startMs, mouseXStart: e.clientX };
      } else {
        dragRef.current = { kind, layerId: layer.id, endMs, mouseXStart: e.clientX };
      }

      const onMove = (ev: MouseEvent) => {
        if (!dragRef.current) return;
        const dx = ev.clientX - dragRef.current.mouseXStart;
        const deltaMs = dx / pxPerMs;

        if (dragRef.current.kind === "move") {
          const newStart = clamp(dragRef.current.startMs + deltaMs, 0, totalMs - 100);
          const dur = durationMs < totalMs ? durationMs : totalMs - newStart;
          onUpdate(layer.id, { startTime: Math.round(newStart), duration: Math.round(dur) });
        } else if (dragRef.current.kind === "resize-left") {
          const newStart = clamp(dragRef.current.startMs + deltaMs, 0, endMs - 100);
          const newDur = endMs - newStart;
          onUpdate(layer.id, { startTime: Math.round(newStart), duration: Math.round(newDur) });
        } else {
          const newEnd = clamp(dragRef.current.endMs + deltaMs, startMs + 100, totalMs);
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
    [layer.id, startMs, endMs, durationMs, totalMs, pxPerMs, onSelect, onUpdate],
  );

  return (
    <div
      className="relative"
      style={{ height: 32, marginBottom: 2 }}
      title={`${layer.data.text || "Text"} | ${fmt(startMs)} → ${fmt(endMs)}`}
    >
      {/* Clickable block */}
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
        {/* Left resize handle */}
        <div
          className="absolute left-0 top-0 bottom-0 w-2 cursor-w-resize hover:bg-white/30 rounded-l"
          onMouseDown={(e) => startDrag(e, "resize-left")}
        />
        {/* Label */}
        <span className="px-3 text-[11px] text-white font-medium truncate pointer-events-none flex-1">
          {layer.data.text || "Text"}
        </span>
        {/* Right resize handle */}
        <div
          className="absolute right-0 top-0 bottom-0 w-2 cursor-e-resize hover:bg-white/30 rounded-r"
          onMouseDown={(e) => startDrag(e, "resize-right")}
        />
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
interface Props {
  layers: LayerItem[];
  selectedId?: string | null;
  onSelect: (id: string | null) => void;
  onReorder: (newOrder: LayerItem[]) => void;
  onUpdate: (id: string, updates: Partial<TextOption>) => void;
  onRemove: (id: string) => void;
  /** Duration in ms, fallback 30000 */
  videoDurationMs?: number;
  /** Current playback time in ms */
  currentTimeMs?: number;
}

const RULER_HEIGHT = 24;
const TRACK_WIDTH = 140; // label column width
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
}: Props) {
  const textLayers = layers.filter((l): l is LayerItem & { type: "text" } => l.type === "text");
  const containerRef = useRef<HTMLDivElement>(null);
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

  // Ruler ticks
  const ticksEvery = pxPerSec >= 60 ? 1 : pxPerSec >= 20 ? 2 : 5; // seconds
  const ticks: number[] = [];
  for (let s = 0; s <= videoDurationMs / 1000; s += ticksEvery) ticks.push(s);

  const moveLayer = (id: string, dir: -1 | 1) => {
    const idx = layers.findIndex((l) => l.id === id);
    if (idx === -1) return;
    const next = idx + dir;
    if (next < 0 || next >= layers.length) return;
    onReorder(arrayMove(layers, idx, next));
  };

  // Trash highlight state
  const [trashHover, setTrashHover] = useState(false);

  return (
    <div
      ref={containerRef}
      className="flex flex-col gap-1 select-none w-full h-full min-h-0"
    >
      {/* ── Top controls ── */}
      <div className="flex items-center justify-between px-2 pb-1 border-b border-border shrink-0">
        <span className="text-xs font-semibold text-foreground">Timeline</span>
        <div className="flex items-center gap-2">
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
        {/* ── Label column ── */}
        <div className="shrink-0 flex flex-col" style={{ width: TRACK_WIDTH }}>
          {/* Ruler placeholder */}
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
                "flex items-center gap-1 px-1 rounded-l cursor-pointer",
                "border-r border-border",
                selectedId === layer.id ? "bg-primary/15" : "hover:bg-muted/50",
              )}
              style={{ height: 34, marginBottom: 2 }}
              onClick={() => onSelect(layer.id)}
            >
              <Type size={12} className="shrink-0 text-muted-foreground" />
              <span className="text-[11px] truncate flex-1 font-medium">
                {layer.data.text || "Text"}
              </span>
              {/* Z-index buttons */}
              <button
                type="button"
                title="Lên trên"
                onClick={(e) => { e.stopPropagation(); moveLayer(layer.id, -1); }}
                className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
              >
                <ChevronUp size={10} />
              </button>
              <button
                type="button"
                title="Xuống dưới"
                onClick={(e) => { e.stopPropagation(); moveLayer(layer.id, 1); }}
                className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
              >
                <ChevronDown size={10} />
              </button>
              {/* Remove */}
              <button
                type="button"
                title="Xóa layer"
                onClick={(e) => { e.stopPropagation(); onRemove(layer.id); }}
                className="p-0.5 rounded hover:bg-red-500/20 text-muted-foreground hover:text-red-500"
              >
                <Trash2 size={10} />
              </button>
            </div>
          ))}
        </div>

        {/* ── Scrollable timeline area ── */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden min-w-0">
          <div style={{ width: totalPx, minWidth: "100%", position: "relative" }}>
            {/* Ruler */}
            <div
              className="relative bg-muted/40 border-b border-border"
              style={{ height: RULER_HEIGHT }}
            >
              {ticks.map((s) => (
                <div
                  key={s}
                  className="absolute top-0 flex flex-col items-start"
                  style={{ left: s * pxPerSec }}
                >
                  <div className="w-px h-3 bg-border/80" />
                  <span className="text-[9px] text-muted-foreground ml-0.5">{s}s</span>
                </div>
              ))}
              {/* Playhead */}
              <div
                className="absolute top-0 bottom-0 w-px bg-red-500 pointer-events-none"
                style={{ left: currentTimeMs * pxPerMs }}
              />
            </div>

            {/* Background grid lines */}
            {ticks.map((s) => (
              <div
                key={s}
                className="absolute top-0 bottom-0 w-px bg-border/25 pointer-events-none"
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

            {/* Playhead line over tracks */}
            <div
              className="absolute top-0 bottom-0 w-px bg-red-500/70 pointer-events-none"
              style={{ left: currentTimeMs * pxPerMs, top: RULER_HEIGHT }}
            />
          </div>
        </div>
      </div>

      {/* ── Trash zone (thay thế TrashDropZone cũ) ── */}
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
          onClick={() => { if (selectedId) onRemove(selectedId); }}
        >
          <Trash2 size={13} />
          <span className="text-xs font-medium">Xóa layer đang chọn</span>
        </div>
      )}
    </div>
  );
}