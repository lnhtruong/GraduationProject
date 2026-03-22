import { useDroppable } from "@dnd-kit/core";
import { useDndContext } from "@dnd-kit/core";
import { Trash2 } from "lucide-react";

export default function TrashDropZone() {
    const { active } = useDndContext();
    const { setNodeRef, isOver } = useDroppable({
        id: "trash",
    });

    if (!active) {
        return null;
    }

    return (
        <div
            ref={setNodeRef}
            className={`
        fixed bottom-6 left-1/2 -translate-x-1/2
        w-32 h-16 rounded-xl
        flex items-center justify-center
        transition-all duration-200
        ${isOver ? "bg-red-500 scale-110" : "bg-red-400/80"}
        text-white shadow-lg
      `}
        >
            <Trash2 className="w-6 h-6" />
        </div>
    );
}
