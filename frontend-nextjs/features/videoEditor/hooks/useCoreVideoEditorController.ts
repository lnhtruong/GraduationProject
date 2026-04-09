"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSensors, useSensor, PointerSensor } from "@dnd-kit/core";
import type {
  DragEndEvent,
  DragMoveEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { authStorageHelper } from "@/store/auth";
import type {
  ExternalEditorPanelBindings,
  LayerItem,
  TextOption,
  VideoFrameSize,
} from "@/features/videoEditor/types";
import useVideoEditor from "./useVideoEditor";
import {
  applyCornerSnap,
  clampPreviewPlacement,
  deriveScaleFromDisplayWidth,
  deriveBackendMascotFromPreview,
  getMascotDisplaySize,
} from "@/features/videoEditor/utils/mascotPlacement";
import {
  createMediaUploadSocket,
  type VideoCompletedEvent,
  type VideoErrorEvent,
} from "@/features/upload/api/upload.websocket";

export interface CoreVideoEditorControllerProps {
  disableUpload?: boolean;
  initialVideoUrl?: string;
  sourceVideoName?: string;
  editId?: number | null;
  queuedTextTemplate?: string | null;
  onQueuedTextTemplateConsumed?: () => void;
  onPanelBindingsChange?: (bindings: ExternalEditorPanelBindings) => void;
  existingMascotOverlay?: {
    mascot_overlay_id: number;
    image_id?: number | null;
    position_x: number;
    position_y: number;
    scale: number;
    mascotImage?: {
      image_id: number;
      url: string;
    };
  } | null;
  existingMascotOverlayId?: number | null;
  onFinalizeMascotProject?: (payload: {
    videoId?: number;
    videoUrl?: string;
  }) => Promise<void> | void;
}

export function useCoreVideoEditorController({
  disableUpload = false,
  initialVideoUrl,
  sourceVideoName,
  editId,
  queuedTextTemplate,
  onQueuedTextTemplateConsumed,
  onPanelBindingsChange,
  existingMascotOverlay,
  existingMascotOverlayId,
  onFinalizeMascotProject,
}: CoreVideoEditorControllerProps) {
  const editor = useVideoEditor(initialVideoUrl);
  const {
    videoRef,
    videoSrc,
    setVideoSrc,
    originalVideoFile,
    effect,
    setEffect,
    layers,
    handleAddText,
    handleUpdateText,
    handleRemoveText,
    mascot,
    setMascot,
    applyMascot,
    startMascotJob,
    isApplyingMascot,
    mascotProgress,
    voice,
    setVoice,
    download,
  } = editor;

  const [activeItem, setActiveItem] = useState<LayerItem | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCreatingMascotVideo, setIsCreatingMascotVideo] = useState(false);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [mascotFrameSize, setMascotFrameSize] = useState<VideoFrameSize | null>(
    null,
  );
  const appliedOverlayRef = useRef<string | null>(null);
  const mascotDragStartRef = useRef<{
    source: "mascot-preview" | "mascot-resize";
    placement: NonNullable<typeof mascot.previewPlacement>;
    scale: number;
  } | null>(null);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [videoDurationMs, setVideoDurationMs] = useState(30_000);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onTime = () => setCurrentTimeMs(video.currentTime * 1000);
    const onMeta = () => {
      if (video.duration && isFinite(video.duration)) {
        setVideoDurationMs(video.duration * 1000);
      }
    };
    video.addEventListener("timeupdate", onTime);
    video.addEventListener("loadedmetadata", onMeta);
    video.addEventListener("durationchange", onMeta);
    if (video.readyState >= 1) onMeta();
    return () => {
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("loadedmetadata", onMeta);
      video.removeEventListener("durationchange", onMeta);
    };
  }, [videoRef]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onMeta = () => {
      if (video.duration && isFinite(video.duration)) {
        setVideoDurationMs(video.duration * 1000);
      }
    };
    if (video.readyState >= 1) {
      onMeta();
    } else {
      video.addEventListener("loadedmetadata", onMeta, { once: true });
      return () => video.removeEventListener("loadedmetadata", onMeta);
    }
  }, [videoSrc, videoRef]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedTextId) return;
      const tag = (document.activeElement as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        handleRemoveText(selectedTextId);
        setSelectedTextId(null);
        return;
      }

      const step = e.shiftKey ? 5 : 1;
      const arrowMap: Record<string, { dx: number; dy: number }> = {
        ArrowLeft: { dx: -step, dy: 0 },
        ArrowRight: { dx: step, dy: 0 },
        ArrowUp: { dx: 0, dy: -step },
        ArrowDown: { dx: 0, dy: step },
      };
      const delta = arrowMap[e.key];
      if (!delta) return;
      e.preventDefault();

      const layer = layers.find((l) => l.id === selectedTextId);
      if (layer?.type !== "text") return;
      const { x, y } = layer.data.position;
      handleUpdateText(selectedTextId, {
        position: {
          x: Math.min(100, Math.max(0, x + delta.dx)),
          y: Math.min(100, Math.max(0, y + delta.dy)),
        },
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedTextId, layers, handleRemoveText, handleUpdateText]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  const handlePreviewDragStart = (event: DragStartEvent) => {
    const id = String(event.active.id);
    const item = layers.find((l) => l.id === id);
    const source = event.active.data.current?.source;

    if (
      (source === "mascot-preview" || source === "mascot-resize") &&
      mascot.previewPlacement
    ) {
      mascotDragStartRef.current = {
        source,
        placement: mascot.previewPlacement,
        scale: mascot.scale,
      };
    }

    if (item) setActiveItem(item);
  };

  const handlePreviewDragMove = (event: DragMoveEvent) => {
    const source = event.active.data.current?.source;

    if (!mascotFrameSize || !mascot.previewPlacement) return;

    if (source === "mascot-preview") {
      const start = mascotDragStartRef.current;
      const startPlacement =
        start?.source === "mascot-preview"
          ? start.placement
          : mascot.previewPlacement;
      const scale =
        start?.source === "mascot-preview" ? start.scale : mascot.scale;
      const scaleX = mascotFrameSize.scaleX ?? 1;
      const scaleY = mascotFrameSize.scaleY ?? 1;

      const movedPlacement = clampPreviewPlacement(
        {
          ...startPlacement,
          x: startPlacement.x + event.delta.x / Math.max(scaleX, 0.0001),
          y: startPlacement.y + event.delta.y / Math.max(scaleY, 0.0001),
          hasPlaced: true,
        },
        mascotFrameSize,
        scale,
        mascot.sourceWidth,
        mascot.sourceHeight,
      );

      setMascot((prev) => ({
        ...prev,
        previewPlacement: {
          ...movedPlacement,
          hasPlaced: true,
        },
      }));
    }

    if (source === "mascot-resize") {
      const start = mascotDragStartRef.current;
      const startPlacement =
        start?.source === "mascot-resize"
          ? start.placement
          : mascot.previewPlacement;
      const startScale =
        start?.source === "mascot-resize" ? start.scale : mascot.scale;

      const startSize = getMascotDisplaySize(
        mascotFrameSize,
        startScale,
        startPlacement.aspectRatio,
        mascot.sourceWidth,
        mascot.sourceHeight,
      );
      const nextDisplayWidth = Math.max(20, startSize.width + event.delta.x);
      const nextScale = deriveScaleFromDisplayWidth(
        mascotFrameSize,
        nextDisplayWidth,
        mascot.sourceWidth,
      );
      const nextPlacement = clampPreviewPlacement(
        startPlacement,
        mascotFrameSize,
        nextScale,
        mascot.sourceWidth,
        mascot.sourceHeight,
      );

      setMascot((prev) => ({
        ...prev,
        scale: nextScale,
        previewPlacement: {
          ...nextPlacement,
          hasPlaced: true,
        },
      }));
    }
  };

  const handlePreviewDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const source = active.data.current?.source;

    if (source === "preview" && over?.id === "trash") {
      handleRemoveText(String(active.id));
    }

    if (
      source === "mascot-preview" &&
      over?.id === "video-preview-dropzone" &&
      mascotFrameSize &&
      mascot.previewPlacement
    ) {
      const start = mascotDragStartRef.current;
      const startPlacement =
        start?.source === "mascot-preview"
          ? start.placement
          : mascot.previewPlacement;
      const scale =
        start?.source === "mascot-preview" ? start.scale : mascot.scale;
      const scaleX = mascotFrameSize.scaleX ?? 1;
      const scaleY = mascotFrameSize.scaleY ?? 1;

      const movedPlacement = clampPreviewPlacement(
        {
          ...startPlacement,
          x: startPlacement.x + event.delta.x / Math.max(scaleX, 0.0001),
          y: startPlacement.y + event.delta.y / Math.max(scaleY, 0.0001),
          hasPlaced: true,
        },
        mascotFrameSize,
        scale,
        mascot.sourceWidth,
        mascot.sourceHeight,
      );

      const { snappedPlacement, snappedCorner } = applyCornerSnap(
        movedPlacement,
        mascotFrameSize,
        scale,
        mascot.sourceWidth,
        mascot.sourceHeight,
      );

      setMascot((prev) => ({
        ...prev,
        position: snappedCorner ?? prev.position,
        previewPlacement: {
          ...snappedPlacement,
          hasPlaced: true,
        },
      }));
    }

    if (
      source === "mascot-resize" &&
      over?.id === "video-preview-dropzone" &&
      mascotFrameSize &&
      mascot.previewPlacement
    ) {
      const start = mascotDragStartRef.current;
      const startPlacement =
        start?.source === "mascot-resize"
          ? start.placement
          : mascot.previewPlacement;
      const startScale =
        start?.source === "mascot-resize" ? start.scale : mascot.scale;

      const size = getMascotDisplaySize(
        mascotFrameSize,
        startScale,
        startPlacement.aspectRatio,
        mascot.sourceWidth,
        mascot.sourceHeight,
      );
      const nextDisplayWidth = Math.max(20, size.width + event.delta.x);
      const nextScale = deriveScaleFromDisplayWidth(
        mascotFrameSize,
        nextDisplayWidth,
        mascot.sourceWidth,
      );
      const nextPlacement = clampPreviewPlacement(
        startPlacement,
        mascotFrameSize,
        nextScale,
        mascot.sourceWidth,
        mascot.sourceHeight,
      );

      setMascot((prev) => ({
        ...prev,
        scale: nextScale,
        previewPlacement: {
          ...nextPlacement,
          hasPlaced: true,
        },
      }));
    }

    mascotDragStartRef.current = null;
    setActiveItem(null);
  };

  const handlePreviewDragCancel = () => {
    mascotDragStartRef.current = null;
    setActiveItem(null);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await download();
    } catch (err) {
      console.error("Download error:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleMascotApply = useCallback(async () => {
    const hasSelectedVideo =
      Boolean(videoSrc) && videoSrc !== "/videos/Download.mp4";
    if (
      !hasSelectedVideo ||
      (disableUpload && !originalVideoFile && !hasSelectedVideo)
    ) {
      toast.error("Không có video để áp dụng mascot.");
      return;
    }

    if (mascot.type !== "none" && mascot.position !== "replace") {
      if (!mascot.previewPlacement?.hasPlaced) {
        toast.warning("Hãy kéo mascot lên video trước khi áp dụng.");
        return;
      }

      if (!mascotFrameSize) {
        toast.error(
          "Không thể xác định kích thước khung video để áp dụng mascot.",
        );
        return;
      }
    }

    const computedMascot =
      mascot.position !== "replace" && mascotFrameSize
        ? deriveBackendMascotFromPreview(mascot, mascotFrameSize)
        : mascot;

    await applyMascot(
      computedMascot,
      videoSrc,
      sourceVideoName,
      ({ blobUrl }) => {
        setVideoSrc(blobUrl);
      },
    );
  }, [
    videoSrc,
    disableUpload,
    originalVideoFile,
    applyMascot,
    mascot,
    mascotFrameSize,
    sourceVideoName,
    setVideoSrc,
  ]);

  const handleCreateMascotVideo = useCallback(async () => {
    const hasSelectedVideo =
      Boolean(videoSrc) && videoSrc !== "/videos/Download.mp4";

    if (
      !hasSelectedVideo ||
      (disableUpload && !originalVideoFile && !hasSelectedVideo)
    ) {
      toast.error("Không có video để tạo mascot video.");
      return;
    }

    if (mascot.type === "none") {
      toast.warning("Hãy chọn mascot trước khi tạo video mascot.");
      return;
    }

    if (mascot.position !== "replace") {
      if (!mascot.previewPlacement?.hasPlaced) {
        toast.warning("Hãy kéo mascot lên video trước khi tạo mascot video.");
        return;
      }

      if (!mascotFrameSize) {
        toast.error("Không thể xác định kích thước khung video.");
        return;
      }
    }

    const computedMascot =
      mascot.position !== "replace" && mascotFrameSize
        ? deriveBackendMascotFromPreview(mascot, mascotFrameSize)
        : mascot;

    setIsCreatingMascotVideo(true);

    try {
      const jobId = await startMascotJob(
        computedMascot,
        videoSrc,
        sourceVideoName,
      );
      if (!jobId) return;

      toast(
        "Video của bạn đang được tạo. Bạn có thể xem video ở Library của bạn sau.",
      );

      const user = authStorageHelper.getUser() as {
        id?: number;
        user_id?: number;
      } | null;
      const userId = user?.id ?? user?.user_id ?? null;
      if (!userId) {
        throw new Error(
          "Không tìm thấy thông tin người dùng để theo dõi socket.",
        );
      }

      await new Promise<void>((resolve, reject) => {
        const socket = createMediaUploadSocket(userId);

        const cleanup = () => {
          socket.off("video:completed", onVideoCompleted);
          socket.off("video:error", onVideoError);
          socket.disconnect();
        };

        const onVideoCompleted = async (payload: VideoCompletedEvent) => {
          if (payload.data.type !== "mascot") return;

          try {
            await onFinalizeMascotProject?.({
              videoId: payload.data.id,
              videoUrl: payload.data.url,
            });
            cleanup();
            resolve();
          } catch (error) {
            cleanup();
            reject(error);
          }
        };

        const onVideoError = (payload: VideoErrorEvent) => {
          cleanup();
          reject(
            new Error(payload.error?.message ?? "Tạo mascot video thất bại."),
          );
        };

        socket.on("video:completed", onVideoCompleted);
        socket.on("video:error", onVideoError);
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`Tạo mascot video thất bại: ${message}`);
    } finally {
      setIsCreatingMascotVideo(false);
    }
  }, [
    videoSrc,
    disableUpload,
    originalVideoFile,
    mascot,
    mascotFrameSize,
    startMascotJob,
    sourceVideoName,
    onFinalizeMascotProject,
  ]);

  const hasSelectedVideo =
    Boolean(videoSrc) && videoSrc !== "/videos/Download.mp4";
  const needsVideoSelection = !originalVideoFile && !hasSelectedVideo;

  const handleSeek = useCallback(
    (ms: number) => {
      const video = videoRef.current;
      if (!video) return;
      video.currentTime = ms / 1000;
      setCurrentTimeMs(ms);
    },
    [videoRef],
  );

  useEffect(() => {
    if (!existingMascotOverlay) {
      appliedOverlayRef.current = null;
      return;
    }

    const rawX = existingMascotOverlay.position_x;
    const rawY = existingMascotOverlay.position_y;
    const looksLikeLegacyPercent = rawX <= 100 && rawY <= 100;

    const resolvedX =
      looksLikeLegacyPercent && mascotFrameSize
        ? Math.round((rawX / 100) * mascotFrameSize.width)
        : Math.round(rawX);
    const resolvedY =
      looksLikeLegacyPercent && mascotFrameSize
        ? Math.round((rawY / 100) * mascotFrameSize.height)
        : Math.round(rawY);

    const overlayKey = [
      existingMascotOverlay.mascot_overlay_id,
      existingMascotOverlay.mascotImage?.url ?? "",
      resolvedX,
      resolvedY,
      existingMascotOverlay.scale,
    ].join("|");

    if (appliedOverlayRef.current === overlayKey) return;

    setMascot((prev) => {
      const restoredUrl = existingMascotOverlay.mascotImage?.url;
      if (!restoredUrl && prev.type === "none") return prev;

      return {
        ...prev,
        type: "custom",
        imageId: existingMascotOverlay.image_id ?? prev.imageId,
        presetUrl: restoredUrl ?? prev.presetUrl,
        customFile: undefined,
        presetId: undefined,
        position: prev.position === "replace" ? "bottom-right" : prev.position,
        scale:
          typeof existingMascotOverlay.scale === "number" &&
          existingMascotOverlay.scale > 0
            ? existingMascotOverlay.scale
            : prev.scale,
        previewPlacement: {
          x: resolvedX,
          y: resolvedY,
          aspectRatio: prev.previewPlacement?.aspectRatio ?? 1,
          hasPlaced: true,
        },
      };
    });

    appliedOverlayRef.current = overlayKey;
  }, [existingMascotOverlay, mascotFrameSize, setMascot]);

  useEffect(() => {
    if (!queuedTextTemplate) return;
    const newText: TextOption = {
      id: crypto.randomUUID(),
      text: queuedTextTemplate,
      position: { x: 50, y: 50 },
      fontSize: 32,
      color: "#FFFFFF",
      fontFamily: "Arial",
      fontWeight: "bold",
      fontStyle: "normal",
      textDecoration: "none",
      textAlign: "center",
      startTime: 0,
      duration: Math.min(5000, videoDurationMs),
      width: 300,
      height: 100,
    };
    handleAddText(newText);
    setSelectedTextId(newText.id);
    onQueuedTextTemplateConsumed?.();
  }, [
    queuedTextTemplate,
    videoDurationMs,
    handleAddText,
    onQueuedTextTemplateConsumed,
  ]);

  useEffect(() => {
    onPanelBindingsChange?.({
      editId,
      effect,
      onEffectChange: setEffect,
      mascot,
      onMascotChange: setMascot,
      onMascotApply: handleMascotApply,
      onMascotCreateVideo: handleCreateMascotVideo,
      existingMascotOverlayId,
      isApplyingMascot,
      isCreatingMascotVideo,
      mascotProgress,
      videoFile: originalVideoFile,
      videoSourceUrl: hasSelectedVideo ? videoSrc : undefined,
      mascotFrameSize,
      voice,
      onVoiceChange: setVoice,
      layers,
      onTextAdd: handleAddText,
      onTextUpdate: handleUpdateText,
      onTextRemove: handleRemoveText,
      selectedTextId,
      onTextSelect: setSelectedTextId,
    });
  }, [
    editId,
    effect,
    mascot,
    existingMascotOverlayId,
    isApplyingMascot,
    isCreatingMascotVideo,
    mascotProgress,
    originalVideoFile,
    videoSrc,
    hasSelectedVideo,
    mascotFrameSize,
    voice,
    layers,
    selectedTextId,
    onPanelBindingsChange,
    setEffect,
    setMascot,
    setVoice,
    handleMascotApply,
    handleCreateMascotVideo,
    handleAddText,
    handleUpdateText,
    handleRemoveText,
  ]);

  const buildEditorPayload = () => {
    const textLayers = layers
      .filter((l): l is LayerItem & { type: "text" } => l.type === "text")
      .map((l, idx, arr) => ({
        id: l.data.id,
        content: l.data.text,
        position: { xPct: l.data.position.x, yPct: l.data.position.y },
        timeline: {
          startMs: l.data.startTime ?? 0,
          durationMs: l.data.duration ?? 0,
        },
        dimensions: {
          widthPx: l.data.width ?? 200,
          heightPx: l.data.height ?? 60,
        },
        style: {
          fontSize: l.data.fontSize,
          fontFamily: l.data.fontFamily,
          fontWeight: l.data.fontWeight,
          fontStyle: l.data.fontStyle,
          textDecoration: l.data.textDecoration,
          textAlign: l.data.textAlign,
          color: l.data.color,
        },
        zIndex: arr.length - idx,
      }));

    return {
      videoSourceUrl: hasSelectedVideo ? videoSrc : undefined,
      videoDurationMs,
      effects: { ...effect },
      textLayers,
      mascot:
        mascot.type !== "none"
          ? {
              type: mascot.type,
              position: mascot.position,
              presetId: mascot.presetId,
              presetUrl: mascot.presetUrl,
              scale: mascot.scale,
              margin_x: mascot.margin_x,
              margin_y: mascot.margin_y,
            }
          : null,
      voice:
        voice.type !== "none"
          ? {
              type: voice.type,
              presetId: voice.presetId,
              speed: voice.speed,
              volume: voice.volume,
              pitch: voice.pitch,
            }
          : null,
    };
  };

  const handleSave = () => {
    const payload = buildEditorPayload();
    console.log("[EditorExport] Payload sẵn sàng gửi backend:", payload);
    console.log("[EditorExport] JSON:\n", JSON.stringify(payload, null, 2));
  };

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      (window as unknown as Record<string, unknown>).__editorPayload =
        buildEditorPayload;
    }
  });

  const visibleLayers = layers.filter((layer) => {
    if (layer.type !== "text") return true;
    const start = layer.data.startTime ?? 0;
    const dur =
      layer.data.duration && layer.data.duration > 0
        ? layer.data.duration
        : Infinity;
    return currentTimeMs >= start && currentTimeMs <= start + dur;
  });

  return {
    editor,
    activeItem,
    isDownloading,
    isCreatingMascotVideo,
    selectedTextId,
    mascotFrameSize,
    currentTimeMs,
    videoDurationMs,
    sensors,
    handlePreviewDragStart,
    handlePreviewDragMove,
    handlePreviewDragEnd,
    handlePreviewDragCancel,
    handleDownload,
    handleMascotApply,
    handleCreateMascotVideo,
    handleSeek,
    handleMascotFrameChange: setMascotFrameSize,
    visibleLayers,
    needsVideoSelection,
    hasSelectedVideo,
    buildEditorPayload,
    handleSave,
    setSelectedTextId,
  } as const;
}
