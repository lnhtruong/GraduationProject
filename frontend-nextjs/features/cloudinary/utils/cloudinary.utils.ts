/**
 * Cloudinary Upload Utilities
 * Helper functions for uploading files directly to Cloudinary with progress tracking
 */

import { authStorageHelper } from "@/store/auth";
import type { CloudinarySignature } from "../types";

function getCurrentUserId(): number | null {
  const user = authStorageHelper.getUser() as {
    id?: number;
    user_id?: number;
  } | null;

  if (typeof user?.id === "number") return user.id;
  if (typeof user?.user_id === "number") return user.user_id;

  return null;
}

export async function uploadToCloudinary(
  file: File,
  signature: CloudinarySignature,
  resourceType: "video" | "image" = "video",
  onProgress?: (percent: number) => void,
): Promise<string> {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error("Missing user id for Cloudinary direct upload context");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", signature.api_key);
  formData.append("timestamp", signature.timestamp.toString());
  formData.append("signature", signature.signature);
  formData.append("folder", signature.folder);
  formData.append("context", `userId=${userId}`);
  formData.append("resource_type", resourceType);

  const xhr = new XMLHttpRequest();

  return new Promise((resolve, reject) => {
    xhr.upload.addEventListener("progress", (e: ProgressEvent) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress?.(percent);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response.secure_url);
        } catch {
          reject(new Error("Invalid response from Cloudinary"));
        }
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Network error during upload"));
    });

    xhr.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${signature.cloud_name}/${resourceType}/upload`,
    );
    xhr.send(formData);
  });
}
