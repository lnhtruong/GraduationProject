"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DragMoveEvent,
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { DragOverlay } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { Download, Save } from "lucide-react";
import VideoPreview from "@/features/videoEditor/components/VideoPreview";
import TimelinePanel from "@/features/videoEditor/components/TimelinePanel";
import TrashDropZone from "@/features/videoEditor/components/TrashDropZone";
import EditorMediaDropzone, {
  VideoDropData,
} from "@/features/videoEditor/components/EditorMediaDropzone";
import UploadDropzone from "@/features/upload/components/UploadDropzone";
import useVideoEditor from "@/features/videoEditor/hooks/useVideoEditor";
import { authStorageHelper } from "@/store/auth";
import { toast } from "sonner";
import type {
  ExternalEditorPanelBindings,
  LayerItem,
  TextOption,
  VideoFrameSize,
} from "@/features/videoEditor/types";
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

export interface CoreVideoEditorProps {
  onFirstVideoAdded?: (payload: {
    file?: File;
    url?: string;
    videoId?: number;
  }) => Promise<void> | void;
  onVideoDrop?: (video: VideoDropData) => void;
  disableUpload?: boolean;
  hideLeftToolbar?: boolean;
  hideTopBar?: boolean;
  initialVideoUrl?: string;
  queuedTextTemplate?: string | null;
  onQueuedTextTemplateConsumed?: () => void;
  onPanelBindingsChange?: (bindings: ExternalEditorPanelBindings) => void;
  editId?: number | null;
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

export default function CoreVideoEditor({
  onFirstVideoAdded,
  onVideoDrop,
  disableUpload = false,
  hideLeftToolbar = false,
  hideTopBar = false,
  initialVideoUrl,
  queuedTextTemplate,
  onQueuedTextTemplateConsumed,
  onPanelBindingsChange,
  editId,
  existingMascotOverlay,
  existingMascotOverlayId,
  onFinalizeMascotProject,
}: CoreVideoEditorProps) {
  const editor = useVideoEditor(initialVideoUrl);
  const {
    videoRef,
    videoSrc,
    setVideoSrc,
    originalVideoFile,
    setOriginalVideoFile,
    effect,
    setEffect,
    cssFilter,
    layers,
    handleAddText,
    handleUpdateText,
    handleRemoveText,
    handleReorderText,
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

  // ── Timeline state ──────────────────────────────────────────────────────────
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
    // Catch already-loaded metadata (cached video fires before effect runs)
    if (video.readyState >= 1) onMeta();
    return () => {
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("loadedmetadata", onMeta);
      video.removeEventListener("durationchange", onMeta);
    };
  }, [videoRef]);

  // Re-check duration when videoSrc changes (new cached video won't re-fire loadedmetadata)
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

  // ── Keyboard shortcuts for selected layer ────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedTextId) return;
      const tag = (document.activeElement as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return; // let text inputs handle keys

      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        handleRemoveText(selectedTextId);
        setSelectedTextId(null);
        return;
      }

