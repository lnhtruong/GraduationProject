/**
 * Text Overlays Hook
 * Manages text overlays on video
 */

import { useState } from "react";
import type { TextOption, LayerItem } from "@/features/videoEditor/types";

export function useTextOverlays() {
    // const [textOverlays, setTextOverlays] = useState<TextOption[]>([]);

    const [layers, setLayers] = useState<LayerItem[]>([]);

    const handleAddText = (text: TextOption) => {
        console.log("Adding text overlay:", text);
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
        console.log("Updating text overlay:", id, updates);
        setLayers((prev) =>
            prev.map((layer) =>
                layer.type === "text" && layer.id === id
                    ? { ...layer, data: { ...layer.data, ...updates } }
                    : layer
            )
        );
    };

    const handleRemoveText = (id: string) => {
        console.log("Removing text overlay:", id);
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
