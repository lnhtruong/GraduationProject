import { API_BASE_URL } from "@/lib/config";
import { apiClient } from "./apiClient";
import {
  pollJobStatus,
  downloadJobResult,
  createBlobUrlFromResponse,
} from "./jobService";

const MASCOT_ENDPOINT = "/mascot";

/**
 * Add mascot to video
 * @param video - Video file (MP4, AVI, MOV, etc.)
 * @param mascot_image - Mascot image file (JPG, PNG, GIF)
 * @param position - Position of mascot
 * @param margin_x - Horizontal margin (pixels, default: 0)
 * @param margin_y - Vertical margin (pixels, default: 0)
 * @param scale - Scale factor (0.1 to 2.0, default: 0.5)
 * @param audio - Optional audio file for mascot
 * @returns Job ID and initial status
 */
export async function addMascotToVideo(
  video: File,
  mascot_image: File,
  position:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "replace",
  margin_x: number = 40,
  margin_y: number = 40,
  scale: number = 1,
  audio?: File
): Promise<{ job_id: string; status: string }> {
  const url = `${API_BASE_URL}${MASCOT_ENDPOINT}`;

  const formData = new FormData();
  formData.append("video", video);
  formData.append("mascot_image", mascot_image);
  formData.append("position", position);
  formData.append("margin_x", margin_x.toString());
  formData.append("margin_y", margin_y.toString());
  formData.append("scale", scale.toString());
  if (audio) {
    formData.append("audio", audio);
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      body: formData,
      mode: "cors",
      headers: {
        Accept: "application/json",
        "ngrok-skip-browser-warning": "true",
      },
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Mascot upload failed: ${response.status} ${text}`);
    }

    const data = await response.json();
    return data;
  } catch (err) {
    throw new Error(`addMascotToVideo error: ${err}`);
  }
}

// Re-export pollJobStatus from jobService for backward compatibility
export { pollJobStatus };

/**
 * Download processed video - uses jobService for consistency
 */
export async function downloadMascotVideo(job_id: string): Promise<string> {
  const response = await downloadJobResult(job_id);
  return createBlobUrlFromResponse(response);
}

/**
 * Main function: Upload → Poll → Download
 */
export async function addMascotAndDownload(
  video: File,
  mascot_image: File,
  position:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "replace",
  margin_x: number = 40,
  margin_y: number = 40,
  scale: number = 1,
  audio?: File,
  onProgress?: (stage: string) => void
): Promise<string> {
  const { job_id } = await addMascotToVideo(
    video,
    mascot_image,
    position,
    margin_x,
    margin_y,
    scale,
    audio
  );

  const result = await pollJobStatus(job_id, {
    onProgress: onProgress ? (stage) => onProgress(stage) : undefined,
  });

  const blobUrl = await downloadMascotVideo(job_id);
  return blobUrl;
}

/**
 * Calculate max margins based on video dimensions and mascot scale
 */
export async function calculateMaxMargins(
  videoFile: File,
  mascot_image: File,
  scale: number
): Promise<{ maxMarginX: number; maxMarginY: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const img = new Image();

    let videoLoaded = false;
    let imageLoaded = false;

    const checkBothLoaded = () => {
      if (videoLoaded && imageLoaded) {
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;

        const mascotWidth = img.width * scale;
        const mascotHeight = img.height * scale;

        const maxMarginX = Math.max(0, videoWidth - mascotWidth);
        const maxMarginY = Math.max(0, videoHeight - mascotHeight);

        resolve({ maxMarginX, maxMarginY });

        URL.revokeObjectURL(video.src);
        URL.revokeObjectURL(img.src);
      }
    };

    video.onloadedmetadata = () => {
      videoLoaded = true;
      checkBothLoaded();
    };

    img.onload = () => {
      imageLoaded = true;
      checkBothLoaded();
    };

    video.onerror = () => {
      reject(new Error("Failed to load video"));
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    video.src = URL.createObjectURL(videoFile);
    img.src = URL.createObjectURL(mascot_image);
  });
}

/**
 * Validate mascot parameters
 */
export function validateMascotParams(
  position: string,
  margin_x: number,
  margin_y: number,
  scale: number,
  maxMarginX?: number,
  maxMarginY?: number
): { valid: boolean; error?: string } {
  const validPositions = [
    "top-left",
    "top-right",
    "bottom-left",
    "bottom-right",
    "replace",
  ];

  if (!validPositions.includes(position)) {
    const error = `Position không hợp lệ. Phải là một trong: ${validPositions.join(
      ", "
    )}`;
    return { valid: false, error };
  }

  if (margin_x < 0 || margin_y < 0) {
    const error = "Lề không được âm";
    return { valid: false, error };
  }

  if (scale < 0.1 || scale > 2.0) {
    const error = "Kích thước phải từ 0.1 đến 2.0";
    return { valid: false, error };
  }

  if (position !== "replace") {
    if (maxMarginX !== undefined && margin_x > maxMarginX) {
      const error = `Lề ngang vượt quá giới hạn (tối đa: ${Math.round(
        maxMarginX
      )}px)`;
      return { valid: false, error };
    }

    if (maxMarginY !== undefined && margin_y > maxMarginY) {
      const error = `Lề dọc vượt quá giới hạn (tối đa: ${Math.round(
        maxMarginY
      )}px)`;
      return { valid: false, error };
    }
  }

  return { valid: true };
}

/**
 * Get default mascot parameters
 */
export function getDefaultMascotParams() {
  return {
    position: "bottom-right" as const,
    margin_x: 40,
    margin_y: 40,
    scale: 1,
  };
}

export const mascotService = {
  addMascotToVideo,
  addMascotAndDownload,
  pollJobStatus,
  downloadMascotVideo,
  calculateMaxMargins,
  validateMascotParams,
  getDefaultMascotParams,
};
