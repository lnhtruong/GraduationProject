"use client";

//Panel hiển thị danh sách các layer, cho phép sort để thay đổi z-index
import {
  SortableContext,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import LayerRow from "./LayerItem";
import type { LayerItem } from "@/features/videoEditor/types";

interface Props {
  layers: LayerItem[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  orientation?: "vertical" | "horizontal";
}

export default function LayersPanel({
  layers,
  selectedId,
  onSelect,
  orientation = "vertical",
}: Props) {
  const isHorizontal = orientation === "horizontal";

  return (
    <div className="space-y-2 min-w-0">
      <div className="text-sm font-semibold">
        {isHorizontal ? "Timeline Layers" : "Layers"}
      </div>

      {isHorizontal && (
        <div className="h-5 rounded bg-muted/40 px-2 text-[10px] text-muted-foreground flex items-center justify-between">
          <span>0s</span>
          <span>5s</span>
          <span>10s</span>
          <span>15s</span>
          <span>20s</span>
        </div>
      )}

      {layers.length === 0 ? (
        <div
          className={
            isHorizontal
              ? "h-10 rounded border border-dashed border-border/80 bg-muted/20 px-3 text-xs text-muted-foreground flex items-center"
              : "text-xs text-muted-foreground"
          }
        >
          No text layers
        </div>
      ) : null}

      <SortableContext
        items={layers.map((l) => l.id)}
        strategy={
          orientation === "horizontal"
            ? horizontalListSortingStrategy
            : verticalListSortingStrategy
        }
      >
        <div
          className={
            isHorizontal ? "flex gap-2 overflow-x-auto pb-1" : "space-y-1"
          }
        >
          {layers.map((layer) => (
            <LayerRow
              key={layer.id}
              layer={layer}
              selected={selectedId === layer.id}
              onSelect={() => onSelect?.(layer.id)}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
