/**
 * Media Validation Utilities
 * Reusable validation for video/image files and parameters
 */

export interface VideoMetadata {
  width: number;
  height: number;
  duration: number;
}

export interface ImageMetadata {
  width: number;
  height: number;
}

/**
 * Load video metadata
 */
export async function loadVideoMetadata(
  videoSource: File | string,
): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");

    video.onloadedmetadata = () => {
      const metadata = {
        width: video.videoWidth,
        height: video.videoHeight,
        duration: video.duration,
      };

      // Cleanup
      if (typeof videoSource !== "string") {
        URL.revokeObjectURL(video.src);
      }

      resolve(metadata);
    };

    video.onerror = () => {
      if (typeof videoSource !== "string") {
        URL.revokeObjectURL(video.src);
      }
      reject(new Error("Failed to load video metadata"));
    };

    if (typeof videoSource === "string") {
      video.src = videoSource;
      video.crossOrigin = "anonymous";
    } else {
      video.src = URL.createObjectURL(videoSource);
    }
  });
}

/**
 * Load image metadata
 */
export async function loadImageMetadata(
  imageSource: File | string,
): Promise<ImageMetadata> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const metadata = {
        width: img.width,
        height: img.height,
      };

      // Cleanup
      if (typeof imageSource !== "string") {
        URL.revokeObjectURL(img.src);
      }

      resolve(metadata);
    };

    img.onerror = () => {
      if (typeof imageSource !== "string") {
        URL.revokeObjectURL(img.src);
      }
      reject(new Error("Failed to load image metadata"));
    };

    if (typeof imageSource === "string") {
      img.src = imageSource;
      img.crossOrigin = "anonymous";
    } else {
      img.src = URL.createObjectURL(imageSource);
    }
  });
}

/**
 * Calculate max margins for mascot positioning
 */
export async function calculateMaxMargins(
  videoSource: File | string,
  mascotImage: File,
  scale: number,
): Promise<{ maxMarginX: number; maxMarginY: number }> {
  const [videoMeta, imageMeta] = await Promise.all([
    loadVideoMetadata(videoSource),
    loadImageMetadata(mascotImage),
  ]);

  const mascotWidth = imageMeta.width * scale;
  const mascotHeight = imageMeta.height * scale;

  const maxMarginX = Math.max(0, videoMeta.width - mascotWidth);
  const maxMarginY = Math.max(0, videoMeta.height - mascotHeight);

  return { maxMarginX, maxMarginY };
}

/**
 * Validate mascot position parameters
 */
export interface MascotValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateMascotParams(
  position: string,
  margin_x: number,
  margin_y: number,
  maxMarginX: number,
  maxMarginY: number,
): MascotValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate position
  const validPositions = [
    "top-left",
    "top-right",
    "bottom-left",
    "bottom-right",
    "replace",
  ];
  if (!validPositions.includes(position)) {
    errors.push(
      `Invalid position: ${position}. Must be one of: ${validPositions.join(", ")}`,
    );
  }

  // Validate margins (only for non-replace positions)
  if (position !== "replace") {
    if (margin_x < 0) {
      errors.push("margin_x must be non-negative");
    }
    if (margin_y < 0) {
      errors.push("margin_y must be non-negative");
    }

    if (margin_x > maxMarginX) {
      errors.push(`margin_x (${margin_x}) exceeds maximum (${maxMarginX})`);
    }
    if (margin_y > maxMarginY) {
      errors.push(`margin_y (${margin_y}) exceeds maximum (${maxMarginY})`);
    }

    // Warnings for edge cases
    if (margin_x > maxMarginX * 0.9) {
      warnings.push(
        "margin_x is very close to the maximum, mascot may be clipped",
      );
    }
    if (margin_y > maxMarginY * 0.9) {
      warnings.push(
        "margin_y is very close to the maximum, mascot may be clipped",
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get default mascot parameters based on position
 */
export function getDefaultMascotParams(position: string) {
  const defaults = {
    "top-left": { margin_x: 40, margin_y: 40 },
    "top-right": { margin_x: 40, margin_y: 40 },
    "bottom-left": { margin_x: 40, margin_y: 40 },
    "bottom-right": { margin_x: 40, margin_y: 40 },
    replace: { margin_x: 0, margin_y: 0 },
  };

  return (
    defaults[position as keyof typeof defaults] || {
      margin_x: 40,
      margin_y: 40,
    }
  );
}

/**
 * Validate file type
 */
export function validateFileType(
  file: File,
  allowedTypes: string[],
  allowedExtensions?: string[],
): { isValid: boolean; error?: string } {
  // Check MIME type
  if (
    allowedTypes.length > 0 &&
    !allowedTypes.some((type) => file.type.startsWith(type))
  ) {
    return {
      isValid: false,
      error: `Invalid file type. Expected: ${allowedTypes.join(", ")}`,
    };
  }

  // Check extension if provided
  if (allowedExtensions) {
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !allowedExtensions.includes(extension)) {
      return {
        isValid: false,
        error: `Invalid file extension. Expected: ${allowedExtensions.join(", ")}`,
      };
    }
  }

  return { isValid: true };
}

/**
 * Validate file size
 */
export function validateFileSize(
  file: File,
  maxSizeMB: number,
): { isValid: boolean; error?: string } {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (file.size > maxSizeBytes) {
    return {
      isValid: false,
      error: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum (${maxSizeMB}MB)`,
    };
  }

  return { isValid: true };
}
