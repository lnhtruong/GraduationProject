"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { DragOverlay } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Download, Save } from "lucide-react";
import EditorToolbar from "@/features/videoEditor/components/EditorToolbar";
import VideoPreview from "@/features/videoEditor/components/VideoPreview";
import EditorRightPanel from "@/features/videoEditor/components/EditorRightPanel";
import LayersPanel from "@/features/videoEditor/components/LayersPanel";
import TrashDropZone from "@/features/videoEditor/components/TrashDropZone";
import EditorMediaDropzone, {
  VideoDropData,
} from "@/features/videoEditor/components/EditorMediaDropzone";
import UploadDropzone from "@/features/upload/components/UploadDropzone";
import useVideoEditor from "@/features/videoEditor/hooks/useVideoEditor";
import type {
  ExternalEditorPanelBindings,
  LayerItem,
  OptionType,
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
  rightPanelOption?: OptionType;
  onRightPanelOptionChange?: (option: OptionType) => void;
  queuedTextTemplate?: string | null;
  onQueuedTextTemplateConsumed?: () => void;
  hideRightPanel?: boolean;
  onPanelBindingsChange?: (bindings: ExternalEditorPanelBindings) => void;
}

export default function CoreVideoEditor({
  onFirstVideoAdded,
  onVideoDrop,
  disableUpload = false,
  hideLeftToolbar = false,
  hideTopBar = false,
  initialVideoUrl,
  rightPanelOption,
  onRightPanelOptionChange,
  queuedTextTemplate,
  onQueuedTextTemplateConsumed,
  hideRightPanel = false,
  onPanelBindingsChange,
}: CoreVideoEditorProps) {
  const editor = useVideoEditor(initialVideoUrl);
  const {
    videoRef,
    videoSrc,
    setVideoSrc,
    originalVideoFile,
    setOriginalVideoFile,
    isPlaying,
    play,
    pause,
    toggle,
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
    isApplyingMascot,
    mascotProgress,
    voice,
    setVoice,
    download,
  } = editor;

  const [activeItem, setActiveItem] = useState<LayerItem | null>(null);
  const [isDraggingLayer, setIsDraggingLayer] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [mascotFrameSize, setMascotFrameSize] = useState<VideoFrameSize | null>(
    null,
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  );

  const handlePanelDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const source = active.data.current?.source;
    if (source !== "panel") return;

    const oldIndex = layers.findIndex((l) => l.id === active.id);
    const newIndex = layers.findIndex((l) => l.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(layers, oldIndex, newIndex);
    handleReorderText(newOrder);
  };

  const handlePreviewDragStart = (event: DragStartEvent) => {
    const id = String(event.active.id);
    const item = layers.find((l) => l.id === id);
    if (!item) return;

    setActiveItem(item);
    setIsDraggingLayer(true);
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
      const movedPlacement = clampPreviewPlacement(
        {
          ...mascot.previewPlacement,
          xPct:
            mascot.previewPlacement.xPct +
            (event.delta.x / mascotFrameSize.width) * 100,
          yPct:
            mascot.previewPlacement.yPct +
            (event.delta.y / mascotFrameSize.height) * 100,
          hasPlaced: true,
        },
        mascotFrameSize,
        mascot.scale,
      );

      const { snappedPlacement, snappedCorner } = applyCornerSnap(
        movedPlacement,
        mascotFrameSize,
        mascot.scale,
      );

      setMascot({
        ...mascot,
        position: snappedCorner ?? mascot.position,
        previewPlacement: {
          ...snappedPlacement,
          hasPlaced: true,
        },
      });
    }

    if (
      source === "mascot-resize" &&
      over?.id === "video-preview-dropzone" &&
      mascotFrameSize &&
      mascot.previewPlacement
    ) {
      const size = getMascotDisplaySize(
        mascotFrameSize,
        mascot.scale,
        mascot.previewPlacement.aspectRatio,
      );
      const nextDisplayWidth = Math.max(20, size.width + event.delta.x);
      const nextScale = deriveScaleFromDisplayWidth(
        mascotFrameSize,
        nextDisplayWidth,
      );
      const nextPlacement = clampPreviewPlacement(
        mascot.previewPlacement,
        mascotFrameSize,
        nextScale,
      );

      setMascot({
        ...mascot,
        scale: nextScale,
        previewPlacement: {
          ...nextPlacement,
          hasPlaced: true,
        },
      });
    }

    setActiveItem(null);
    setIsDraggingLayer(false);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await download();
    } catch (error) {
      console.error("Download error:", error);
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
      alert("Không có video để áp dụng mascot.");
      return;
    }

    if (mascot.type !== "none" && mascot.position !== "replace") {
      if (!mascot.previewPlacement?.hasPlaced) {
        alert("Hãy kéo mascot lên video trước khi áp dụng.");
        return;
      }

      if (!mascotFrameSize) {
        alert("Không thể xác định kích thước khung video để áp dụng mascot.");
        return;
      }
    }

    const computedMascot =
      mascot.type !== "none" && mascot.position !== "replace" && mascotFrameSize
        ? deriveBackendMascotFromPreview(mascot, mascotFrameSize)
        : mascot;

    await applyMascot(computedMascot, videoSrc, (blobUrl) => {
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

  const hasSelectedVideo =
    Boolean(videoSrc) && videoSrc !== "/videos/Download.mp4";
  const needsVideoSelection = !originalVideoFile && !hasSelectedVideo;

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
    };

    handleAddText(newText);
    setSelectedTextId(newText.id);
    onQueuedTextTemplateConsumed?.();
  }, [queuedTextTemplate, handleAddText, onQueuedTextTemplateConsumed]);

  useEffect(() => {
    onPanelBindingsChange?.({
      effect,
      onEffectChange: setEffect,
      mascot,
      onMascotChange: setMascot,
      onMascotApply: handleMascotApply,
      isApplyingMascot,
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
    effect,
    mascot,
    isApplyingMascot,
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
    handleAddText,
    handleUpdateText,
    handleRemoveText,
    handleMascotApply,
  ]);

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
      {!hideTopBar && (
        <div className="bg-card border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              <h2 className="text-lg font-semibold">Trình chỉnh sửa video</h2>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-4 min-h-0 auto-rows-max">
          {!hideLeftToolbar && (
            <aside className="col-span-1 overflow-y-auto hidden lg:block">
              <EditorToolbar
                isPlaying={isPlaying}
                onPlay={play}
                onPause={pause}
                onToggle={toggle}
                onDownload={download}
              />
            </aside>
          )}

          <DndContext
            sensors={sensors}
            onDragStart={handlePreviewDragStart}
            onDragEnd={handlePreviewDragEnd}
          >
            <section
              className={`bg-card rounded-xl border border-border/70 shadow-sm p-2 sm:p-4 flex flex-col min-h-0 ${hideLeftToolbar ? (hideRightPanel ? "lg:col-span-12" : "lg:col-span-9") : hideRightPanel ? "lg:col-span-11" : "lg:col-span-8"} col-span-1`}
            >
              {needsVideoSelection && disableUpload ? (
                <EditorMediaDropzone
                  onMediaSelect={(url, file, videoId) => {
                    setVideoSrc(url);
                    if (file) {
                      setOriginalVideoFile(file);
                    } else {
                      // For Cloudinary URLs, clear the local file
                      setOriginalVideoFile(null);
                    }
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
                  layers={layers}
                  selectedTextId={selectedTextId}
                  onTextSelect={setSelectedTextId}
                  mascot={mascot}
                  onMascotChange={setMascot}
                  onMascotFrameChange={setMascotFrameSize}
                />
              )}
            </section>
            {isDraggingLayer && <TrashDropZone />}

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

          {!hideRightPanel && (
            <aside className="col-span-1 lg:col-span-3 min-h-0 max-h-[60vh] overflow-y-auto">
              <EditorRightPanel
                effect={effect}
                onEffectChange={setEffect}
                mascot={mascot}
                onMascotChange={setMascot}
                onMascotApply={handleMascotApply}
                isApplyingMascot={isApplyingMascot}
                mascotProgress={mascotProgress}
                videoFile={originalVideoFile}
                videoSourceUrl={hasSelectedVideo ? videoSrc : undefined}
                voice={voice}
                onVoiceChange={setVoice}
                layers={layers}
                onTextAdd={handleAddText}
                onTextUpdate={handleUpdateText}
                onTextRemove={handleRemoveText}
                selectedTextId={selectedTextId}
                onTextSelect={setSelectedTextId}
                activeOption={rightPanelOption}
                onActiveOptionChange={onRightPanelOptionChange}
              />
            </aside>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-4">
          {!hideLeftToolbar && <div className="col-span-1 hidden lg:block" />}

          <div
            className={hideLeftToolbar ? "lg:col-span-12" : "lg:col-span-11"}
          >
            <DndContext sensors={sensors} onDragEnd={handlePanelDragEnd}>
              <section className="rounded-xl border border-border/70 bg-card p-2 sm:p-3 shadow-sm h-20 sm:h-28 overflow-auto">
                <LayersPanel
                  layers={layers}
                  selectedId={selectedTextId}
                  onSelect={setSelectedTextId}
                  orientation="horizontal"
                />
              </section>
            </DndContext>
          </div>
        </div>
      </div>
    </div>
  );
}
