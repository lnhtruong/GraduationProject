"use client";

import { useEffect, useRef, useState } from "react";
import EditorToolbar from "@/features/videoEditor/components/EditorToolbar";
import VideoPreview from "@/features/videoEditor/components/VideoPreview";
import EditorRightPanel from "@/features/videoEditor/components/EditorRightPanel";
import UploadDropzone from "@/features/upload/components/UploadDropzone";
import useVideoEditor from "@/features/videoEditor/hooks/useVideoEditor";
import TrashDropZone from "@/features/videoEditor/components/TrashDropZone";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, Save } from "lucide-react";
import { DragOverlay, type DragStartEvent } from "@dnd-kit/core";

import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragSource, LayerItem } from "./types";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function VideoEditor() {
  const editor = useVideoEditor();
  const {
    videoRef,
    videoSrc,
    setVideoSrc,
    originalVideoFile,
    setOriginalVideoFile,
    isPlaying,
    toggle,
    effect,
    setEffect,
    cssFilter,
    layers,
    handleAddText,
    handleUpdateText,
    handleRemoveText,
    mascot,
    setMascot,
    applyMascot,
    isApplyingMascot,
    mascotProgress,
    voice,
    setVoice,
    download,
  } = editor;
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [activeItem, setActiveItem] = useState<LayerItem | null>(null);
  const [activeSource, setActiveSource] = useState<DragSource | null>(null);

  // ===== DnD Setup (Core Infrastructure)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    }),
  );

  const updateTextPositionFromDelta = (id: string, deltaX: number, deltaY: number) => {
    const rect = previewContainerRef.current?.getBoundingClientRect();
    const layer = layers.find((item) => item.id === id && item.type === "text");
    if (!rect || !layer || layer.type !== "text") return;

    const nextX = clamp(layer.data.position.x + (deltaX / rect.width) * 100, 0, 100);
    const nextY = clamp(layer.data.position.y + (deltaY / rect.height) * 100, 0, 100);

    handleUpdateText(id, {
      position: {
        x: Number(nextX.toFixed(2)),
        y: Number(nextY.toFixed(2)),
      },
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    const source = event.active.data.current?.source as DragSource | undefined;
    if (!source) return;
    setActiveSource(source);

    if (source === "preview-text") {
      const id = String(event.active.id);
      const item = layers.find((l) => l.id === id);
      if (item) setActiveItem(item);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over, delta, activatorEvent } = event;
    const source = active.data.current?.source as DragSource | undefined;
    const action = active.data.current?.action;

    if (source === "preview-text") {
      if (over?.id === "trash") {
        handleRemoveText(String(active.id));
      } else {
        updateTextPositionFromDelta(String(active.id), delta.x, delta.y);
      }
    }

    if (source === "mascot-palette" && over?.id === "video-canvas") {
      const rect = previewContainerRef.current?.getBoundingClientRect();
      const pointerEvent = activatorEvent as PointerEvent | undefined;

      if (rect && pointerEvent) {
        const xPercent = clamp(
          ((pointerEvent.clientX - rect.left) / rect.width) * 100,
          0,
          100,
        );
        const yPercent = clamp(
          ((pointerEvent.clientY - rect.top) / rect.height) * 100,
          0,
          100,
        );

        setMascot((prev) => ({
          ...prev,
          position: "bottom-right",
          uiPlacement: {
            xPercent: Number(xPercent.toFixed(2)),
            yPercent: Number(yPercent.toFixed(2)),
            widthPercent: prev.uiPlacement?.widthPercent ?? 20,
          },
        }));
      }
    }

    if (source === "preview-mascot") {
      const rect = previewContainerRef.current?.getBoundingClientRect();
      if (rect) {
        if (action === "scale") {
          const deltaPercent = (delta.x / rect.width) * 100;
          setMascot((prev) => {
            const current = prev.uiPlacement?.widthPercent ?? 20;
            return {
              ...prev,
              uiPlacement: {
                xPercent: prev.uiPlacement?.xPercent ?? 85,
                yPercent: prev.uiPlacement?.yPercent ?? 85,
                widthPercent: Number(clamp(current + deltaPercent, 8, 70).toFixed(2)),
              },
            };
          });
        } else {
          setMascot((prev) => {
            const nextX = clamp(
              (prev.uiPlacement?.xPercent ?? 85) + (delta.x / rect.width) * 100,
              0,
              100,
            );
            const nextY = clamp(
              (prev.uiPlacement?.yPercent ?? 85) + (delta.y / rect.height) * 100,
              0,
              100,
            );

            return {
              ...prev,
              uiPlacement: {
                xPercent: Number(nextX.toFixed(2)),
                yPercent: Number(nextY.toFixed(2)),
                widthPercent: prev.uiPlacement?.widthPercent ?? 20,
              },
            };
          });
        }
      }
    }

    setActiveItem(null);
    setActiveSource(null);
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

  useEffect(() => {
    if (selectedTextId) return;
    const firstText = layers.find((layer) => layer.type === "text");
    if (firstText && firstText.type === "text") {
      setSelectedTextId(firstText.id);
    }
  }, [layers, selectedTextId]);

  // ===== Quản lý áp dụng mascot
  const handleMascotApply = async () => {
    if (!videoSrc) {
      alert("Không có video để áp dụng mascot.");
      return;
    }

    await applyMascot(mascot, videoSrc, originalVideoFile ?? videoSrc, (blobUrl) => {
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
      <div className="border-b bg-card/90 backdrop-blur supports-[backdrop-filter]:bg-card/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Trình chỉnh sửa video</h2>
          </div>

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

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-12 gap-4 lg:gap-6 h-[calc(100vh-7rem)]">
          <aside className="col-span-12 lg:col-span-1">
            <EditorToolbar
              isPlaying={isPlaying}
              onToggle={toggle}
              onDownload={download}
            />
          </aside>

          <section className="col-span-12 lg:col-span-8 min-h-0">
            <Card className="h-full p-3 sm:p-4 flex flex-col gap-3">
              <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-2">
                <span>Kéo thả text trực tiếp để thay đổi vị trí.</span>
                <span className="hidden sm:inline">•</span>
                <span>Kéo mascot từ panel phải vào preview rồi kéo/scale trực tiếp.</span>
              </div>
              <div className="flex-1 min-h-0">
                <VideoPreview
                  videoRef={videoRef}
                  containerRef={previewContainerRef}
                  src={videoSrc}
                  filter={cssFilter()}
                  layers={layers}
                  mascot={mascot}
                  selectedTextId={selectedTextId}
                  onTextSelect={setSelectedTextId}
                />
              </div>
            </Card>
          </section>

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

        <TrashDropZone />

        <DragOverlay dropAnimation={null}>
          {activeSource === "preview-text" && activeItem?.type === "text" && (
            <div
              className="pointer-events-none"
              style={{
                padding: "4px 8px",
                fontSize: activeItem.data.fontSize,
                fontWeight: activeItem.data.fontWeight,
                color: activeItem.data.color,
                background: "rgba(0,0,0,0.45)",
                borderRadius: 6,
                boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
                transform: "scale(1.05)",
                backdropFilter: "blur(4px)",
              }}
            >
              {activeItem.data.text}
            </div>
          )}

          {activeSource === "mascot-palette" && (
            <div className="px-3 py-2 rounded-md text-xs bg-primary text-primary-foreground shadow-md">
              Thả vào video để thêm mascot
            </div>
          )}

          {activeSource === "preview-mascot" && (
            <div className="px-3 py-2 rounded-md text-xs bg-primary/90 text-primary-foreground shadow-md">
              Di chuyển mascot
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
