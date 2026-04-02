/**
 * Edit Session API
 * CRUD operations for projects and mascot overlays
 */

import { apiClient } from "@/lib/http";
import { createSimpleApi } from "@/features/_shared/api";
import { authStorageHelper } from "@/store/auth";

// ============================================================================
// TYPES
// ============================================================================

export interface CreateProjectRequest {
  session_name: string;
  video_id?: number;
}

export interface UpdateProjectRequest {
  session_name?: string;
  status?: "draft" | "saved" | "finalized";
  video_id?: number;
}

export interface Project {
  edit_id: number;
  user_id: number;
  video_id?: number;
  session_name: string;
  status: "draft" | "saved" | "finalized";
  created_at: string;
  updated_at: string;
}

export interface UserVideo {
  id?: number;
  video_id?: number;
  image_id?: number;
  user_id: number;
  type?: "highlight" | "mascot" | string;
  url: string;
  thumbnail?: string | null;
  duration?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface MascotImage {
  image_id: number;
  user_id: number;
  url: string;
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MascotOverlayRequest {
  edit_id?: number;
  image_id?: number;
  position_x: number;
  position_y: number;
  scale: number;
  start_time: number;
  end_time: number;
  layer_index: number;
}

export interface UpdateMascotOverlayRequest {
  image_id?: number;
  position_x?: number;
  position_y?: number;
  scale?: number;
  start_time?: number;
  end_time?: number;
  layer_index?: number;
}

export interface MascotOverlay {
  mascot_overlay_id: number;
  edit_id: number;
  image_id?: number | null;
  position_x: number;
  position_y: number;
  scale: number;
  start_time: number;
  end_time: number;
  layer_index: number;
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
  mascotImage?: {
    image_id: number;
    user_id: number;
    url: string;
    createdAt?: string;
    updatedAt?: string;
  };
}

// ============================================================================
// PROJECT API
// ============================================================================

export const projectApi = createSimpleApi({
  // Create project
  create: async (data: CreateProjectRequest) => {
    const { data: response } = await apiClient.post<Project>(
      "/media/projects",
      data,
    );
    return response;
  },

  // Get projects for current user (resolved by x-user-id header in gateway)
  listByParent: async (userId: number) => {
    void userId;
    const { data: response } = await apiClient.get<Project[]>(
      "/media/projects/user",
    );
    return response;
  },

  // Get single project
  getOne: async (editId: number) => {
    const { data: response } = await apiClient.get<Project>(
      `/media/projects/${editId}`,
    );
    return response;
  },

  // Update project
  update: async (editId: number, data: UpdateProjectRequest) => {
    const { data: response } = await apiClient.patch<Project>(
      `/media/projects/${editId}`,
      data,
    );
    return response;
  },

  // Delete project
  delete: async (editId: number) => {
    const { data: response } = await apiClient.delete<{ message: string }>(
      `/media/projects/${editId}`,
    );
    return response;
  },
});

// ============================================================================
// USER VIDEO API
// ============================================================================

export const userVideoApi = createSimpleApi({
  listByUser: async (type: string) => {
    const { data: response } = await apiClient.get<UserVideo[]>(
      `/media/videos/user/${type}`,
    );
    return response;
  },
});

// ============================================================================
// CLOUDINARY UPLOAD API
// ============================================================================

export interface CloudinarySignature {
  signature: string;
  timestamp: number;
  cloud_name: string;
  api_key: string;
  folder: string;
}

function getCurrentUserId(): number | null {
  const user = authStorageHelper.getUser() as {
    id?: number;
    user_id?: number;
  } | null;

  if (typeof user?.id === "number") return user.id;
  if (typeof user?.user_id === "number") return user.user_id;

  const token = authStorageHelper.getAccessToken();
  if (!token) return null;

  try {
    const payloadBase64 = token.split(".")[1];
    if (!payloadBase64) return null;

    const normalized = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const payload = JSON.parse(atob(padded)) as {
      id?: number;
      userId?: number;
      user_id?: number;
      sub?: number | string;
    };

    if (typeof payload.id === "number") return payload.id;
    if (typeof payload.userId === "number") return payload.userId;
    if (typeof payload.user_id === "number") return payload.user_id;
    if (typeof payload.sub === "number") return payload.sub;
    if (typeof payload.sub === "string" && !Number.isNaN(Number(payload.sub))) {
      return Number(payload.sub);
    }
  } catch {
    return null;
  }

  return null;
}

export const cloudinaryApi = createSimpleApi({
  // Get signature for direct upload (client-side)
  getSignature: async (folderName: string = "editor-uploads") => {
    const { data: response } = await apiClient.post<CloudinarySignature>(
      "/media/cloudinary/sign",
      { folderName },
    );
    return response;
  },

  // Upload directly to Cloudinary (client-side)
  uploadDirectToCloudinary: async (
    file: File,
    signature: CloudinarySignature,
    resourceType: "video" | "image" = "video",
    onProgress?: (percent: number) => void,
  ): Promise<string> => {
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

    // Upload directly to Cloudinary
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
  },
});

// ============================================================================
// MASCOT IMAGE API
// ============================================================================

export const mascotImageApi = createSimpleApi({
  create: async (data: Pick<MascotImage, "url">) => {
    const { data: response } = await apiClient.post<MascotImage>(
      "/media/mascot_images",
      data,
    );
    return response;
  },

  listByUser: async () => {
    const { data: response } = await apiClient.get<MascotImage[]>(
      "/media/mascot_images/user",
    );
    return response;
  },
});

// ============================================================================
// MASCOT OVERLAY API
// ============================================================================

export const mascotOverlayApi = createSimpleApi({
  // Create layer
  create: async (data: MascotOverlayRequest) => {
    const { data: response } = await apiClient.post<MascotOverlay>(
      "/media/mascot_overlays",
      data,
    );
    return response;
  },

  // Get all layers for a project
  listByEdit: async (editId: number) => {
    const { data: response } = await apiClient.get<MascotOverlay[]>(
      `/media/mascot_overlays/edit/${editId}`,
    );
    return response;
  },

  // Get single layer
  getOne: async (mascotOverlayId: number) => {
    const { data: response } = await apiClient.get<MascotOverlay>(
      `/media/mascot_overlays/${mascotOverlayId}`,
    );
    return response;
  },

  // Update layer
  update: async (mascotOverlayId: number, data: UpdateMascotOverlayRequest) => {
    const { data: response } = await apiClient.patch<MascotOverlay>(
      `/media/mascot_overlays/${mascotOverlayId}`,
      data,
    );
    return response;
  },

  // Delete layer
  delete: async (mascotOverlayId: number) => {
    const { data: response } = await apiClient.delete<{ message: string }>(
      `/media/mascot_overlays/${mascotOverlayId}`,
    );
    return response;
  },
});
