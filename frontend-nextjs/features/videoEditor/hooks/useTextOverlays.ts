/**
 * Text Overlays Hook
 * Manages text overlays on video
 */

import { useState } from "react";
import type { TextOption } from "@/features/videoEditor/types";

export function useTextOverlays() {
  const [textOverlays, setTextOverlays] = useState<TextOption[]>([]);

  const addTextOverlay = (text: TextOption) => {
    console.log("Adding text overlay:", text);
    setTextOverlays((prev) => [...prev, text]);
  };

  const updateTextOverlay = (
    id: string,
    updates: Partial<TextOption> | TextOption
  ) => {
    console.log("Updating text overlay:", id, updates);
    setTextOverlays((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const removeTextOverlay = (id: string) => {
    console.log("Removing text overlay:", id);
    setTextOverlays((prev) => prev.filter((t) => t.id !== id));
  };

  return {
    textOverlays,
    addTextOverlay,
    updateTextOverlay,
    removeTextOverlay,
  } as const;
}
