/**
 * Text Overlays Hook
 * Manages text overlays on video
 */

import { useState } from "react";
import type { TextOption, LayerItem } from "@/features/videoEditor/types";

export function useTextOverlays() {
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

    const handleUpdateText = (id: string, updates: Partial<TextOption> | TextOption) => {
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

    return {
    layers,
        handleAddText,
        handleUpdateText,
        handleRemoveText,

  } as const;
}
