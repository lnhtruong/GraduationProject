import { createMutationHooks } from "@/features/_shared/react-query-factories";
import { toast } from "sonner";
import { cloudinaryApi } from "./cloudinary.api";

const useCloudinaryUploadBase = createMutationHooks<
  { secure_url: string },
  { file: File; folderName?: string; resourceType?: "video" | "image" }
>(
  "cloudinary",
  "upload",
  async (payload) => {
    const signature = await cloudinaryApi.getSignature(
      payload.folderName ?? "editor-uploads",
    );
    const url = await cloudinaryApi.uploadDirectToCloudinary(
      payload.file,
      signature,
      payload.resourceType ?? "video",
    );
    return { secure_url: url };
  },
  {
    onSuccess: () => {
      toast.success("Tải lên thành công");
    },
  },
);

export function useCloudinaryDirectUpload(
  onProgress?: (percent: number) => void,
) {
  void onProgress;
  return useCloudinaryUploadBase({
    onError: (error: Error) => {
      console.error("[useCloudinaryDirectUpload] Error:", error);
      toast.error("Tải lên thất bại. Vui lòng thử lại.");
    },
  });
}
