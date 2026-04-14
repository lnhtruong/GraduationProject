/**
 * Video Effects Hook
 * Manages brightness, contrast, saturation, hue, and filters
 */

import { useState } from "react";
import type { EffectOption } from "@/features/editor/types";

export function useVideoEffects() {
  const [effect, setEffect] = useState<EffectOption>({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    hue: 0,
    filter: "none",
  });

  const cssFilter = () => {
    const { brightness, contrast, saturation, hue } = effect;
    return `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) hue-rotate(${hue}deg)`;
  };

  return {
    effect,
    setEffect,
    cssFilter,
  } as const;
}
