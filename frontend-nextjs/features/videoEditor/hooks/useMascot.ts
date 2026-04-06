/**
 * Mascot Hook
 * Manages mascot application to video
 */

import { useState } from "react";
import type { MascotOption } from "@/features/videoEditor/types";
import {
  mascotApi,
  mascotVideoApi,
  type MascotParams,
} from "../api/editor.api";
import { toast } from "sonner";
import { authStorageHelper } from "@/store/auth";
import {
  createMediaUploadSocket,
  type VideoCompletedEvent,
  type VideoErrorEvent,
} from "@/features/upload/api/upload.websocket";

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
    setMascotProgress("Đang gửi yêu cầu tạo video mascot...");

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

    const user = authStorageHelper.getUser() as {
      id?: number;
      user_id?: number;
    } | null;
    const userId = user?.id ?? user?.user_id ?? null;

    if (!userId) {
      setIsApplyingMascot(false);
      setMascotProgress("");
      throw new Error(
        "Không tìm thấy thông tin người dùng để theo dõi socket.",
      );
    }

    const jobId = await mascotApi.startJob({
      videoOrUrl: videoSrc,
      mascotImageUrl,
      position: mascotOption.position,
      margin_x: mascotOption.margin_x,
      margin_y: mascotOption.margin_y,
      scale: mascotOption.scale,
      audio: mascotOption.audioFile,
    });

    setMascotProgress("Đang chờ video hoàn tất...");

    await new Promise<void>((resolve, reject) => {
      const socket = createMediaUploadSocket(userId);

      const cleanup = () => {
        socket.off("video:completed", onVideoCompleted);
        socket.off("video:error", onVideoError);
        socket.disconnect();
      };

      const finish = async (downloadUrl: string) => {
        const response = await fetch(downloadUrl);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        setIsApplyingMascot(false);
        setMascotProgress("");

        if (applyMascot.currentOnSuccess) {
          applyMascot.currentOnSuccess({
            blobUrl,
            downloadUrl,
          });
        }
      };

      const onVideoCompleted = async (payload: VideoCompletedEvent) => {
        if (payload.data.type !== "mascot") return;

        try {
          cleanup();
          await finish(payload.data.url);
          resolve();
        } catch (error) {
          cleanup();
          reject(error);
        }
      };

      const onVideoError = (payload: VideoErrorEvent) => {
        cleanup();
        setIsApplyingMascot(false);
        setMascotProgress("");
        reject(
          new Error(payload.error?.message ?? "Tạo mascot video thất bại."),
        );
      };

      socket.on("video:completed", onVideoCompleted);
      socket.on("video:error", onVideoError);

      if (!jobId) {
        cleanup();
        reject(new Error("Không thể tạo job mascot."));
      }
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
    createMascotVideoRecord,
    isApplyingMascot,
    mascotProgress,
  };
}