      const STEP = e.shiftKey ? 5 : 1; // hold Shift for bigger step
      const arrowMap: Record<string, { dx: number; dy: number }> = {
        ArrowLeft: { dx: -STEP, dy: 0 },
        ArrowRight: { dx: STEP, dy: 0 },
        ArrowUp: { dx: 0, dy: -STEP },
        ArrowDown: { dx: 0, dy: STEP },
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

  // ── DnD sensors ─────────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  // ── Preview drag ─────────────────────────────────────────────────────────────
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

    if (!mascotFrameSize || !mascot.previewPlacement) {
      return;
    }

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

  // ── Download ─────────────────────────────────────────────────────────────────
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

  // ── Mascot apply ─────────────────────────────────────────────────────────────
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

    await applyMascot(computedMascot, videoSrc, ({ blobUrl }) => {
      setVideoSrc(blobUrl);
    });
  }, [
    videoSrc,
    disableUpload,
    originalVideoFile,
    applyMascot,
    mascot,
    mascotFrameSize,
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
      const jobId = await startMascotJob(computedMascot, videoSrc);
      if (!jobId) {
        return;
      }

      toast(
        "Video của bạn đang được tạo. Bạn có thể xem video ở Library của bạn sau.",
      );

      const userId = (() => {
        const user = authStorageHelper.getUser() as {
          id?: number;
          user_id?: number;
        } | null;
        return user?.id ?? user?.user_id ?? null;
      })();

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
      // Cập nhật state ngay lập tức để playhead không lag
      setCurrentTimeMs(ms);
    },
    [videoRef],
  );

  // ── Queued text template ──────────────────────────────────────────────────────
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

    if (appliedOverlayRef.current === overlayKey) {
      return;
    }

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

  // ── External panel bindings ───────────────────────────────────────────────────
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

  // ── Editor export payload ─────────────────────────────────────────────────────
  const buildEditorPayload = () => {
    const textLayers = layers
      .filter((l): l is LayerItem & { type: "text" } => l.type === "text")
      .map((l, idx, arr) => ({
        id: l.data.id,
        content: l.data.text,
        position: { xPct: l.data.position.x, yPct: l.data.position.y },
        timeline: {
          startMs: l.data.startTime ?? 0,
          durationMs: l.data.duration ?? 0, // 0 = hiện cả video
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
        zIndex: arr.length - idx, // layer đầu mảng = hiển thị trên cùng
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

  // ── Dev: expose payload builder lên window để gọi từ DevTools console ────────
  // Dùng: window.__editorPayload() hoặc copy(window.__editorPayload())
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      (window as unknown as Record<string, unknown>).__editorPayload =
        buildEditorPayload;
    }
  });

  // ── Visibility filter: chỉ hiện layer trong khoảng thời gian ─────────────────
  const visibleLayers = layers.filter((layer) => {
    if (layer.type !== "text") return true;
    const start = layer.data.startTime ?? 0;
    const dur =
      layer.data.duration && layer.data.duration > 0
        ? layer.data.duration
        : Infinity;
    return currentTimeMs >= start && currentTimeMs <= start + dur;
  });

  // ── Early return: upload screen ───────────────────────────────────────────────
  if (needsVideoSelection && !disableUpload) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold mb-2">Trình chỉnh sửa video</h1>
            <p className="text-muted-foreground">
              Tải lên video của bạn để bắt đầu chỉnh sửa
            </p>
          </div>
          <UploadDropzone
            onFileSelect={(file) => {
              const url = URL.createObjectURL(file);
              setVideoSrc(url);
              setOriginalVideoFile(file);
              void onFirstVideoAdded?.({ file, url });
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${hideTopBar ? "h-full" : "min-h-screen"} bg-background flex flex-col min-h-0`}
    >
      {/* ── Top bar ── */}
      {!hideTopBar && (
        <div className="bg-card border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              <h2 className="text-lg font-semibold">Trình chỉnh sửa video</h2>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" /> Lưu
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleDownload}
                  disabled={isDownloading}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isDownloading ? "Đang tải..." : "Xuất"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="w-full px-2 sm:px-4 lg:px-6 py-2 sm:py-4 overflow-hidden flex flex-col gap-2 sm:gap-3 flex-1 min-h-0">
        {/* ── Preview row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-4 min-h-0 auto-rows-max">
          <DndContext
            sensors={sensors}
            onDragStart={handlePreviewDragStart}
            onDragMove={handlePreviewDragMove}
            onDragEnd={handlePreviewDragEnd}
            onDragCancel={handlePreviewDragCancel}
          >
            <section className="bg-card rounded-xl border border-border/70 shadow-sm p-2 sm:p-4 flex flex-col min-h-0 lg:col-span-12 col-span-1">
              {needsVideoSelection && disableUpload ? (
                <EditorMediaDropzone
                  onMediaSelect={(url, file, videoId) => {
                    setVideoSrc(url);
                    setOriginalVideoFile(file ?? null);
                    void onFirstVideoAdded?.({ file, url, videoId });
                  }}
                  onVideoDrop={onVideoDrop}
                  title="Tải lên video của bạn"
                  subtitle="Kéo video vào đây hoặc chọn từ máy tính"
                />
              ) : (
                <VideoPreview
                  videoRef={videoRef}
                  src={videoSrc}
                  filter={cssFilter()}
                  layers={visibleLayers}
                  selectedTextId={selectedTextId}
                  onTextSelect={setSelectedTextId}
                  onTextUpdate={handleUpdateText}
                  mascot={mascot}
                  onMascotChange={setMascot}
                  onMascotFrameChange={setMascotFrameSize}
                />
              )}
            </section>

            {activeItem?.type === "text" && <TrashDropZone />}

            {/* DragOverlay: ghost label khi kéo layer từ preview */}
            <DragOverlay dropAnimation={null}>
              {activeItem && activeItem.type === "text" && (
                <div
                  className="pointer-events-none"
                  style={{
                    padding: "4px 8px",
                    fontSize: activeItem.data.fontSize,
                    fontWeight: activeItem.data.fontWeight,
                    color: activeItem.data.color,
                    background: "rgba(0,0,0,0.4)",
                    borderRadius: 6,
                    boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
                    transform: "scale(1.05)",
                    backdropFilter: "blur(4px)",
                  }}
                >
                  {activeItem.data.text}
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </div>

        {/* ── Timeline row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-4">
          {!hideLeftToolbar && <div className="col-span-1 hidden lg:block" />}

          <div
            className={hideLeftToolbar ? "lg:col-span-12" : "lg:col-span-11"}
          >
            <section className="rounded-xl border border-border/70 bg-card p-2 sm:p-3 shadow-sm h-52 sm:h-60 overflow-hidden">
              <TimelinePanel
                layers={layers}
                selectedId={selectedTextId}
                onSelect={setSelectedTextId}
                onReorder={handleReorderText}
                onUpdate={handleUpdateText}
                onRemove={handleRemoveText}
                videoDurationMs={videoDurationMs}
                currentTimeMs={currentTimeMs}
                onSeek={handleSeek}
              />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
