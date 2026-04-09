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

const getScale = (frame: VideoFrameSize) => {
  const safeScaleX =
    frame.scaleX && frame.scaleX > 0
      ? frame.scaleX
      : frame.displayWidth && frame.displayWidth > 0
        ? frame.displayWidth / Math.max(frame.width, 1)
        : 1;
  const safeScaleY =
    frame.scaleY && frame.scaleY > 0
      ? frame.scaleY
      : frame.displayHeight && frame.displayHeight > 0
        ? frame.displayHeight / Math.max(frame.height, 1)
        : safeScaleX;

  return {
    scaleX: safeScaleX,
    scaleY: safeScaleY,
  };
};

export function normalizeMascotScale(scale: number) {
  return clamp(scale, MIN_SCALE, MAX_SCALE);
}

export function getMascotDisplaySize(
  frame: VideoFrameSize,
  scale: number,
  aspectRatio: number,
  sourceWidth?: number,
  sourceHeight?: number,
) {
  const normalizedScale = normalizeMascotScale(scale);
  const safeAspectRatio =
    aspectRatio > 0
      ? aspectRatio
      : typeof sourceWidth === "number" &&
          typeof sourceHeight === "number" &&
          sourceWidth > 0 &&
          sourceHeight > 0
        ? sourceWidth / sourceHeight
        : 1;

  const baseWidth = frame.width * BASE_WIDTH_RATIO * normalizedScale;
  const baseHeight = baseWidth / safeAspectRatio;

  const { scaleX, scaleY } = getScale(frame);
  const width = baseWidth * scaleX;
  const height = baseHeight * scaleY;

  return {
    baseWidth,
    baseHeight,
    width,
    height,
    widthPct: (baseWidth / frame.width) * 100,
    heightPct: (baseHeight / frame.height) * 100,
  };
}

export function deriveScaleFromDisplayWidth(
  frame: VideoFrameSize,
  displayWidth: number,
  sourceWidth?: number,
) {
  void sourceWidth;

  if (!frame.width || displayWidth <= 0) {
    return MIN_SCALE;
  }

  const { scaleX } = getScale(frame);
  const baseWidth = displayWidth / Math.max(scaleX, 0.0001);
  // Keep inverse mapping consistent with getMascotDisplaySize:
  // baseWidth = frame.width * BASE_WIDTH_RATIO * scale
  const rawScale = baseWidth / Math.max(frame.width * BASE_WIDTH_RATIO, 1);
  return normalizeMascotScale(rawScale);
}

export function clampPreviewPlacement(
  placement: MascotPreviewPlacement,
  frame: VideoFrameSize,
  scale: number,
  sourceWidth?: number,
  sourceHeight?: number,
) {
  const size = getMascotDisplaySize(
    frame,
    scale,
    placement.aspectRatio,
    sourceWidth,
    sourceHeight,
  );
  const maxX = Math.max(0, frame.width - size.baseWidth);
  const maxY = Math.max(0, frame.height - size.baseHeight);

  return {
    ...placement,
    x: Math.round(clamp(placement.x, 0, maxX)),
    y: Math.round(clamp(placement.y, 0, maxY)),
  };
}

