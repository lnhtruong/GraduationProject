import { createMutationHooks } from "@/features/_shared/react-query-factories";
import { imageApi } from "@/features/image/api/image.api";
import { cloudinaryApi } from "@/features/cloudinary";
import { toast } from "sonner";

const useMascotImageUploadBase = createMutationHooks<
  { imageId: number; url: string },
  { file: File; folderName?: string }
>(
  "mascot-upload",
  "image",
  async (payload) => {
    const signature = await cloudinaryApi.getSignature(
      payload.folderName ?? "mascot-uploads",
    );
    const url = await cloudinaryApi.uploadDirectToCloudinary(
      payload.file,
      signature,
      "image",
    );
    const mascotRecord = await imageApi.create({ url });
    return {
      imageId: mascotRecord.id ?? 0,
      url,
    };
  },
  {
    onSuccess: () => {
      toast.success("Mascot uploaded successfully");
    },
  },
);

export function useUploadMascotImage(
  onProgress?: (percent: number) => void,
  onSuccess?: (result: { imageId: number; url: string }) => void,
) {
  void onProgress;
  return useMascotImageUploadBase({
    onSuccess: (data) => {
      onSuccess?.(data);
    },
    onError: (error) => {
      console.error("[useUploadMascotImage] Error:", error);
      toast.error("Failed to upload mascot. Please try again.");
    },
  });
}
