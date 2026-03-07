"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { LayerItem } from "@/features/videoEditor/types";
import clsx from "clsx";

interface Props {
    layer: LayerItem;
    selected?: boolean;
    onSelect?: () => void;
}

export default function LayerRow({ layer, selected, onSelect }: Props) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({
        id: layer.id,
        data: {
            source: "panel", //để phần biệt trong panel hay trong màn hình review do dùng chung id
            layerId: layer.id,
        },
    });


    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const renderLabel = () => {
        switch (layer.type) {
            case "text":
                return layer.data.text || "Empty text";

            case "mascot":
                return "Mascot Layer";

            default:
                return "Layer";
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={onSelect}
            className={clsx(
                "px-2 py-1 rounded border text-sm cursor-grab",
                selected
                    ? "bg-primary text-primary-foreground"
                    : "bg-background hover:bg-muted"
            )}
        >
            {renderLabel()}
        </div>
    );
}
