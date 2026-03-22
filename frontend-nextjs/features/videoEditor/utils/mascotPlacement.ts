import type { MascotOption } from "@/features/videoEditor/types";
import {
  loadImageMetadata,
  loadVideoMetadata,
} from "@/features/_shared/utils/validation";

type CornerPosition = Exclude<MascotOption["position"], "replace">;

interface PlacementInput {
  xPercent: number;
  yPercent: number;
  widthPercent: number;
}

interface BackendMascotParams {
  position: MascotOption["position"];
  margin_x: number;
  margin_y: number;
  scale: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function nearestCorner(
  x: number,
  y: number,
  width: number,
  height: number,
  canvasWidth: number,
  canvasHeight: number,
): { position: CornerPosition; margin_x: number; margin_y: number } {
  const candidates: Array<{
    position: CornerPosition;
    margin_x: number;
    margin_y: number;
  }> = [
    { position: "top-left", margin_x: x, margin_y: y },
    {
      position: "top-right",
      margin_x: canvasWidth - (x + width),
      margin_y: y,
    },
    {
      position: "bottom-left",
      margin_x: x,
      margin_y: canvasHeight - (y + height),
    },
    {
      position: "bottom-right",
      margin_x: canvasWidth - (x + width),
      margin_y: canvasHeight - (y + height),
    },
  ];

  candidates.forEach((candidate) => {
    candidate.margin_x = clamp(candidate.margin_x, 0, canvasWidth);
    candidate.margin_y = clamp(candidate.margin_y, 0, canvasHeight);
  });

  return candidates.reduce((best, candidate) => {
    const bestDistance = Math.hypot(best.margin_x, best.margin_y);
    const nextDistance = Math.hypot(candidate.margin_x, candidate.margin_y);
    return nextDistance < bestDistance ? candidate : best;
  });
}

export async function convertPlacementToBackendParams(
  mascot: MascotOption,
  videoSource: File | string,
): Promise<BackendMascotParams> {
  if (mascot.position === "replace") {
    return {
      position: "replace",
      margin_x: 0,
      margin_y: 0,
      scale: mascot.scale,
    };
  }

  if (!mascot.uiPlacement) {
    return {
      position: mascot.position,
      margin_x: mascot.margin_x,
      margin_y: mascot.margin_y,
      scale: mascot.scale,
    };
  }

  const imageSource = mascot.type === "preset" ? mascot.presetUrl : mascot.customFile;
  if (!imageSource) {
    return {
      position: mascot.position,
      margin_x: mascot.margin_x,
      margin_y: mascot.margin_y,
      scale: mascot.scale,
    };
  }

  const [videoMeta, imageMeta] = await Promise.all([
    loadVideoMetadata(videoSource),
    loadImageMetadata(imageSource),
  ]);

  const widthPx = (mascot.uiPlacement.widthPercent / 100) * videoMeta.width;
  const computedScale = clamp(widthPx / imageMeta.width, 0.1, 2);
  const heightPx = imageMeta.height * computedScale;

  const centerX = (mascot.uiPlacement.xPercent / 100) * videoMeta.width;
  const centerY = (mascot.uiPlacement.yPercent / 100) * videoMeta.height;

  const maxX = Math.max(0, videoMeta.width - widthPx);
  const maxY = Math.max(0, videoMeta.height - heightPx);

  const x = clamp(centerX - widthPx / 2, 0, maxX);
  const y = clamp(centerY - heightPx / 2, 0, maxY);

  const nearest = nearestCorner(
    x,
    y,
    widthPx,
    heightPx,
    videoMeta.width,
    videoMeta.height,
  );

  return {
    position: nearest.position,
    margin_x: Math.round(nearest.margin_x),
    margin_y: Math.round(nearest.margin_y),
    scale: Number(computedScale.toFixed(3)),
  };
}
