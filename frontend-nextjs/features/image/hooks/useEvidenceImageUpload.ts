"use client";

import { useCallback, useState } from "react";
import { cloudinaryApi } from "@/features/cloudinary";
import {
  createMediaUploadStream,
  type ImageCompletedPayload,
} from "@/features/_shared/realtime/media-upload-stream";
import { imageApi } from "../api/image.api";
import { authStorageHelper } from "@/store/auth";

export type EvidenceImageType = "report" | "role_upgrade";

function normalizeAssetUrl(value?: string): string {
  if (!value) return "";
  try {
    const parsed = new URL(value);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return value;
  }
}

async function waitForImageRecord(url: string, jobId: string): Promise<number> {
  const user = authStorageHelper.getUser() as { id?: number; user_id?: number } | null;
  const userId = user?.id ?? user?.user_id;
  if (!userId) throw new Error("KhÃ´ng tÃ¬m tháº¥y tÃ i khoáº£n Ä‘ang Ä‘Äƒng nháº­p.");

  const targetUrl = normalizeAssetUrl(url);
  return new Promise<number>((resolve, reject) => {
    let settled = false;
    let polling = false;
    let pollTimer: number | undefined;
    let timeout: number | undefined;

    const finish = (imageId?: number, error?: Error) => {
      if (settled) return;
      settled = true;
      stream.close();
      if (pollTimer) window.clearInterval(pollTimer);
      if (timeout) window.clearTimeout(timeout);
      if (imageId) resolve(imageId);
      else reject(error ?? new Error("áº¢nh chÆ°a Ä‘Æ°á»£c lÆ°u hoÃ n táº¥t."));
    };

    const poll = async () => {
      if (polling || settled) return;
      polling = true;
      try {
        const images = await imageApi.getAllByUser();
        const matched = images.find((image) => normalizeAssetUrl(image.url) === targetUrl);
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
          if (eventJobId !== jobId && (!eventUrl || eventUrl !== targetUrl)) return;
          const imageId = data.imageId ?? data.image_id;
          if (typeof imageId === "number" && imageId > 0) finish(imageId);
        },
        onConnectionError: () => void poll(),
      },
      { userId },
    );

    pollTimer = window.setInterval(() => void poll(), 2000);
    timeout = window.setTimeout(
      () => finish(undefined, new Error("Máy chá»§ chÆ°a xÃ¡c nháº­n lÆ°u áº£nh. Vui lÃ²ng thá»­ láº¡i.")),
      30000,
    );
    void poll();
  });
}

export function useEvidenceImageUpload(type: EvidenceImageType) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const upload = useCallback(
    async (files: File[]): Promise<number[]> => {
      if (files.length === 0) return [];
      setIsUploading(true);
      setProgress(0);
      try {
        const ids = await Promise.all(
          files.map(async (file, index) => {
            const jobId = crypto.randomUUID();
            const signature = await cloudinaryApi.getSignature({
              folderName: `evidence/${type}`,
              jobId,
              type,
            });
            const url = await cloudinaryApi.uploadDirectToCloudinary(
              file,
              signature,
              "image",
              (fileProgress) => {
                setProgress(Math.round((index * 100 + fileProgress) / files.length));
              },
            );
            return waitForImageRecord(url, jobId);
          }),
        );
        setProgress(100);
        return ids;
      } finally {
        setIsUploading(false);
      }
    },
    [type],
  );

  return { upload, isUploading, progress };
}
