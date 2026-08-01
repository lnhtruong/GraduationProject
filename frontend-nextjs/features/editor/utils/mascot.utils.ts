/**
 * Mascot Processing Utilities
 * Helper functions for building FormData for mascot API requests
 */

import type { MascotParams } from "../types";

function appendIfDefined(formData: FormData, key: string, value: unknown) {
  if (value === undefined || value === null || value === "") return;
  formData.append(key, String(value));
}

/**
 * Build FormData for mascot processing request
 */
export function buildMascotFormData(params: MascotParams): FormData {
  const formData = new FormData();

  // Ensure video URL is a string
  if (typeof params.videoOrUrl !== "string") {
    throw new Error(
      "Mascot cần URL video. Vui lòng upload video trước khi tạo.",
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
  // Thời lượng để backend tính credit quota. Thiếu → backend tính hệ số ×1.
  if (params.durationSec && params.durationSec > 0) {
    formData.append("duration_sec", String(Math.round(params.durationSec)));
  }
  if (params.textOverlays?.length) {
    formData.append("text_overlays", JSON.stringify(params.textOverlays));
  }

  appendIfDefined(formData, "brightness", params.brightness);
  appendIfDefined(formData, "contrast", params.contrast);
  appendIfDefined(formData, "saturation", params.saturation);
  appendIfDefined(formData, "gamma", params.gamma);

  appendIfDefined(formData, "remove_background", params.removeBackground);
  appendIfDefined(formData, "bg_mode", params.bgMode);
  appendIfDefined(formData, "bg_quality_mode", params.bgQualityMode);
  appendIfDefined(formData, "green_screen_color", params.greenScreenColor);
  appendIfDefined(formData, "chromakey_similarity", params.chromakeySimilarity);
  appendIfDefined(formData, "chromakey_blend", params.chromakeyBlend);
  appendIfDefined(formData, "alpha_contract_px", params.alphaContractPx);
  appendIfDefined(formData, "alpha_blur_px", params.alphaBlurPx);

  appendIfDefined(formData, "animation_mode", params.animationMode);
  appendIfDefined(formData, "quality_mode", params.qualityMode);
  appendIfDefined(formData, "cfg_scale", params.cfgScale);
  appendIfDefined(formData, "driving_multiplier", params.drivingMultiplier);
  appendIfDefined(formData, "flag_stitching", params.flagStitching);
  appendIfDefined(formData, "flag_pasteback", params.flagPasteback);
  appendIfDefined(formData, "flag_normalize_lip", params.flagNormalizeLip);
  appendIfDefined(formData, "flag_relative_motion", params.flagRelativeMotion);
  appendIfDefined(formData, "flag_do_crop", params.flagDoCrop);
  appendIfDefined(formData, "crop_scale", params.cropScale);
  appendIfDefined(formData, "vx_ratio", params.vxRatio);
  appendIfDefined(formData, "vy_ratio", params.vyRatio);

  if (params.audio) {
    formData.append("audio", params.audio);
  }

  return formData;
}
