import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

interface Props {
  id: string;
  left: number; // % (0-100)
  top: number; // % (0-100)
  children: React.ReactNode;
  isSelected?: boolean;
  onClick?: () => void;
}

export function DraggableItem({
  id,
  left,
  top,
  children,
  isSelected,
  onClick,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: id,
    });

  const style: React.CSSProperties = {
    position: "absolute",
    left: `${left}%`,
    top: `${top}%`,
    transform: CSS.Translate.toString(transform),
    cursor: isDragging ? "grabbing" : "grab",
    zIndex: isSelected ? 50 : 10,
    border: isSelected ? "2px solid #3b82f6" : "2px solid transparent",
    transition: isDragging ? "none" : "border-color 0.2s",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      {children}
    </div>
  );
}
