/**
 * Mascot Hook
 * Manages mascot application to video
 */

import { useState } from "react";
import { useProcessMascot } from "../api/editor.hooks";
import type { MascotOption } from "@/features/videoEditor/types";
import {
  mascotApi,
  mascotVideoApi,
  type MascotParams,
} from "../api/editor.api";
import { toast } from "sonner";

export function useMascot() {
  const [mascot, setMascot] = useState<MascotOption>({
    type: "none",
    position: "bottom-right",
    margin_x: 40,
    margin_y: 40,
    scale: 1,
  });

  const [isApplyingMascot, setIsApplyingMascot] = useState(false);
  const [mascotProgress, setMascotProgress] = useState<string>("");

  const resolveMascotImageUrl = (mascotOption: MascotOption): string | null => {
    if (mascotOption.type === "none") {
      console.log("No mascot to apply");
      return null;
    }

    if (mascotOption.type === "custom") {
      if (mascotOption.presetUrl) {
        return mascotOption.presetUrl;
      }

      if (mascotOption.customFile) {
        toast.warning(
          "Ảnh mascot đang upload lên cloud, vui lòng đợi hoàn tất.",
        );
        return null;
      }

      toast.warning(
        "Vui lòng upload ảnh mascot lên cloud trước khi tạo video.",
      );
      return null;
    }

    if (mascotOption.type === "preset" && mascotOption.presetUrl) {
      return mascotOption.presetUrl;
    }

    toast.warning("Vui lòng chọn mascot hợp lệ.");
    return null;
  };

  const validateMascotOption = (mascotOption: MascotOption): boolean => {
    if (mascotOption.margin_x < 0 || mascotOption.margin_y < 0) {
      toast.warning("Lề không được âm");
      return false;
    }

    if (mascotOption.scale < 0.1 || mascotOption.scale > 2.0) {
      toast.warning("Kích thước phải từ 0.1 đến 2.0");
      return false;
    }

    return true;
  };

  // Use React Query mutation
  const processMascot = useProcessMascot({
    onProgress: (stage) => {
      console.log("[useMascot] Progress:", stage);
      setMascotProgress(stage);
    },
    onSuccess: async (result) => {
      console.log("[useMascot] Success:", result);

      if (!result.downloadUrl) {
        throw new Error("No download URL in result");
      }

      // Download the result as blob
      const response = await fetch(result.downloadUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      setIsApplyingMascot(false);
      setMascotProgress("");

      // Call the success callback
      if (applyMascot.currentOnSuccess) {
        applyMascot.currentOnSuccess({
          blobUrl,
          downloadUrl: result.downloadUrl,
        });
      }
    },
    onError: (error) => {
      console.error("[useMascot] Error:", error);
      toast.error(`Lỗi: ${error.message}`);
      setIsApplyingMascot(false);
      setMascotProgress("");
    },
  });

  const applyMascot = async (
    mascotOption: MascotOption,
    videoSrc: string,
    onSuccess: (result: { blobUrl: string; downloadUrl: string }) => void,
  ) => {
    const mascotImageUrl = resolveMascotImageUrl(mascotOption);
    if (!mascotImageUrl || !validateMascotOption(mascotOption)) {
      return;
    }

    setIsApplyingMascot(true);
    setMascotProgress("Đang tải lên...");

    // Store callback for later use
    applyMascot.currentOnSuccess = onSuccess;

    console.log("Applying mascot with params:", {
      position: mascotOption.position,
      margin_x: mascotOption.margin_x,
      margin_y: mascotOption.margin_y,
      scale: mascotOption.scale,
      type: mascotOption.type,
      audio: mascotOption.audioFile?.name,
      mascotImageUrl,
    });

    // Start processing with React Query
    await processMascot.mutateAsync({
      videoOrUrl: videoSrc,
      mascotImageUrl,
      position: mascotOption.position,
      margin_x: mascotOption.margin_x,
      margin_y: mascotOption.margin_y,
      scale: mascotOption.scale,
      audio: mascotOption.audioFile,
    });
  };

  const startMascotJob = async (
    mascotOption: MascotOption,
    videoSrc: string,
  ): Promise<string | null> => {
    const mascotImageUrl = resolveMascotImageUrl(mascotOption);
    if (!mascotImageUrl || !validateMascotOption(mascotOption)) {
      return null;
    }

    setMascotProgress("Đang gửi yêu cầu tạo video mascot...");

    const payload: MascotParams = {
      videoOrUrl: videoSrc,
      mascotImageUrl,
      position: mascotOption.position,
      margin_x: mascotOption.margin_x,
      margin_y: mascotOption.margin_y,
      scale: mascotOption.scale,
      audio: mascotOption.audioFile,
    };

    try {
      const jobId = await mascotApi.startJob(payload);
      setMascotProgress("");
      return jobId;
    } catch (error) {
      setMascotProgress("");
      throw error;
    }
  };

  const waitForMascotJobCompletion = async (
    jobId: string,
    options?: {
      intervalMs?: number;
      maxAttempts?: number;
    },
  ): Promise<{ downloadUrl?: string }> => {
    const intervalMs = options?.intervalMs ?? 3000;
    const maxAttempts = options?.maxAttempts ?? 120;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const status = await mascotApi.getStatus(jobId);

      if (status.stage) {
        setMascotProgress(status.stage);
      }

      if (status.status === "completed") {
        setMascotProgress("");
        return {
          downloadUrl: status.result?.download_url,
        };
      }

      if (status.status === "failed") {
        setMascotProgress("");
        throw new Error(status.error || "Tạo mascot video thất bại.");
      }

      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    setMascotProgress("");
    throw new Error("Quá thời gian chờ tạo mascot video.");
  };

  // Store callback reference on function
  applyMascot.currentOnSuccess = null as
    | ((result: { blobUrl: string; downloadUrl: string }) => void)
    | null;

  const createMascotVideoRecord = async (params: {
    url: string;
    imageId?: number;
    duration?: number;
  }) => {
    const created = (await mascotVideoApi.createVideoRecord({
      url: params.url,
      image_id: params.imageId,
      duration: params.duration ?? 0,
    })) as { id?: number; video_id?: number };

    return created.id ?? created.video_id ?? null;
  };

  return {
    mascot,
    setMascot,
    applyMascot,
    startMascotJob,
    waitForMascotJobCompletion,
    createMascotVideoRecord,
    isApplyingMascot,
    mascotProgress,
  };
}
