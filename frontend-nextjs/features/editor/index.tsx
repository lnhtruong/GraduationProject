"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import CoreEditor from "@/features/editor/components/CoreEditor";
import type { ExternalEditorPanelBindings } from "@/features/editor/types";
import { useStudioSession } from "@/features/editor/hooks/useStudioSession";
import { StudioHeader } from "@/features/editor/components/studio/StudioHeader";
import { StudioSidebar } from "@/features/editor/components/studio/StudioSidebar";
import { MascotRenderDialog } from "@/features/editor/components/optionDetails/Mascot";

export default function Editor() {
  const router = useRouter();
  const [panelBindings, setPanelBindings] =
    useState<ExternalEditorPanelBindings | null>(null);
  const panelBindingsRef = useRef<ExternalEditorPanelBindings | null>(null);
  const panelBindingsKeyRef = useRef<string>("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 1023px)").matches;
  });
  const [isMascotRenderDialogOpen, setIsMascotRenderDialogOpen] =
    useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1023px)");
    const handleChange = () => setIsSidebarCollapsed(media.matches);
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  const handlePanelBindingsChange = useCallback(
    (next: ExternalEditorPanelBindings) => {
      panelBindingsRef.current = next;
      const nextKey = JSON.stringify({
        editId: next.editId ?? null,
        effect: next.effect,
        mascot: next.mascot,
        existingMascotOverlayId: next.existingMascotOverlayId ?? null,
        voice: {
          type: next.voice.type,
          presetId: next.voice.presetId ?? null,
          speed: next.voice.speed,
          volume: next.voice.volume,
          pitch: next.voice.pitch,
          hasCustomFile: Boolean(next.voice.customFile),
        },
        layers: next.layers,
        selectedTextId: next.selectedTextId ?? null,
        hasVideoFile: Boolean(next.videoFile),
        videoSourceUrl: next.videoSourceUrl ?? null,
        mascotFrameSize: next.mascotFrameSize
          ? {
              width: next.mascotFrameSize.width,
              height: next.mascotFrameSize.height,
              displayWidth: next.mascotFrameSize.displayWidth,
              displayHeight: next.mascotFrameSize.displayHeight,
            }
          : null,
        isApplyingMascot: next.isApplyingMascot,
        isCreatingMascotVideo: next.isCreatingMascotVideo,
        mascotProgress: next.mascotProgress,
      });

      if (panelBindingsKeyRef.current === nextKey) {
        return;
      }

      panelBindingsKeyRef.current = nextKey;

      setPanelBindings((prev) => {
        if (!prev) return next;

        return {
          ...prev,
          editId: next.editId,
          effect: next.effect,
          mascot: next.mascot,
          existingMascotOverlayId: next.existingMascotOverlayId,
          voice: next.voice,
          layers: next.layers,
          selectedTextId: next.selectedTextId,
          videoFile: next.videoFile,
          videoSourceUrl: next.videoSourceUrl,
          mascotFrameSize: next.mascotFrameSize,
          isApplyingMascot: next.isApplyingMascot,
          isCreatingMascotVideo: next.isCreatingMascotVideo,
          mascotProgress: next.mascotProgress,
          onEffectChange: next.onEffectChange,
          onMascotChange: next.onMascotChange,
          onMascotApply: next.onMascotApply,
          onMascotCreateVideo: next.onMascotCreateVideo,
          onVoiceChange: next.onVoiceChange,
          onTextAdd: next.onTextAdd,
          onTextUpdate: next.onTextUpdate,
          onTextRemove: next.onTextRemove,
          onTextSelect: next.onTextSelect,
        };
      });
    },
    [],
  );

  const {
    activeEditId,
    activeSessionName,
    activeSourceVideoUrl,
    activeSourceVideoName,
    isProjectFinalized,
    isLoading,
    highlightVideos,
    highlightVideosLoading,
    mascotVideos,
    mascotVideosLoading,
    selectedMascotImageId,
    existingMascotOverlay,
    existingMascotOverlayId,
    handleStartEmptyProject,
    handleCreateProjectOnFirstVideo,
    handleStartFromHighlight,
    handleSelectMascotVideo,
    handleSaveSession,
    handleFinalizeMascotProject,
  } = useStudioSession();

  const effectivePanelBindings = isProjectFinalized ? null : panelBindings;

  const canCreateMascotVideo = Boolean(
    !isProjectFinalized &&
      effectivePanelBindings &&
      effectivePanelBindings.mascot.type !== "none" &&
      (effectivePanelBindings.videoFile || effectivePanelBindings.videoSourceUrl) &&
      effectivePanelBindings.mascot.scale >= 0.1 &&
      effectivePanelBindings.mascot.scale <= 2 &&
      !effectivePanelBindings.isApplyingMascot &&
      !effectivePanelBindings.isCreatingMascotVideo &&
      effectivePanelBindings.onMascotCreateVideo,
  );

  return (
    <>
      <div className="relative flex min-h-[100dvh] w-full bg-background text-foreground">
        {!isProjectFinalized && !isSidebarCollapsed && (
          <div
            className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[1px] transition-opacity lg:hidden"
            onClick={() => setIsSidebarCollapsed(true)}
          />
        )}

      {!isProjectFinalized ? (
        <StudioSidebar
          highlightVideos={highlightVideos}
          highlightVideosLoading={highlightVideosLoading}
          mascotImages={mascotVideos}
          mascotImagesLoading={mascotVideosLoading}
          onSelectVideo={(video) => {
            void handleStartFromHighlight(video);
          }}
          selectedMascotImageId={selectedMascotImageId}
          onSelectMascotImage={handleSelectMascotVideo}
          panelBindings={panelBindings}
          collapsed={isSidebarCollapsed}
          onToggleCollapsed={() => setIsSidebarCollapsed((prev) => !prev)}
        />
      ) : null}

      <div className={`min-w-0 flex-1 ${isProjectFinalized ? "pb-0 lg:w-full" : "pb-[calc(6.5rem+env(safe-area-inset-bottom))] lg:ml-[4.5rem] lg:w-[calc(100%_-_4.5rem)] lg:flex-none lg:pb-0"}`}>
        <StudioHeader
          activeSessionName={activeSessionName}
          activeEditId={activeEditId}
          isLoading={isLoading}
          onStartEmptyProject={handleStartEmptyProject}
          onSaveSession={(name) =>
            handleSaveSession(name, panelBindingsRef.current)
          }
          isCreatingMascotVideo={effectivePanelBindings?.isCreatingMascotVideo ?? false}
          canCreateMascotVideo={canCreateMascotVideo}
          onCreateMascotVideo={() => setIsMascotRenderDialogOpen(true)}
          isFinalized={isProjectFinalized}
        />

        <main className="flex min-h-[calc(100dvh-48px)] flex-col gap-2 bg-[linear-gradient(180deg,hsl(var(--muted)/0.45)_0%,hsl(var(--background))_100%)] p-1.5 sm:min-h-[calc(100dvh-56px)] sm:gap-3 sm:p-3 lg:p-4">
          <div className="flex h-full flex-1 min-h-0 rounded-xl border border-border bg-card/95 shadow-sm backdrop-blur-sm sm:rounded-2xl sm:shadow-xl">
            {isProjectFinalized ? (
              <FinalizedProjectView
                videoUrl={activeSourceVideoUrl}
                onOpenLibrary={() => router.push("/library")}
              />
            ) : (
              <CoreEditor
                initialVideoUrl={activeSourceVideoUrl}
                onFirstVideoAdded={handleCreateProjectOnFirstVideo}
                onVideoDrop={(video) => {
                  void handleStartFromHighlight(video);
                }}
                sourceVideoName={activeSourceVideoName}
                disableUpload
                hideLeftToolbar
                hideTopBar
                onPanelBindingsChange={handlePanelBindingsChange}
                editId={activeEditId}
                existingMascotOverlay={existingMascotOverlay}
                existingMascotOverlayId={existingMascotOverlayId}
                onFinalizeMascotProject={handleFinalizeMascotProject}
              />
            )}
          </div>
        </main>
      </div>
      </div>

      {effectivePanelBindings ? (
        <MascotRenderDialog
          open={isMascotRenderDialogOpen}
          onOpenChange={setIsMascotRenderDialogOpen}
          value={effectivePanelBindings.mascot}
          onChange={effectivePanelBindings.onMascotChange}
          onCreateVideo={effectivePanelBindings.onMascotCreateVideo}
          canCreateVideo={canCreateMascotVideo}
          isCreatingVideo={effectivePanelBindings.isCreatingMascotVideo}
          mascotProgress={effectivePanelBindings.mascotProgress}
        />
      ) : null}
    </>
  );
}

function FinalizedProjectView({
  videoUrl,
  onOpenLibrary,
}: {
  videoUrl?: string;
  onOpenLibrary: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-5 p-6 text-center">
      <div className="flex max-w-2xl flex-col items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/12 text-emerald-500">
          <CheckCircle2 className="size-7" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Dự án đã hoàn thành</h2>
          <p className="text-sm text-muted-foreground">
            Project này đã tạo video hoàn chỉnh. Nội dung trong editor được khóa
            để tránh render chồng mascot hoặc chỉnh tiếp trên bản final.
          </p>
        </div>
      </div>

      {videoUrl ? (
        <div className="w-full max-w-4xl space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Video gốc của project, chỉ xem lại
          </p>
          <video
            controls
            preload="metadata"
            className="max-h-[52vh] w-full rounded-lg bg-black"
          >
            <source src={videoUrl} />
          </video>
        </div>
      ) : null}

      <Button onClick={onOpenLibrary} className="gap-2">
        <Library className="size-4" />
        Xem trong thư viện
      </Button>
    </div>
  );
}
