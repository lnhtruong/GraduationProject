import {
  createApi,
  apiHttpClient as apiClient,
} from "@/features/_shared/api-factories";
import type { CloudinarySignature } from "../types";
import { uploadToCloudinary } from "../utils/cloudinary.utils";

export const cloudinaryApi = createApi({
  getSignature: async (
    options:
      | string
      | {
          folderName?: string;
          jobId?: string;
          type?:
            | "highlight"
            | "mascot"
            | "thumbnail_video"
            | "thumbnail_course"
            | "avt";
        } = "editor-uploads",
  ) => {
    const payload =
      typeof options === "string"
        ? { folderName: options }
        : {
            folderName: options.folderName ?? "editor-uploads",
            job_id: options.jobId,
            type: options.type,
          };
    const { data: response } = await apiClient.post<CloudinarySignature>(
      "/media/cloudinary/sign",
      payload,
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
