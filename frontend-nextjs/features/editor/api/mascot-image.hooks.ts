import { createMutationHooks } from "@/features/_shared/react-query-factories";
import {
  createMediaUploadStream,
  type ImageCompletedPayload,
} from "@/features/_shared/realtime/media-upload-stream";
import { imageApi } from "@/features/image/api/image.api";
import { cloudinaryApi } from "@/features/cloudinary";
import { authStorageHelper } from "@/store/auth";
import { toast } from "sonner";

function normalizeAssetUrl(value?: string): string {
  if (!value) return "";
  try {
    const parsed = new URL(value);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return value;
  }
}

async function waitForMascotImageRecord(params: {
  url: string;
  jobId: string;
  timeoutMs?: number;
}): Promise<number> {
  const storedUser = authStorageHelper.getUser() as {
    id?: number;
    user_id?: number;
  } | null;
  const userId = storedUser?.id ?? storedUser?.user_id;
  if (!userId) throw new Error("Không tìm thấy tài khoản đang đăng nhập.");

  const targetUrl = normalizeAssetUrl(params.url);
  const timeoutMs = params.timeoutMs ?? 30000;

  return new Promise<number>((resolve, reject) => {
    let settled = false;
    let polling = false;
    let pollTimer: number | null = null;
    let timeout = 0;

    const finish = (imageId?: number, error?: Error) => {
      if (settled) return;
      settled = true;
      stream.close();
      window.clearTimeout(timeout);
      if (pollTimer) window.clearInterval(pollTimer);
      if (imageId) resolve(imageId);
      else reject(error ?? new Error("Ảnh mascot chưa được lưu hoàn tất."));
    };

    const findPersistedImage = async () => {
      if (polling || settled) return;
      polling = true;
      try {
        const images = await imageApi.getAllByUser();
        const matched = images.find(
          (image) => normalizeAssetUrl(image.url) === targetUrl,
        );
        if (matched?.id) finish(matched.id);
      } finally {
        polling = false;
      }
    };

    const stream = createMediaUploadStream(
      {
        onImageCompleted: (payload: ImageCompletedPayload) => {
          const data = payload.data ?? payload;
          const eventJobId = data.jobId ?? data.job_id;
          const eventUrl = normalizeAssetUrl(data.url);
          if (
            eventJobId !== params.jobId &&
            (!eventUrl || eventUrl !== targetUrl)
          ) {
            return;
          }

          const imageId = data.imageId ?? data.image_id;
          if (typeof imageId === "number" && imageId > 0) finish(imageId);
        },
        onConnectionError: () => {
          void findPersistedImage();
        },
      },
      { userId },
    );

    pollTimer = window.setInterval(() => {
      void findPersistedImage();
    }, 2000);
    timeout = window.setTimeout(() => {
      finish(
        undefined,
        new Error(
          "Ảnh đã tải lên nhưng máy chủ chưa xác nhận lưu. Vui lòng thử lại sau.",
        ),
      );
    }, timeoutMs);

    void findPersistedImage();
  });
}

const useMascotImageUploadBase = createMutationHooks<
  { imageId: number; url: string },
  { file: File; folderName?: string; onProgress?: (percent: number) => void }
>(
  "mascot-upload",
  "image",
  async (payload) => {
    const jobId = crypto.randomUUID();
    const signature = await cloudinaryApi.getSignature({
      folderName: payload.folderName ?? "mascot-uploads",
      jobId,
      type: "thumbnail_video",
    });
    const url = await cloudinaryApi.uploadDirectToCloudinary(
      payload.file,
      signature,
      "image",
      payload.onProgress,
    );
    const imageId = await waitForMascotImageRecord({ url, jobId });
    return { imageId, url };
  },
  {
    retry: false,
    onSuccess: (data, variables, queryClient) => {
      toast.success("Đã tải ảnh mascot lên");
      void queryClient.invalidateQueries({ queryKey: ["image"] });
    },
  },
);

export function useUploadMascotImage(
  onProgress?: (percent: number) => void,
  onSuccess?: (result: { imageId: number; url: string }) => void,
) {
  const mutation = useMascotImageUploadBase({
    onSuccess: (data) => {
      onSuccess?.(data);
    },
    onError: (error) => {
      console.error("[useUploadMascotImage] Error:", error);
      toast.error("Không thể tải ảnh mascot lên. Vui lòng thử lại.");
    },
  });

  return {
    ...mutation,
    mutate: (
      payload: { file: File; folderName?: string },
      options?: Parameters<typeof mutation.mutate>[1],
    ) => mutation.mutate({ ...payload, onProgress }, options),
    mutateAsync: (
      payload: { file: File; folderName?: string },
      options?: Parameters<typeof mutation.mutateAsync>[1],
    ) => mutation.mutateAsync({ ...payload, onProgress }, options),
  };
}
