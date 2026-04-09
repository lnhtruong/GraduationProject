/**
 * Video Editor API
 * Consolidated API layer for video editing operations including project management,
 * mascot processing, cloudinary uploads, and overlay management
 */

import {
  createApi,
  apiHttpClient as apiClient,
  inferenceHttpClient as inferenceClient,
} from "@/features/_shared/api";
import { uploadToCloudinary } from "../utils/cloudinary.utils";
import { buildMascotFormData } from "../utils/mascot.utils";
import type {
  CloudinarySignature,
  CreateProjectRequest,
  MascotImage,
  MascotOverlay,
  MascotOverlayRequest,
  Project,
  UpdateMascotOverlayRequest,
  UpdateProjectRequest,
  UserVideo,
  MascotParams,
  CreateMascotVideoPayload,
} from "../types";

// Re-export common types for convenience
export type { MascotParams, CreateMascotVideoPayload };

// ============================================================================
// PROJECT MANAGEMENT API
// ============================================================================

export const projectApi = createApi({
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

export const userVideoApi = createApi({
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

export const cloudinaryApi = createApi({
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
    return uploadToCloudinary(file, signature, resourceType, onProgress);
  },
});

// ============================================================================
// MASCOT IMAGE API
// ============================================================================

export const mascotImageApi = createApi({
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

export const mascotOverlayApi = createApi({
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

// ============================================================================
// MASCOT PROCESSING INFERENCE API
// ============================================================================

export const MASCOT_ENDPOINT = "/mascot_colab/mascot";

export const mascotApi = createApi({
  startJob: async (params: MascotParams) => {
    const formData = buildMascotFormData(params);
    const { data } = await inferenceClient.post<{ job_id: string }>(
      MASCOT_ENDPOINT,
      formData,
    );
    return data.job_id;
  },
});

export const mascotVideoApi = createApi({
  createVideoRecord: async (payload: CreateMascotVideoPayload) => {
    const { data } = await apiClient.post("/media/videos", {
      url: payload.url,
      image_id: payload.image_id,
      duration: payload.duration ?? 0,
      type: "mascot",
    });
    return data;
  },
});
