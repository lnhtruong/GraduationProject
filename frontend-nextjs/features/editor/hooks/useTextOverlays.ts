/**
 * Text Overlays Hook
 * Manages text overlays on video
 */

import { useState } from "react";
import type { TextOption, LayerItem } from "@/features/editor/types";

export function useTextOverlays() {
    // const [textOverlays, setTextOverlays] = useState<TextOption[]>([]);

    const [layers, setLayers] = useState<LayerItem[]>([]);

    const handleAddText = (text: TextOption) => {
        setLayers((prev) => [
            {
                id: text.id,
                type: "text",
                data: text,
            },
            ...prev,
        ]);
    };

    const handleUpdateText = (id: string, updates: Partial<TextOption>) => {
        setLayers((prev) =>
            prev.map((layer) =>
                layer.type === "text" && layer.id === id
                    ? { ...layer, data: { ...layer.data, ...updates } }
                    : layer
            )
        );
    };

    const handleRemoveText = (id: string) => {
        setLayers((prev) => prev.filter((layer) => layer.id !== id));
    };

    const handleReorderText = (newOrder: LayerItem[]) => {
        setLayers(newOrder);
    };




    return {
    layers,
        handleAddText,
        handleUpdateText,
        handleRemoveText,
        handleReorderText

  } as const;
}
