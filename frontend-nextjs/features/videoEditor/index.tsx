"use client";

import { useState } from "react";
import EditorToolbar from "@/features/videoEditor/components/EditorToolbar";
import VideoPreview from "@/features/videoEditor/components/VideoPreview";
import EditorRightPanel from "@/features/videoEditor/components/EditorRightPanel";
import UploadDropzone from "@/features/upload/components/UploadDropzone";
import useVideoEditor from "@/features/videoEditor/hooks/useVideoEditor";
import TrashDropZone from "@/features/videoEditor/components/TrashDropZone";
import { arrayMove } from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Save, Download } from "lucide-react";
import {DragStartEvent} from "@dnd-kit/core";
import { DragOverlay } from "@dnd-kit/core";

import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToParentElement } from "@dnd-kit/modifiers";
import LayersPanel from "@/features/videoEditor/components/LayersPanel";
import { LayerItem } from "./types";

export default function VideoEditor() {
  const editor = useVideoEditor();
  const {
    videoRef,
    videoSrc,
    setVideoSrc,
    originalVideoFile,
    setOriginalVideoFile,
    loadVideoFile,
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

    // ===== DnD Setup (Core Infrastructure)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Phải kéo 5px mới bắt đầu drag
      },
    }),
  );

    // =========================
    // PANEL SORT HANDLER
    // =========================
    const handlePanelDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const source = active.data.current?.source;
        if (source === "panel") {
            if (active.id === over.id) return;

            const oldIndex = layers.findIndex(
                (l) => l.id === active.id
            );
            const newIndex = layers.findIndex(
                (l) => l.id === over.id
            );

            if (oldIndex === -1 || newIndex === -1) return;

            const newOrder = arrayMove(layers, oldIndex, newIndex);
            handleReorderText(newOrder);
        }
    };

    // =========================
    // PREVIEW DRAG HANDLER
    // =========================
    const handlePreviewDragStart = (event: DragStartEvent) => {
        const id = String(event.active.id);
        const item = layers.find((l) => l.id === id);
        if (item) setActiveItem(item);
    };

    const handlePreviewDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.data.current?.source === "preview" && over?.id === "trash") {
            handleRemoveText(String(active.id));
        }

        setActiveItem(null);
    };





    // ===== Quản lý tải video
  const [isDownloading, setIsDownloading] = useState(false);
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

  // ===== Quản lý chọn text overlay
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);

  // ===== Quản lý áp dụng mascot
  const handleMascotApply = async () => {
    if (!videoSrc) {
      alert("Không có video để áp dụng mascot.");
      return;
    }

    await applyMascot(mascot, videoSrc, (blobUrl) => {
      setVideoSrc(blobUrl);
    });
  };

  // ===== Hiển thị Upload nếu chưa có video
  if (!originalVideoFile && !videoSrc.includes("cloudinary.com")) {
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
            }}
          />
        </div>
      </div>
    );
  }

    return (
        <div className="min-h-screen bg-background">
            {/* Top bar */}
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

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-12 gap-6 h-[calc(100vh-7rem)] overflow-hidden">

                {/* LEFT TOOLBAR */}
                <aside className="col-span-1 overflow-y-auto">
                    <EditorToolbar
                        isPlaying={isPlaying}
                        onPlay={play}
                        onPause={pause}
                        onToggle={toggle}
                        onDownload={download}
                    />
                </aside>

                {/* ================= PANEL DND CONTEXT ================= */}
                <DndContext sensors={sensors} onDragEnd={handlePanelDragEnd}>
                    <aside className="col-span-2 bg-card rounded-md shadow-sm p-3 overflow-auto">
                        <LayersPanel
                            layers={layers}
                            selectedId={selectedTextId}
                            onSelect={setSelectedTextId}
                        />
                    </aside>
                </DndContext>

                {/* ================= PREVIEW DND CONTEXT ================= */}
                <DndContext
                    sensors={sensors}
                    onDragStart={handlePreviewDragStart}
                    onDragEnd={(event) => {
                        handlePreviewDragEnd(event);
                        setActiveItem(null);
                    }}
                >
                    <section className="col-span-6 bg-card rounded-md shadow-sm p-4 flex flex-col">
                        <VideoPreview
                            videoRef={videoRef}
                            src={videoSrc}
                            filter={cssFilter()}
                            layers={layers}
                            selectedTextId={selectedTextId}
                            onTextSelect={setSelectedTextId}
                        />
                    </section>

                    <TrashDropZone />

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

                {/* RIGHT PANEL */}
                <EditorRightPanel
                    effect={effect}
                    onEffectChange={setEffect}
                    mascot={mascot}
                    onMascotChange={setMascot}
                    onMascotApply={handleMascotApply}
                    isApplyingMascot={isApplyingMascot}
                    mascotProgress={mascotProgress}
                    videoFile={originalVideoFile}
                    voice={voice}
                    onVoiceChange={setVoice}
                    layers={layers}
                    onTextAdd={handleAddText}
                    onTextUpdate={handleUpdateText}
                    onTextRemove={handleRemoveText}
                    selectedTextId={selectedTextId}
                    onTextSelect={setSelectedTextId}
                />
            </div>
        </div>
    );
}
