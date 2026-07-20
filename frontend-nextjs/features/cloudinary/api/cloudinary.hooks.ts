import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CLOUDINARY_MAX_UPLOAD_BYTES,
  CLOUDINARY_MAX_UPLOAD_LABEL,
} from "@/lib/env";
import { cloudinaryApi } from "./cloudinary.api";

type CloudinaryUploadVariables = {
  file: File;
  folderName?: string;
  resourceType?: "video" | "image";
  jobId?: string;
  type?:
    | "highlight"
    | "mascot"
    | "thumbnail_video"
    | "thumbnail_course"
    | "avt";
};

export function useCloudinaryDirectUpload(
  onProgress?: (percent: number) => void,
) {
  return useMutation({
    mutationKey: ["cloudinary", "upload"],
    mutationFn: async (payload: CloudinaryUploadVariables) => {
      if (payload.file.size > CLOUDINARY_MAX_UPLOAD_BYTES) {
        throw new Error(
          `File quá lớn. Kích thước tối đa: ${CLOUDINARY_MAX_UPLOAD_LABEL}`,
        );
      }

      const signature = await cloudinaryApi.getSignature({
        folderName: payload.folderName,
        jobId: payload.jobId,
        type: payload.type,
      });
      const url = await cloudinaryApi.uploadDirectToCloudinary(
        payload.file,
        signature,
        payload.resourceType ?? "video",
        onProgress,
      );
      return { secure_url: url };
    },
    retry: 1,
    onSuccess: () => {
      toast.success("Tải lên thành công");
    },
    onError: (error: Error) => {
      console.error("[useCloudinaryDirectUpload] Error:", error);
      toast.error(error.message || "Tải lên thất bại. Vui lòng thử lại.");
    },
  });
}
