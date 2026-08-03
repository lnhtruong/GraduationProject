"use client";

import { useCallback } from "react";
import { authStorageHelper, type User } from "@/store/auth";
import { cloudinaryApi } from "@/features/cloudinary/api/cloudinary.api";
import { apiHttpClient } from "@/features/_shared/api-factories";

/**
 * Hook: useAvatarUpload
 * - Signs upload via cloudinaryApi.getSignature
 * - Uploads directly to Cloudinary using uploadToCloudinary util
 * - Calls PATCH /users/:id to update avatarUrl
 * - Syncs local store `authStorageHelper.setUser` with updated avatarUrl
 */
export function useAvatarUpload() {
  const upload = useCallback(async (file: File) => {
    const user = authStorageHelper.getUser();
    if (!user?.id) throw new Error("Not authenticated");
    const userId = user.id;

    // Get signature for avatar folder
    const signature = await cloudinaryApi.getSignature({
      folderName: `avatars/${userId}`,
      type: "avt",
    });
    const secureUrl = await cloudinaryApi.uploadDirectToCloudinary(
      file,
      signature,
      "image",
    );

    // Patch user record
    const { data } = await apiHttpClient.patch(`/users/${userId}`, {
      avatarUrl: secureUrl,
    });

    // Update local store user object
    const updated: User = { ...user, avatarUrl: secureUrl };
    authStorageHelper.setUser(updated);

    return { secureUrl, data };
  }, []);

  return { upload };
}
