"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import { ChevronDown, ChevronUp, Trash2, Type } from "lucide-react";
import type { LayerItem, TextOption } from "@/features/editor/types";
import { cn } from "@/lib/utils";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const formatTime = (ms: number) => {
  const seconds = ms / 1000;
  const minutes = Math.floor(seconds / 60);
  const rest = (seconds % 60).toFixed(1);
  return `${minutes}:${rest.padStart(4, "0")}`;
};

type DragTarget =
  | { kind: "move"; layerId: string; startMs: number; pointerXStart: number }
  | {
      kind: "resize-left";
      layerId: string;
      startMs: number;
      pointerXStart: number;
    }
  | {
      kind: "resize-right";
      layerId: string;
      endMs: number;
      pointerXStart: number;
    };

function TimelineTrack({
  layer,
  selected,
  totalMs,
  pxPerMs,
  onSelect,
  onUpdate,
}: {
  layer: LayerItem & { type: "text" };
  selected: boolean;
  totalMs: number;
  pxPerMs: number;
  onSelect: () => void;
  onUpdate: (id: string, updates: Partial<TextOption>) => void;
}) {
  const startMs = layer.data.startTime ?? 0;
  const durationMs =
    layer.data.duration && layer.data.duration > 0
      ? layer.data.duration
      : totalMs;
  const endMs = Math.min(startMs + durationMs, totalMs);
  const left = startMs * pxPerMs;
  const width = Math.max(24, (endMs - startMs) * pxPerMs);
  const dragRef = useRef<DragTarget | null>(null);

  const startDrag = useCallback(
    (event: React.PointerEvent, kind: DragTarget["kind"]) => {
      event.stopPropagation();
      event.preventDefault();
      onSelect();

      if (kind === "move") {
        dragRef.current = {
          kind,
          layerId: layer.id,
          startMs,
          pointerXStart: event.clientX,
        };
      } else if (kind === "resize-left") {
        dragRef.current = {
          kind,
          layerId: layer.id,
          startMs,
          pointerXStart: event.clientX,
        };
      } else {
        dragRef.current = {
          kind,
          layerId: layer.id,
          endMs,
          pointerXStart: event.clientX,
        };
      }

      const onMove = (moveEvent: PointerEvent) => {
        if (!dragRef.current) return;
        moveEvent.preventDefault();

        const deltaMs =
          (moveEvent.clientX - dragRef.current.pointerXStart) / pxPerMs;

        if (dragRef.current.kind === "move") {
          const newStart = clamp(
            dragRef.current.startMs + deltaMs,
            0,
            Math.max(0, totalMs - 100),
          );
          const duration = durationMs < totalMs ? durationMs : totalMs - newStart;
          onUpdate(layer.id, {
            startTime: Math.round(newStart),
            duration: Math.round(duration),
          });
          return;
        }

        if (dragRef.current.kind === "resize-left") {
          const newStart = clamp(
            dragRef.current.startMs + deltaMs,
            0,
            Math.max(0, endMs - 100),
          );
          onUpdate(layer.id, {
            startTime: Math.round(newStart),
            duration: Math.round(endMs - newStart),
          });
          return;
        }

        const newEnd = clamp(
          dragRef.current.endMs + deltaMs,
          startMs + 100,
          totalMs,
        );
        onUpdate(layer.id, { duration: Math.round(newEnd - startMs) });
      };

      const onUp = () => {
        dragRef.current = null;
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
      };

      window.addEventListener("pointermove", onMove, { passive: false });
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [durationMs, endMs, layer.id, onSelect, onUpdate, pxPerMs, startMs, totalMs],
  );

  return (
    <div className="relative mb-1 h-11 sm:h-8">
      <div
        className={cn(
          "absolute bottom-1 top-1 flex touch-none select-none items-center rounded-xl border bg-blue-500/80",
          selected ? "border-blue-300 shadow-md" : "border-blue-700/50",
        )}
        style={{ left, width }}
        onPointerDown={(event) => startDrag(event, "move")}
        onClick={onSelect}
      >
        <div
          className="absolute bottom-0 left-0 top-0 w-6 cursor-w-resize rounded-l-xl hover:bg-white/30 sm:w-3"
          onPointerDown={(event) => startDrag(event, "resize-left")}
        />
        <span className="pointer-events-none flex-1 truncate px-4 text-xs font-medium text-white sm:px-3 sm:text-[11px]">
          {layer.data.text || "Text"}
        </span>
        <div
          className="absolute bottom-0 right-0 top-0 w-6 cursor-e-resize rounded-r-xl hover:bg-white/30 sm:w-3"
          onPointerDown={(event) => startDrag(event, "resize-right")}
        />
      </div>
    </div>
  );
}

interface Props {
  layers: LayerItem[];
  selectedId?: string | null;
  onSelect: (id: string | null) => void;
  onReorder: (newOrder: LayerItem[]) => void;
  onUpdate: (id: string, updates: Partial<TextOption>) => void;
  onRemove: (id: string) => void;
  videoDurationMs?: number;
  currentTimeMs?: number;
  onSeek?: (ms: number) => void;
}

const RULER_HEIGHT = 28;
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
    (layer): layer is LayerItem & { type: "text" } => layer.type === "text",
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const playheadDragging = useRef(false);
  const [containerWidth, setContainerWidth] = useState(600);
  const [pxPerSec, setPxPerSec] = useState(40);
  const [trashHover, setTrashHover] = useState(false);

  useEffect(() => {
    const target = containerRef.current;
    if (!target) return;

    const observer = new ResizeObserver(([entry]) => {
      setContainerWidth(Math.max(240, entry.contentRect.width - TRACK_WIDTH - 16));
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  const pxPerMs = pxPerSec / 1000;
  const totalPx = Math.max(containerWidth, (videoDurationMs / 1000) * pxPerSec);
  const ticksEvery = pxPerSec >= 60 ? 1 : pxPerSec >= 20 ? 2 : 5;
  const ticks: number[] = [];
  for (let second = 0; second <= videoDurationMs / 1000; second += ticksEvery) {
    ticks.push(second);
  }

  const moveLayer = (id: string, direction: -1 | 1) => {
    const currentIndex = layers.findIndex((layer) => layer.id === id);
    if (currentIndex === -1) return;

    const nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= layers.length) return;
    onReorder(arrayMove(layers, currentIndex, nextIndex));
  };

  const seekFromPointerX = useCallback(
    (clientX: number) => {
      if (!scrollAreaRef.current) return;
      const rect = scrollAreaRef.current.getBoundingClientRect();
      const scrollLeft = scrollAreaRef.current.scrollLeft;
      const relX = clientX - rect.left + scrollLeft;
      const nextMs = clamp(relX / pxPerMs, 0, videoDurationMs);
      onSeek?.(nextMs);
    },
    [onSeek, pxPerMs, videoDurationMs],
  );

  const handlePlayheadPointerDown = (event: React.PointerEvent) => {
    event.preventDefault();
    event.stopPropagation();
    playheadDragging.current = true;
    seekFromPointerX(event.clientX);

    const onMove = (moveEvent: PointerEvent) => {
      if (!playheadDragging.current) return;
      moveEvent.preventDefault();
      seekFromPointerX(moveEvent.clientX);
    };
    const onUp = () => {
      playheadDragging.current = false;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };

    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };

  const playheadLeft = currentTimeMs * pxPerMs;

  return (
    <div
      ref={containerRef}
      className="flex h-full min-h-0 w-full select-none flex-col gap-1"
    >
      <div className="flex shrink-0 flex-col gap-2 border-b border-border px-2 pb-2 sm:flex-row sm:items-center sm:justify-between sm:pb-1">
        <span className="text-xs font-semibold">Dòng thời gian</span>
        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <span className="text-[10px] text-muted-foreground">
            {formatTime(currentTimeMs)} / {formatTime(videoDurationMs)}
          </span>
          <span className="hidden text-[10px] text-muted-foreground sm:inline">
            Thu phóng
          </span>
          <input
            type="range"
            min={MIN_PX_PER_SEC}
            max={MAX_PX_PER_SEC}
            value={pxPerSec}
            onChange={(event) => setPxPerSec(Number(event.target.value))}
            className="h-5 w-28 accent-primary sm:h-1 sm:w-20"
          />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="flex shrink-0 flex-col" style={{ width: TRACK_WIDTH }}>
          <div style={{ height: RULER_HEIGHT }} />
          {textLayers.length === 0 ? (
            <div className="flex h-11 items-center px-2 text-[11px] text-muted-foreground sm:h-8">
              Chưa có layer
            </div>
          ) : null}
          {textLayers.map((layer) => (
            <div
              key={layer.id}
              className={cn(
                "mb-1 flex h-11 cursor-pointer items-center gap-1 rounded-l border-r border-border px-1 sm:h-8",
                selectedId === layer.id ? "bg-primary/15" : "hover:bg-muted/50",
              )}
              onClick={() => onSelect(layer.id)}
            >
              <Type size={12} className="shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate text-[11px] font-medium">
                {layer.data.text || "Text"}
              </span>
              <button
                type="button"
                title="Lên trên"
                onClick={(event) => {
                  event.stopPropagation();
                  moveLayer(layer.id, -1);
                }}
                className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground sm:p-0.5"
              >
                <ChevronUp size={10} />
              </button>
              <button
                type="button"
                title="Xuống dưới"
                onClick={(event) => {
                  event.stopPropagation();
                  moveLayer(layer.id, 1);
                }}
                className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground sm:p-0.5"
              >
                <ChevronDown size={10} />
              </button>
              <button
                type="button"
                title="Xóa layer"
                onClick={(event) => {
                  event.stopPropagation();
                  onRemove(layer.id);
                }}
                className="rounded p-1.5 text-muted-foreground hover:bg-red-500/20 hover:text-red-500 sm:p-0.5"
              >
                <Trash2 size={10} />
              </button>
            </div>
          ))}
        </div>

        <div
          ref={scrollAreaRef}
          className="relative min-w-0 flex-1 overflow-x-auto overflow-y-hidden overscroll-x-contain"
        >
          <div
            className="relative"
            style={{ width: totalPx, minWidth: "100%" }}
          >
            <div
              className="relative cursor-pointer border-b border-border bg-muted/40"
              style={{ height: RULER_HEIGHT }}
              onPointerDown={handlePlayheadPointerDown}
            >
              {ticks.map((second) => (
                <div
                  key={second}
                  className="absolute top-0 flex flex-col items-start"
                  style={{ left: second * pxPerSec }}
                >
                  <div className="h-3 w-px bg-border/80" />
                  <span className="ml-0.5 text-[9px] text-muted-foreground">
                    {second}s
                  </span>
                </div>
              ))}
            </div>

            {ticks.map((second) => (
              <div
                key={second}
                className="pointer-events-none absolute bottom-0 w-px bg-border/25"
                style={{ left: second * pxPerSec, top: RULER_HEIGHT }}
              />
            ))}

            <div className="relative pt-1">
              {textLayers.map((layer) => (
                <TimelineTrack
                  key={layer.id}
                  layer={layer}
                  selected={selectedId === layer.id}
                  totalMs={videoDurationMs}
                  pxPerMs={pxPerMs}
                  onSelect={() => onSelect(layer.id)}
                  onUpdate={onUpdate}
                />
              ))}
            </div>

            <div
              className="pointer-events-none absolute bottom-0 top-0"
              style={{ left: playheadLeft }}
            >
              <div className="absolute bottom-0 left-0 top-0 w-px bg-red-500/80" />
              <div
                className="pointer-events-auto absolute flex touch-none cursor-ew-resize flex-col items-center"
                style={{ top: 0, left: -12, width: 25 }}
                onPointerDown={handlePlayheadPointerDown}
                title={formatTime(currentTimeMs)}
              >
                <div
                  className="h-4 w-4 rotate-45 rounded-sm bg-red-500 shadow-md sm:h-3 sm:w-3"
                  style={{ marginTop: 2 }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedId ? (
        <div
          className={cn(
            "mx-2 mb-1 flex h-11 cursor-pointer items-center justify-center gap-2 rounded border border-dashed transition-colors sm:h-8",
            trashHover
              ? "border-red-400 bg-red-500 text-white"
              : "border-red-300/50 text-red-400 hover:border-red-400 hover:bg-red-500/10",
          )}
          onMouseEnter={() => setTrashHover(true)}
          onMouseLeave={() => setTrashHover(false)}
          onClick={() => onRemove(selectedId)}
        >
          <Trash2 size={13} />
          <span className="text-xs font-medium">Xóa layer đang chọn</span>
        </div>
      ) : null}
    </div>
  );
}
