/**
 * Mascot Processing Utilities
 * Helper functions for building FormData for mascot API requests
 */

import type { MascotParams } from "../types";

/**
 * Build FormData for mascot processing request
 */
export function buildMascotFormData(params: MascotParams): FormData {
  const formData = new FormData();

  // Ensure video URL is a string
  if (typeof params.videoOrUrl !== "string") {
    throw new Error(
      "Mascot API requires video URL. Please upload video to Cloudinary first.",
    );
  }

  formData.append("video_url", params.videoOrUrl);
  formData.append("mascot_image_url", params.mascotImageUrl);
  if (params.origin_file_name?.trim()) {
    formData.append("origin_file_name", params.origin_file_name.trim());
  }
  formData.append("position", params.position);
  formData.append("margin_x", String(params.margin_x ?? 40));
  formData.append("margin_y", String(params.margin_y ?? 40));
  formData.append("scale", String(params.scale ?? 1));

  if (params.audio) {
    formData.append("audio", params.audio);
  }

  return formData;
}
