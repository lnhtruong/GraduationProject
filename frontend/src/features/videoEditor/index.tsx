import { useState, useMemo } from "react";
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
    updateMascot,
    voice,
    updateVoice,
    download,
  } = editor;
  
  // ===== Quản lý tải video
  const [isDownloading, setIsDownloading] = useState(false);
  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await download();
    } catch (_e) {
      void _e;
    } finally {
      setIsDownloading(false);
    }
  };

  // ===== Quản lý bộ lọc video
  const computedFilter = useMemo(
    () =>
      `brightness(${effect.brightness}%) contrast(${effect.contrast}%) saturate(${effect.saturation}%) hue-rotate(${effect.hue}deg)`,
    [effect.brightness, effect.contrast, effect.saturation, effect.hue]
  );
  
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
              <Button variant="ghost" size="sm" onClick={() => void play()}>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-12 gap-6 h-[calc(100vh-3.5rem)]">
        {/* Left toolbar */}
        <aside className="col-span-1">
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
            videoRef={videoRef as React.RefObject<HTMLVideoElement>}
            src={videoSrc}
            filter={computedFilter}
            textOverlays={textOverlays}
          />
        </section>

        {/* Right panel */}
        <EditorRightPanel
          brightness={effect.brightness}
          contrast={effect.contrast}
          saturation={effect.saturation}
          hue={effect.hue}
          onChange={(next) => setEffect(next)}
          onTextChange={(text) => {
            // TODO: Implement text overlay management
            console.log('Text changed:', text);
          }}
        />
      </div>
    </div>
  );
}