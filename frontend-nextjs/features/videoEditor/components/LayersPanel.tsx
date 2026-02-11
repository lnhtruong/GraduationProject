"use client";

import {TextLayer, TextOption} from "@/features/videoEditor/types";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import LayerRow from "./LayerItem";
import type { LayerItem } from "@/features/videoEditor/types";


interface Props {
    layers: LayerItem[];
    selectedId?: string | null;
    onSelect?: (id: string) => void;
}


export default function LayersPanel({
                                        layers,
                                        selectedId,
                                        onSelect,
                                    }: Props) {
    return (
        <div className="space-y-2">
            <div className="text-sm font-semibold">Layers</div>

            {layers.length === 0 && (
                <div className="text-xs text-muted-foreground">
                    No text layers
                </div>
            )}

            <SortableContext
                items={layers.map((l) => l.id)}
                strategy={verticalListSortingStrategy}
            >
                <div className="space-y-1">
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
