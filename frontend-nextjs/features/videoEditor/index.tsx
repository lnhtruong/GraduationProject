"use client";

import { useState } from "react";
import EditorToolbar from "@/features/videoEditor/components/EditorToolbar";
import VideoPreview from "@/features/videoEditor/components/VideoPreview";
import EditorRightPanel from "@/features/videoEditor/components/EditorRightPanel";
import useVideoEditor from "@/features/videoEditor/hooks/useVideoEditor";
import { Button } from "@/components/ui/button";
import { Save, Download } from "lucide-react";

export default function VideoEditor() {
  const editor = useVideoEditor();
  const {
    videoRef,
    videoSrc,
    setVideoSrc,
    originalVideoFile,
    loadVideoFile,
    isPlaying,
    play,
    pause,
    toggle,
    effect,
    setEffect,
    cssFilter,
    textOverlays,
    addTextOverlay,
    updateTextOverlay,
    removeTextOverlay,
    mascot,
    setMascot,
    applyMascot,
    isApplyingMascot,
    mascotProgress,
    voice,
    setVoice,
    download,
  } = editor;

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

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
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
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-12 gap-6 h-[calc(100vh-7rem)] overflow-hidden">
        {/* Left toolbar */}
        <aside className="col-span-1 overflow-y-auto">
          <EditorToolbar
            isPlaying={isPlaying}
            onPlay={play}
            onPause={pause}
            onToggle={toggle}
            onDownload={download}
          />
        </aside>

        {/* Main preview area */}
        <section className="col-span-8 bg-card rounded-md shadow-sm p-4 flex flex-col">
          <VideoPreview
            videoRef={videoRef}
            src={videoSrc}
            filter={cssFilter()}
            textOverlays={textOverlays}
            selectedTextId={selectedTextId}
            onTextSelect={setSelectedTextId}
          />
        </section>

        {/* Right panel */}
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
          textOverlays={textOverlays}
          onTextAdd={addTextOverlay}
          onTextUpdate={updateTextOverlay}
          onTextRemove={removeTextOverlay}
          selectedTextId={selectedTextId}
          onTextSelect={setSelectedTextId}
        />
      </div>
    </div>
  );
}