export function createDefaultPreviewPlacement(
  mascot: MascotOption,
  frame: VideoFrameSize,
  aspectRatio: number,
): MascotPreviewPlacement {
  const safeAspectRatio = aspectRatio > 0 ? aspectRatio : 1;
  const size = getMascotDisplaySize(
    frame,
    mascot.scale,
    safeAspectRatio,
    mascot.sourceWidth,
    mascot.sourceHeight,
  );

  let x = Math.max(0, frame.width - size.baseWidth - 40);
  let y = Math.max(0, frame.height - size.baseHeight - 40);

  if (mascot.position === "top-left") {
    x = mascot.margin_x;
    y = mascot.margin_y;
  } else if (mascot.position === "top-right") {
    x = frame.width - size.baseWidth - mascot.margin_x;
    y = mascot.margin_y;
  } else if (mascot.position === "bottom-left") {
    x = mascot.margin_x;
    y = frame.height - size.baseHeight - mascot.margin_y;
  } else if (mascot.position === "bottom-right") {
    x = frame.width - size.baseWidth - mascot.margin_x;
    y = frame.height - size.baseHeight - mascot.margin_y;
  }

  return clampPreviewPlacement(
    {
      x,
      y,
      aspectRatio: safeAspectRatio,
      hasPlaced: false,
    },
    frame,
    mascot.scale,
    mascot.sourceWidth,
    mascot.sourceHeight,
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

  const normalizedPlacement = clampPreviewPlacement(
    placement,
    frame,
    mascot.scale,
    mascot.sourceWidth,
    mascot.sourceHeight,
  );
  const size = getMascotDisplaySize(
    frame,
    mascot.scale,
    normalizedPlacement.aspectRatio,
    mascot.sourceWidth,
    mascot.sourceHeight,
  );

  const left = normalizedPlacement.x;
  const top = normalizedPlacement.y;
  const right = Math.max(0, frame.width - left - size.baseWidth);
  const bottom = Math.max(0, frame.height - top - size.baseHeight);

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
    scale: deriveBackendScaleFromPreview(mascot, frame),
  };
}

export function deriveBackendScaleFromPreview(
  mascot: MascotOption,
  frame: VideoFrameSize,
) {
  const aspectRatio = mascot.previewPlacement?.aspectRatio ?? 1;
  const currentSize = getMascotDisplaySize(
    frame,
    mascot.scale,
    aspectRatio,
    mascot.sourceWidth,
    mascot.sourceHeight,
  );

  // Backend interprets scale relative to mascot source image dimensions.
  // Convert current preview base width back to that backend scale space.
  if (typeof mascot.sourceWidth === "number" && mascot.sourceWidth > 0) {
    const backendScale = currentSize.baseWidth / mascot.sourceWidth;
    return normalizeMascotScale(backendScale);
  }

  return deriveScaleFromDisplayWidth(
    frame,
    currentSize.width,
    mascot.sourceWidth,
  );
}

export function applyCornerSnap(
  placement: MascotPreviewPlacement,
  frame: VideoFrameSize,
  scale: number,
  sourceWidth?: number,
  sourceHeight?: number,
  thresholdPx = DEFAULT_SNAP_THRESHOLD_PX,
) {
  const normalized = clampPreviewPlacement(
    placement,
    frame,
    scale,
    sourceWidth,
    sourceHeight,
  );
  const size = getMascotDisplaySize(
    frame,
    scale,
    normalized.aspectRatio,
    sourceWidth,
    sourceHeight,
  );
  const left = normalized.x;
  const top = normalized.y;
  const right = frame.width - left - size.baseWidth;
  const bottom = frame.height - top - size.baseHeight;

  const nearLeft = left <= thresholdPx;
  const nearRight = right <= thresholdPx;
  const nearTop = top <= thresholdPx;
  const nearBottom = bottom <= thresholdPx;

  let x = normalized.x;
  let y = normalized.y;
  let snappedCorner:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | null = null;

  if (nearLeft && nearTop) {
    x = 0;
    y = 0;
    snappedCorner = "top-left";
  } else if (nearRight && nearTop) {
    x = Math.max(0, frame.width - size.baseWidth);
    y = 0;
    snappedCorner = "top-right";
  } else if (nearLeft && nearBottom) {
    x = 0;
    y = Math.max(0, frame.height - size.baseHeight);
    snappedCorner = "bottom-left";
  } else if (nearRight && nearBottom) {
    x = Math.max(0, frame.width - size.baseWidth);
    y = Math.max(0, frame.height - size.baseHeight);
    snappedCorner = "bottom-right";
  }

  return {
    snappedPlacement: clampPreviewPlacement(
      {
        ...normalized,
        x,
        y,
      },
      frame,
      scale,
      sourceWidth,
      sourceHeight,
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
