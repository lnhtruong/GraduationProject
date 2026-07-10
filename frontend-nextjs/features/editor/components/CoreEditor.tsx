"use client";

import { DndContext, DragOverlay } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { Download, Save } from "lucide-react";
import VideoPreview from "@/features/editor/components/VideoPreview";
import TimelinePanel from "@/features/editor/components/TimelinePanel";
import TrashDropZone from "@/features/editor/components/TrashDropZone";
import EditorMediaDropzone, {
  VideoDropData,
} from "@/features/editor/components/EditorMediaDropzone";
import UploadDropzone from "@/features/upload/components/UploadDropzone";
import type { ExternalEditorPanelBindings } from "@/features/editor/types";
import { useCoreEditorController } from "@/features/editor/hooks/useCoreEditorController";

export interface CoreEditorProps {
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
  sourceVideoName?: string;
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

export default function CoreEditor({
  onFirstVideoAdded,
  onVideoDrop,
  disableUpload = false,
  hideLeftToolbar = false,
  hideTopBar = false,
  initialVideoUrl,
  sourceVideoName,
  queuedTextTemplate,
  onQueuedTextTemplateConsumed,
  onPanelBindingsChange,
  editId,
  existingMascotOverlay,
  existingMascotOverlayId,
  onFinalizeMascotProject,
}: CoreEditorProps) {
  const {
    editor,
    activeItem,
    isDownloading,
    selectedTextId,
    currentTimeMs,
    videoDurationMs,
    sensors,
    handlePreviewDragStart,
    handlePreviewDragMove,
    handlePreviewDragEnd,
    handlePreviewDragCancel,
    handleDownload,
    handleSeek,
    visibleLayers,
    needsVideoSelection,
    handleSave,
    setSelectedTextId,
    handleMascotFrameChange,
  } = useCoreEditorController({
    disableUpload,
    initialVideoUrl,
    sourceVideoName,
    editId,
    queuedTextTemplate,
    onQueuedTextTemplateConsumed,
    onPanelBindingsChange,
    existingMascotOverlay,
    existingMascotOverlayId,
    onFinalizeMascotProject,
  });

  const {
    videoRef,
    videoSrc,
    setVideoSrc,
    setOriginalVideoFile,
    cssFilter,
    layers,
    handleUpdateText,
    handleRemoveText,
    handleReorderText,
    mascot,
    setMascot,
  } = editor;

  const selectedTextOverlay =
    activeItem && activeItem.type === "text" ? activeItem : null;

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

      <div className="flex min-h-0 w-full flex-1 flex-col gap-2 overflow-hidden px-1.5 py-1.5 sm:gap-3 sm:px-4 sm:py-4 lg:px-6">
        <div className="grid min-h-0 flex-[1.25] grid-cols-1 gap-2 sm:gap-4 lg:grid-cols-12">
          <DndContext
            sensors={sensors}
            onDragStart={handlePreviewDragStart}
            onDragMove={handlePreviewDragMove}
            onDragEnd={handlePreviewDragEnd}
            onDragCancel={handlePreviewDragCancel}
          >
            <section className="col-span-1 flex min-h-0 flex-col rounded-lg border border-border/70 bg-card p-1.5 shadow-sm sm:rounded-xl sm:p-4 lg:col-span-12">
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
                  onMascotFrameChange={handleMascotFrameChange}
                />
              )}
            </section>

            {selectedTextOverlay && <TrashDropZone />}

            <DragOverlay dropAnimation={null}>
              {selectedTextOverlay && (
                <div
                  className="pointer-events-none"
                  style={{
                    padding: "4px 8px",
                    fontSize: selectedTextOverlay.data.fontSize,
                    fontWeight: selectedTextOverlay.data.fontWeight,
                    color: selectedTextOverlay.data.color,
                    background: "rgba(0,0,0,0.4)",
                    borderRadius: 6,
                    boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
                    transform: "scale(1.05)",
                    backdropFilter: "blur(4px)",
                  }}
                >
                  {selectedTextOverlay.data.text}
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </div>

        <div className="grid min-h-0 flex-[0.75] grid-cols-1 gap-2 sm:gap-4 lg:grid-cols-12">
          {!hideLeftToolbar && <div className="col-span-1 hidden lg:block" />}

          <div
            className={hideLeftToolbar ? "lg:col-span-12" : "lg:col-span-11"}
          >
            <section className="h-full min-h-36 overflow-hidden rounded-lg border border-border/70 bg-card p-1.5 shadow-sm sm:min-h-48 sm:rounded-xl sm:p-3 lg:h-60">
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
