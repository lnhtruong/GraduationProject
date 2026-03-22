/**
 * Mascot Hook
 * Manages mascot application to video
 */

import { useRef, useState } from "react";
import { useProcessMascot } from "../api/editor.hooks";
import type { MascotOption } from "@/features/videoEditor/types";
import { convertPlacementToBackendParams } from "@/features/videoEditor/utils/mascotPlacement";

export function useMascot() {
  const onSuccessRef = useRef<((blobUrl: string) => void) | null>(null);

  const [mascot, setMascot] = useState<MascotOption>({
    type: "none",
    position: "bottom-right",
    margin_x: 40,
    margin_y: 40,
    scale: 1,
    uiPlacement: {
      xPercent: 85,
      yPercent: 85,
      widthPercent: 20,
    },
  });

  const [isApplyingMascot, setIsApplyingMascot] = useState(false);
  const [mascotProgress, setMascotProgress] = useState<string>("");

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
      if (onSuccessRef.current) {
        onSuccessRef.current(blobUrl);
      }

      onSuccessRef.current = null;
    },
    onError: (error) => {
      console.error("[useMascot] Error:", error);
      alert(`Lỗi: ${error.message}`);
      setIsApplyingMascot(false);
      setMascotProgress("");
      onSuccessRef.current = null;
    },
  });

  const applyMascot = async (
    mascotOption: MascotOption,
    videoSrc: string,
    videoSourceForMetadata: File | string,
    onSuccess: (blobUrl: string) => void,
  ) => {
    if (mascotOption.type === "none") {
      console.log("No mascot to apply");
      return;
    }

    // Get mascot file (from custom upload OR preset URL)
    let mascotFile: File;

    if (mascotOption.type === "custom" && mascotOption.customFile) {
      mascotFile = mascotOption.customFile;
    } else if (mascotOption.type === "preset" && mascotOption.presetUrl) {
      try {
        console.log("Fetching preset mascot from:", mascotOption.presetUrl);
        const response = await fetch(mascotOption.presetUrl);
        const blob = await response.blob();
        mascotFile = new File([blob], `${mascotOption.presetId}.jpg`, {
          type: "image/jpg",
        });
        console.log("Preset mascot loaded:", mascotFile);
      } catch (error) {
        console.error("Failed to load preset mascot:", error);
        alert("Không thể tải mascot có sẵn. Vui lòng thử lại.");
        return;
      }
    } else {
      alert("Vui lòng chọn file mascot");
      return;
    }

    const backendParams = await convertPlacementToBackendParams(
      mascotOption,
      videoSourceForMetadata,
    );

    if (backendParams.margin_x < 0 || backendParams.margin_y < 0) {
      alert("Lề không được âm");
      return;
    }

    if (backendParams.scale < 0.1 || backendParams.scale > 2.0) {
      alert("Kích thước phải từ 0.1 đến 2.0");
      return;
    }

    setIsApplyingMascot(true);
    setMascotProgress("Đang tải lên...");

    // Store callback for later use
    onSuccessRef.current = onSuccess;

    console.log("Applying mascot with params:", {
      position: backendParams.position,
      margin_x: backendParams.margin_x,
      margin_y: backendParams.margin_y,
      scale: backendParams.scale,
      type: mascotOption.type,
      audio: mascotOption.audioFile?.name,
    });

    // Start processing with React Query
    await processMascot.mutateAsync({
      videoOrUrl: videoSrc,
      mascotImage: mascotFile,
      position: backendParams.position,
      margin_x: backendParams.margin_x,
      margin_y: backendParams.margin_y,
      scale: backendParams.scale,
      audio: mascotOption.audioFile,
    });
  };

  return {
    mascot,
    setMascot,
    applyMascot,
    isApplyingMascot,
    mascotProgress,
  };
}
