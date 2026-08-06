import { useState } from "react";
import { toast } from "sonner";
import { authStorageHelper } from "@/store/auth";
import type {
  EffectOption,
  MascotOption,
  MascotParams,
  MascotRenderTextOverlay,
} from "@/features/editor/types";
import { getUserFacingErrorMessage } from "@/lib/user-facing-error";
import { waitForMascotJobCompletion } from "@/features/editor/utils/mascot-job.utils";
import { useMascotJob } from "../api/mascot.hooks";

export type MascotRenderOptions = {
  textOverlays?: MascotRenderTextOverlay[];
  effect?: EffectOption;
  /** Thời lượng video, giây. Dùng để backend tính credit quota. */
  durationSec?: number;
};

function resolvePublicAssetUrl(value: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
  const fallbackOrigin =
    typeof window !== "undefined" ? window.location.origin : undefined;
  return new URL(value, siteUrl || fallbackOrigin).toString();
}

export function useMascot() {
  const [mascot, setMascot] = useState<MascotOption>({
    type: "none",
    position: "bottom-right",
    margin_x: 40,
    margin_y: 40,
    scale: 1,
    removeBackground: false,
    bgMode: "green_screen",
    bgQualityMode: "fast",
    greenScreenColor: "00FF00",
    qualityMode: "ultrafast",
    animationMode: "animal",
  });

  const [isApplyingMascot, setIsApplyingMascot] = useState(false);
  const [mascotProgress, setMascotProgress] = useState<string>("");
  const startJobMutation = useMascotJob();

  const resolveMascotImageUrl = (mascotOption: MascotOption): string | null => {
    if (mascotOption.type === "none") return null;

    if (mascotOption.type === "custom") {
      if (mascotOption.presetUrl) return mascotOption.presetUrl;

      if (mascotOption.customFile) {
        toast.warning("Ảnh mascot đang được tải lên, vui lòng chờ hoàn tất.");
        return null;
      }

      toast.warning("Vui lòng tải ảnh mascot lên trước khi tạo video.");
      return null;
    }

    if (mascotOption.type === "preset" && mascotOption.presetUrl) {
      try {
        return resolvePublicAssetUrl(mascotOption.presetUrl);
      } catch {
        toast.warning("Không thể xác định URL ảnh mascot.");
        return null;
      }
    }

    toast.warning("Vui lòng chọn mascot hợp lệ.");
    return null;
  };

  const validateMascotOption = (mascotOption: MascotOption): boolean => {
    if (mascotOption.margin_x < 0 || mascotOption.margin_y < 0) {
      toast.warning("Lề không được âm.");
      return false;
    }

    if (mascotOption.scale < 0.1 || mascotOption.scale > 2.0) {
      toast.warning("Kích thước mascot phải từ 0.1 đến 2.0.");
      return false;
    }

    return true;
  };

  const buildPayload = (
    mascotOption: MascotOption,
    videoSrc: string,
    sourceVideoName: string | undefined,
    mascotImageUrl: string,
    renderOptions?: MascotRenderOptions,
  ): MascotParams => ({
    videoOrUrl: videoSrc,
    mascotImageUrl,
    type: "mascot",
    origin_file_name:
      sourceVideoName?.trim() ||
      (() => {
        try {
          return (
            new URL(videoSrc).pathname.split("/").filter(Boolean).pop() ||
            "studyloop-video.mp4"
          );
        } catch {
          return "studyloop-video.mp4";
        }
      })(),
    position: mascotOption.position,
    margin_x: mascotOption.margin_x,
    margin_y: mascotOption.margin_y,
    scale: mascotOption.scale,
    durationSec: renderOptions?.durationSec,
    audio: mascotOption.audioFile,
    textOverlays: renderOptions?.textOverlays,
    brightness: renderOptions?.effect?.brightness,
    contrast: renderOptions?.effect?.contrast,
    saturation: renderOptions?.effect?.saturation,
    removeBackground: mascotOption.removeBackground,
    bgMode:
      mascotOption.bgMode === "transparent" ? "original" : mascotOption.bgMode,
    bgQualityMode: mascotOption.bgQualityMode,
    animationMode: mascotOption.animationMode,
    qualityMode: mascotOption.qualityMode,
    drivingMultiplier: mascotOption.drivingMultiplier,
    flagStitching: mascotOption.flagStitching,
    flagPasteback: mascotOption.flagPasteback,
    flagNormalizeLip: mascotOption.flagNormalizeLip,
    flagRelativeMotion: mascotOption.flagRelativeMotion,
    flagDoCrop: mascotOption.flagDoCrop,
    cropScale: mascotOption.cropScale,
    vxRatio: mascotOption.vxRatio,
    vyRatio: mascotOption.vyRatio,
  });

  const getCurrentUserId = (): number => {
    const user = authStorageHelper.getUser() as {
      id?: number;
      user_id?: number;
    } | null;
    const userId = user?.id ?? user?.user_id ?? null;

    if (!userId) {
      throw new Error("Không tìm thấy thông tin người dùng để theo dõi tiến trình.");
    }

    return userId;
  };

  const applyMascot = async (
    mascotOption: MascotOption,
    videoSrc: string,
    sourceVideoName: string | undefined,
    onSuccess: (result: { blobUrl: string; downloadUrl: string }) => void,
    renderOptions?: MascotRenderOptions,
  ) => {
    const mascotImageUrl = resolveMascotImageUrl(mascotOption);
    if (!mascotImageUrl || !validateMascotOption(mascotOption)) return;

    setIsApplyingMascot(true);
    setMascotProgress("Đang gửi yêu cầu tạo video mascot...");

    try {
      const userId = getCurrentUserId();
      const payload = buildPayload(
        mascotOption,
        videoSrc,
        sourceVideoName,
        mascotImageUrl,
        renderOptions,
      );
      const jobId = await startJobMutation.mutateAsync(payload);

      setMascotProgress("Đang chờ video hoàn tất...");

      const result = await waitForMascotJobCompletion({
        jobId,
        userId,
        onProgress: setMascotProgress,
      });

      if (!result.url) {
        throw new Error("Không tìm thấy URL video mascot.");
      }

      onSuccess({ blobUrl: result.url, downloadUrl: result.url });
    } catch (error) {
      toast.error(
        getUserFacingErrorMessage(
          error,
          "Không thể tạo video mascot. Vui lòng thử lại.",
        ),
      );
      throw error;
    } finally {
      setIsApplyingMascot(false);
      setMascotProgress("");
    }
  };

  const startMascotJob = async (
    mascotOption: MascotOption,
    videoSrc: string,
    sourceVideoName?: string,
    renderOptions?: MascotRenderOptions,
  ): Promise<string | null> => {
    const mascotImageUrl = resolveMascotImageUrl(mascotOption);
    if (!mascotImageUrl || !validateMascotOption(mascotOption)) return null;

    setMascotProgress("Đang gửi yêu cầu tạo video mascot...");

    const payload = buildPayload(
      mascotOption,
      videoSrc,
      sourceVideoName,
      mascotImageUrl,
      renderOptions,
    );

    try {
      const jobId = await startJobMutation.mutateAsync(payload);
      setMascotProgress("");
      return jobId;
    } catch (error) {
      setMascotProgress("");
      throw error;
    }
  };

  return {
    mascot,
    setMascot,
    applyMascot,
    startMascotJob,
    isApplyingMascot,
    mascotProgress,
    setMascotProgress,
  };
}
