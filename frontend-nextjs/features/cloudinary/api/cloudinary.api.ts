import {
  createApi,
  apiHttpClient as apiClient,
} from "@/features/_shared/api-factories";
import type { CloudinarySignature } from "../types";
import { uploadToCloudinary } from "../utils/cloudinary.utils";

export const cloudinaryApi = createApi({
  getSignature: async (folderName: string = "editor-uploads") => {
    const { data: response } = await apiClient.post<CloudinarySignature>(
      "/media/cloudinary/sign",
      { folderName },
    );
    return response;
  },

  uploadDirectToCloudinary: async (
    file: File,
    signature: CloudinarySignature,
    resourceType: "video" | "image" = "video",
    onProgress?: (percent: number) => void,
  ): Promise<string> => {
    return uploadToCloudinary(file, signature, resourceType, onProgress);
  },
});
