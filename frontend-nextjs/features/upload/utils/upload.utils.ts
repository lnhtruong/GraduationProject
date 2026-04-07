/**
 * Upload Feature Utilities
 * Helper functions for building FormData and handling uploads
 */

import type { HighlightReelParams } from "../types";

/**
 * Build FormData for highlight reel upload request
 */
export function buildHighlightReelFormData(
  params: HighlightReelParams,
): FormData {
  const formData = new FormData();
  formData.append("video", params.file);

  if (params.topic) formData.append("topic", params.topic);
  if (params.includeKeywords)
    formData.append("include_keywords", params.includeKeywords);
  if (params.excludeKeywords)
    formData.append("exclude_keywords", params.excludeKeywords);
  formData.append("isOpenAI", "false");

  return formData;
}

/**
 * Build the request config for highlight reel upload.
 */
export function buildHighlightReelRequestConfig(
  params: HighlightReelParams,
) {
  return {
    headers: {
      // Remove default "application/json" so browser sets correct
      // "multipart/form-data; boundary=..." for the FormData upload
      "Content-Type": undefined,
    },
    timeout: 0, // Disable timeout for file uploads (large files need more time)
    onUploadProgress: (event: { loaded: number; total?: number }) => {
      if (event.total && params.onUploadProgress) {
        const percent = Math.round((event.loaded * 100) / event.total);
        params.onUploadProgress(percent);
      }
    },
  };
}
