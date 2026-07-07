/**
 * Mascot Hook - Refactored
 * Manages mascot form state + uses mutation hooks for API interactions
 */

import { useState } from "react";
import type { MascotOption } from "@/features/editor/types";
import { useMascotJob } from "../api/mascot.hooks";
import type { MascotParams } from "../types";
import { toast } from "sonner";
import { authStorageHelper } from "@/store/auth";
import {
  createMediaUploadStream,
  type VideoCompletedPayload,
  type VideoErrorPayload,
} from "@/features/_shared/realtime/media-upload-stream";
import { getUserFacingErrorMessage } from "@/lib/user-facing-error";

export function useMascot() {
  // ============================================================================
  // STATE
  // ============================================================================

  const [mascot, setMascot] = useState<MascotOption>({
    type: "none",
    position: "bottom-right",
    margin_x: 40,
    margin_y: 40,
    scale: 1,
  });

  const [isApplyingMascot, setIsApplyingMascot] = useState(false);
  const [mascotProgress, setMascotProgress] = useState<string>("");

  // ============================================================================
  // MUTATION HOOKS
  // ============================================================================

  const startJobMutation = useMascotJob();

  // ============================================================================
  // HELPERS
  // ============================================================================

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

  // ============================================================================
  // MAIN OPERATIONS
  // ============================================================================

  const applyMascot = async (
    mascotOption: MascotOption,
    videoSrc: string,
    sourceVideoName: string | undefined,
    onSuccess: (result: { blobUrl: string; downloadUrl: string }) => void,
  ) => {
    const mascotImageUrl = resolveMascotImageUrl(mascotOption);
    if (!mascotImageUrl || !validateMascotOption(mascotOption)) {
      return;
    }

    setIsApplyingMascot(true);
    setMascotProgress("Đang gửi yêu cầu tạo video mascot...");

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

    try {
      console.log("Applying mascot with params:", {
        position: mascotOption.position,
        margin_x: mascotOption.margin_x,
        margin_y: mascotOption.margin_y,
        scale: mascotOption.scale,
        type: mascotOption.type,
        audio: mascotOption.audioFile?.name,
        mascotImageUrl,
      });

      const payload: MascotParams = {
        videoOrUrl: videoSrc,
        mascotImageUrl,
        origin_file_name: sourceVideoName,
        position: mascotOption.position,
        margin_x: mascotOption.margin_x,
        margin_y: mascotOption.margin_y,
        scale: mascotOption.scale,
        audio: mascotOption.audioFile,
      };

      const jobId = await startJobMutation.mutateAsync(payload);
      setMascotProgress("Đang chờ video hoàn tất...");

      await listenForJobCompletion(jobId, userId, onSuccess);
    } catch (error) {
      setIsApplyingMascot(false);
      setMascotProgress("");
      toast.error(
        getUserFacingErrorMessage(
          error,
          "Không thể tạo video mascot. Vui lòng thử lại.",
        ),
      );
      throw error;
    }
  };

  const startMascotJob = async (
    mascotOption: MascotOption,
    videoSrc: string,
    sourceVideoName?: string,
  ): Promise<string | null> => {
    const mascotImageUrl = resolveMascotImageUrl(mascotOption);
    if (!mascotImageUrl || !validateMascotOption(mascotOption)) {
      return null;
    }

    setMascotProgress("Đang gửi yêu cầu tạo video mascot...");

    const payload: MascotParams = {
      videoOrUrl: videoSrc,
      mascotImageUrl,
      origin_file_name: sourceVideoName,
      position: mascotOption.position,
      margin_x: mascotOption.margin_x,
      margin_y: mascotOption.margin_y,
      scale: mascotOption.scale,
      audio: mascotOption.audioFile,
    };

    try {
      const jobId = await startJobMutation.mutateAsync(payload);
      setMascotProgress("");
      return jobId;
    } catch (error) {
      setMascotProgress("");
      throw error;
    }
  };

  // ============================================================================
  // SSE HANDLING
  // ============================================================================

  const listenForJobCompletion = (
    jobId: string,
    userId: number,
    onSuccess: (result: { blobUrl: string; downloadUrl: string }) => void,
  ): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      const stream = createMediaUploadStream(
        {
          onProgress: (payload) => {
            // Handle job stage updates
            if (payload.jobId === jobId && payload.stage) {
              setMascotProgress(`Processing: ${payload.stage}`);
            }
          },

          onCompleted: async (payload) => {
            // Only process completion for this specific job
            const payloadJobId = payload?.data?.job_id ?? payload?.data?.jobId;
            if (payloadJobId && payloadJobId !== jobId) {
              return; // Ignore other jobs
            }

            if (payload.data.type !== "mascot") {
              return; // Ignore non-mascot videos
            }

            const url = payload.data.url;
            if (!url) {
              stream.close();
              setIsApplyingMascot(false);
              setMascotProgress("");
              reject(new Error("Mascot video URL is missing"));
              return;
            }

            try {
              const response = await fetch(url);
              const blob = await response.blob();
              const blobUrl = URL.createObjectURL(blob);

              setIsApplyingMascot(false);
              setMascotProgress("");

              onSuccess({
                blobUrl,
                downloadUrl: url,
              });

              stream.close();
              resolve();
            } catch (error) {
              stream.close();
              setIsApplyingMascot(false);
              setMascotProgress("");
              reject(error);
            }
          },

          onError: (payload) => {
            // Only process error for this specific job
            const errorJobId = payload.jobId;
            if (errorJobId && errorJobId !== jobId) {
              return; // Ignore other jobs
            }

            stream.close();
            setIsApplyingMascot(false);
            setMascotProgress("");
            reject(
              new Error(payload.error?.message ?? "Tạo mascot video thất bại."),
            );
          },

          onConnectionError: (error) => {
            stream.close();
            setIsApplyingMascot(false);
            setMascotProgress("");
            reject(error);
          },
        },
        { userId },
      );

      if (!jobId) {
        stream.close();
        reject(new Error("Không thể tạo job mascot."));
      }
    });
  };

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    mascot,
    setMascot,
    applyMascot,
    startMascotJob,
    isApplyingMascot,
    mascotProgress,
  };
}
