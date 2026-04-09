/**
 * Video Editor Hooks
 * TanStack Query hooks for project management, mascot overlays, and media uploads
 */

import { createCrudHooks } from "@/features/_shared/crud-hooks";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createKeyFactory } from "@/lib/queryKeys";
import {
  projectApi,
  mascotOverlayApi,
  mascotImageApi,
  userVideoApi,
  cloudinaryApi,
} from "./videoEditor.api";
import { toast } from "sonner";

// ============================================================================
// PROJECT CRUD HOOKS
// ============================================================================

export const projectCrud = createCrudHooks(
  "projects",
  {
    listByParent: projectApi.listByParent,
    getOne: projectApi.getOne,
    create: projectApi.create,
    update: projectApi.update,
    delete: projectApi.delete,
  },
  {
    idField: "edit_id",
  },
);

// Re-export main project hooks
export const {
  useListByParent: useUserProjects,
  useDetail: useProject,
  useCreate: useCreateProject,
  useUpdate: useUpdateProject,
  useDelete: useDeleteProject,
} = projectCrud;

// ============================================================================
// MASCOT OVERLAY CRUD HOOKS
// ============================================================================

export const layerCrud = createCrudHooks(
  "mascot-layers",
  {
    listByParent: mascotOverlayApi.listByEdit,
    getOne: mascotOverlayApi.getOne,
    create: mascotOverlayApi.create,
    update: mascotOverlayApi.update,
    delete: mascotOverlayApi.delete,
  },
  {
    idField: "mascot_overlay_id",
  },
);

// Re-export main layer hooks
export const {
  useListByParent: useProjectLayers,
  useDetail: useLayer,
  useCreate: useCreateLayer,
  useUpdate: useUpdateLayer,
  useDelete: useDeleteLayer,
} = layerCrud;

// ============================================================================
// USER HIGHLIGHT VIDEOS QUERY
// ============================================================================

const userVideosKeys = createKeyFactory("user-videos");

export function useUserHighlightVideos(userId: number | null, enabled = true) {
  return useQuery({
    queryKey: userVideosKeys.custom("highlight", userId),
    queryFn: async () => {
      return userVideoApi.listByUser("highlight");
    },
    enabled: enabled && userId !== null && userId !== undefined,
    staleTime: 60 * 1000,
  });
}

export function useUserMascotImages(userId: number | null, enabled = true) {
  return useQuery({
    queryKey: userVideosKeys.custom("mascot-images", userId),
    queryFn: async () => {
      return mascotImageApi.listByUser();
    },
    enabled: enabled && userId !== null && userId !== undefined,
    staleTime: 60 * 1000,
  });
}

export const useUserMascotVideos = useUserMascotImages;

// ============================================================================
// CLOUDINARY DIRECT UPLOAD MUTATION (Client-side to Cloudinary API)
// ============================================================================

export function useCloudinaryDirectUpload(
  onProgress?: (percent: number) => void,
  onSuccess?: (url: string) => void,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      folderName = "editor-uploads",
    }: {
      file: File;
      folderName?: string;
    }) => {
      // Step 1: Get signature from backend
      const signature = await cloudinaryApi.getSignature(folderName);

      // Step 2: Upload directly to Cloudinary
      const secureUrl = await cloudinaryApi.uploadDirectToCloudinary(
        file,
        signature,
        "video",
        onProgress,
      );

      return { success: true, secure_url: secureUrl };
    },
    onSuccess: (response) => {
      toast.success("Video uploaded successfully!");

      // Invalidate highlight videos query to refresh the list
      queryClient.invalidateQueries({
        queryKey: userVideosKeys.custom("highlight"),
      });

      onSuccess?.(response.secure_url);
    },
    onError: (error: unknown) => {
      let message = "Failed to upload video";
      if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === "object" && error !== null) {
        const errObj = error as Record<string, unknown>;
        if (typeof errObj.message === "string") {
          message = errObj.message;
        }
      }
      toast.error(message);
    },
  });
}

export function useUploadMascotImage(
  onProgress?: (percent: number) => void,
  onSuccess?: (payload: { imageId: number; url: string }) => void,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      folderName = "editor-mascot-images",
    }: {
      file: File;
      folderName?: string;
    }) => {
      const signature = await cloudinaryApi.getSignature(folderName);

      const secureUrl = await cloudinaryApi.uploadDirectToCloudinary(
        file,
        signature,
        "image",
        onProgress,
      );

      const created = await mascotImageApi.create({
        url: secureUrl,
      });

      return {
        imageId: created.image_id,
        url: created.url,
      };
    },
    onSuccess: (response) => {
      toast.success("Mascot image uploaded successfully!");
      queryClient.invalidateQueries({
        queryKey: userVideosKeys.custom("mascot-images"),
      });
      onSuccess?.(response);
    },
    onError: (error: unknown) => {
      let message = "Failed to upload mascot image";
      if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === "object" && error !== null) {
        const errObj = error as Record<string, unknown>;
        if (typeof errObj.message === "string") {
          message = errObj.message;
        }

        const response = errObj.response as
          | {
              data?: {
                message?: string | string[];
              };
            }
          | undefined;
        const apiMessage = response?.data?.message;
        if (Array.isArray(apiMessage)) {
          message = apiMessage.join(" | ");
        } else if (typeof apiMessage === "string") {
          message = apiMessage;
        }
      }
      toast.error(message);
    },
  });
}
