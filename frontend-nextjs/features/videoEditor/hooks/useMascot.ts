/**
 * Mascot Hook
 * Manages mascot application to video
 */

import { useState } from "react";
import { useProcessMascot, useMascotJobStatus } from "../api/editor.hooks";
import type { MascotOption } from "@/features/videoEditor/types";

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
        applyMascot.currentOnSuccess(blobUrl);
      }
    },
    onError: (error) => {
      console.error("[useMascot] Error:", error);
      alert(`Lỗi: ${error.message}`);
      setIsApplyingMascot(false);
      setMascotProgress("");
    },
  });

  const applyMascot = async (
    mascotOption: MascotOption,
    videoFile: File,
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

    // Validate params (basic validation without max margins)
    // Max margins will be calculated by API
    if (mascotOption.margin_x < 0 || mascotOption.margin_y < 0) {
      alert("Lề không được âm");
      return;
    }

    if (mascotOption.scale < 0.1 || mascotOption.scale > 2.0) {
      alert("Kích thước phải từ 0.1 đến 2.0");
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
    });

    // Start processing with React Query
    await processMascot.mutateAsync({
      videoOrUrl: videoFile,
      mascotImage: mascotFile,
      position: mascotOption.position,
      margin_x: mascotOption.margin_x,
      margin_y: mascotOption.margin_y,
      scale: mascotOption.scale,
      audio: mascotOption.audioFile,
    });
  };

  // Store callback reference on function
  applyMascot.currentOnSuccess = null as ((blobUrl: string) => void) | null;

  return {
    mascot,
    setMascot,
    applyMascot,
    isApplyingMascot,
    mascotProgress,
  };
}
