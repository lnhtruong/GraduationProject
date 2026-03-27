import type {
  MascotOption,
  MascotPreviewPlacement,
  VideoFrameSize,
} from "@/features/videoEditor/types";

const BASE_WIDTH_RATIO = 0.2;
const MIN_SCALE = 0.1;
const MAX_SCALE = 2.0;
const DEFAULT_SNAP_THRESHOLD_PX = 24;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export function normalizeMascotScale(scale: number) {
  return clamp(scale, MIN_SCALE, MAX_SCALE);
}

export function getMascotDisplaySize(
  frame: VideoFrameSize,
  scale: number,
  aspectRatio: number,
) {
  const normalizedScale = normalizeMascotScale(scale);
  const safeAspectRatio = aspectRatio > 0 ? aspectRatio : 1;
  const width = frame.width * BASE_WIDTH_RATIO * normalizedScale;
  const height = width / safeAspectRatio;

  return {
    width,
    height,
    widthPct: (width / frame.width) * 100,
    heightPct: (height / frame.height) * 100,
  };
}

export function deriveScaleFromDisplayWidth(
  frame: VideoFrameSize,
  displayWidth: number,
) {
  if (!frame.width) {
    return MIN_SCALE;
  }

  const rawScale = displayWidth / (frame.width * BASE_WIDTH_RATIO);
  return normalizeMascotScale(rawScale);
}

export function clampPreviewPlacement(
  placement: MascotPreviewPlacement,
  frame: VideoFrameSize,
  scale: number,
) {
  const size = getMascotDisplaySize(frame, scale, placement.aspectRatio);
  const maxXPct = Math.max(0, 100 - size.widthPct);
  const maxYPct = Math.max(0, 100 - size.heightPct);

  return {
    ...placement,
    xPct: clamp(placement.xPct, 0, maxXPct),
    yPct: clamp(placement.yPct, 0, maxYPct),
  };
}

export function createDefaultPreviewPlacement(
  mascot: MascotOption,
  frame: VideoFrameSize,
  aspectRatio: number,
): MascotPreviewPlacement {
  const safeAspectRatio = aspectRatio > 0 ? aspectRatio : 1;
  const size = getMascotDisplaySize(frame, mascot.scale, safeAspectRatio);

  let xPct = 100 - size.widthPct - 5;
  let yPct = 100 - size.heightPct - 5;

  if (mascot.position === "top-left") {
    xPct = (mascot.margin_x / frame.width) * 100;
    yPct = (mascot.margin_y / frame.height) * 100;
  } else if (mascot.position === "top-right") {
    xPct = ((frame.width - size.width - mascot.margin_x) / frame.width) * 100;
    yPct = (mascot.margin_y / frame.height) * 100;
  } else if (mascot.position === "bottom-left") {
    xPct = (mascot.margin_x / frame.width) * 100;
    yPct =
      ((frame.height - size.height - mascot.margin_y) / frame.height) * 100;
  } else if (mascot.position === "bottom-right") {
    xPct = ((frame.width - size.width - mascot.margin_x) / frame.width) * 100;
    yPct =
      ((frame.height - size.height - mascot.margin_y) / frame.height) * 100;
  }

  return clampPreviewPlacement(
    {
      xPct,
      yPct,
      aspectRatio: safeAspectRatio,
      hasPlaced: false,
    },
    frame,
    mascot.scale,
  );
}

export function deriveBackendMascotFromPreview(
  mascot: MascotOption,
  frame: VideoFrameSize,
): MascotOption {
  if (mascot.type === "none" || mascot.position === "replace") {
    return mascot;
  }

  const placement = mascot.previewPlacement;
  if (!placement) {
    return mascot;
  }

  const normalizedPlacement = clampPreviewPlacement(placement, frame, mascot.scale);
  const size = getMascotDisplaySize(
    frame,
    mascot.scale,
    normalizedPlacement.aspectRatio,
  );

  const left = (normalizedPlacement.xPct / 100) * frame.width;
  const top = (normalizedPlacement.yPct / 100) * frame.height;
  const right = Math.max(0, frame.width - left - size.width);
  const bottom = Math.max(0, frame.height - top - size.height);

  const candidates = [
    {
      position: "top-left" as const,
      margin_x: Math.round(Math.max(0, left)),
      margin_y: Math.round(Math.max(0, top)),
      score: Math.max(0, left) + Math.max(0, top),
    },
    {
      position: "top-right" as const,
      margin_x: Math.round(right),
      margin_y: Math.round(Math.max(0, top)),
      score: right + Math.max(0, top),
    },
    {
      position: "bottom-left" as const,
      margin_x: Math.round(Math.max(0, left)),
      margin_y: Math.round(bottom),
      score: Math.max(0, left) + bottom,
    },
    {
      position: "bottom-right" as const,
      margin_x: Math.round(right),
      margin_y: Math.round(bottom),
      score: right + bottom,
    },
  ];

  const best = candidates.reduce((winner, current) =>
    current.score < winner.score ? current : winner,
  );

  return {
    ...mascot,
    position: best.position,
    margin_x: best.margin_x,
    margin_y: best.margin_y,
    previewPlacement: normalizedPlacement,
    scale: normalizeMascotScale(mascot.scale),
  };
}

export function applyCornerSnap(
  placement: MascotPreviewPlacement,
  frame: VideoFrameSize,
  scale: number,
  thresholdPx = DEFAULT_SNAP_THRESHOLD_PX,
) {
  const normalized = clampPreviewPlacement(placement, frame, scale);
  const size = getMascotDisplaySize(frame, scale, normalized.aspectRatio);
  const left = (normalized.xPct / 100) * frame.width;
  const top = (normalized.yPct / 100) * frame.height;
  const right = frame.width - left - size.width;
  const bottom = frame.height - top - size.height;

  const nearLeft = left <= thresholdPx;
  const nearRight = right <= thresholdPx;
  const nearTop = top <= thresholdPx;
  const nearBottom = bottom <= thresholdPx;

  let xPct = normalized.xPct;
  let yPct = normalized.yPct;
  let snappedCorner:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | null = null;

  if (nearLeft && nearTop) {
    xPct = 0;
    yPct = 0;
    snappedCorner = "top-left";
  } else if (nearRight && nearTop) {
    xPct = 100 - size.widthPct;
    yPct = 0;
    snappedCorner = "top-right";
  } else if (nearLeft && nearBottom) {
    xPct = 0;
    yPct = 100 - size.heightPct;
    snappedCorner = "bottom-left";
  } else if (nearRight && nearBottom) {
    xPct = 100 - size.widthPct;
    yPct = 100 - size.heightPct;
    snappedCorner = "bottom-right";
  }

  return {
    snappedPlacement: clampPreviewPlacement(
      {
        ...normalized,
        xPct,
        yPct,
      },
      frame,
      scale,
    ),
    snappedCorner,
    guides: {
      nearLeft,
      nearRight,
      nearTop,
      nearBottom,
    },
  };
}
