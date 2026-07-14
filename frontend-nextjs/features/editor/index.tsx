"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import CoreEditor from "@/features/editor/components/CoreEditor";
import type { ExternalEditorPanelBindings } from "@/features/editor/types";
import { useStudioSession } from "@/features/editor/hooks/useStudioSession";
import { StudioHeader } from "@/features/editor/components/studio/StudioHeader";
import { StudioSidebar } from "@/features/editor/components/studio/StudioSidebar";
import { MascotRenderDialog } from "@/features/editor/components/optionDetails/Mascot";

export default function Editor() {
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

  const canCreateMascotVideo = Boolean(
    panelBindings &&
      panelBindings.mascot.type !== "none" &&
      (panelBindings.videoFile || panelBindings.videoSourceUrl) &&
      panelBindings.mascot.scale >= 0.1 &&
      panelBindings.mascot.scale <= 2 &&
      !panelBindings.isApplyingMascot &&
      !panelBindings.isCreatingMascotVideo &&
      panelBindings.onMascotCreateVideo,
  );

  return (
    <>
      <div className="relative flex min-h-[100dvh] w-full bg-background text-foreground">
        {!isSidebarCollapsed && (
          <div
            className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[1px] transition-opacity lg:hidden"
            onClick={() => setIsSidebarCollapsed(true)}
          />
        )}

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

      <div className="min-w-0 flex-1 pb-[calc(6.5rem+env(safe-area-inset-bottom))] lg:ml-[4.5rem] lg:w-[calc(100%_-_4.5rem)] lg:flex-none lg:pb-0">
        <StudioHeader
          activeSessionName={activeSessionName}
          activeEditId={activeEditId}
          isLoading={isLoading}
          onStartEmptyProject={handleStartEmptyProject}
          onSaveSession={(name) =>
            handleSaveSession(name, panelBindingsRef.current)
          }
          isCreatingMascotVideo={panelBindings?.isCreatingMascotVideo ?? false}
          mascotProgress={panelBindings?.mascotProgress ?? ""}
          canCreateMascotVideo={canCreateMascotVideo}
          onCreateMascotVideo={() => setIsMascotRenderDialogOpen(true)}
        />

        <main className="flex min-h-[calc(100dvh-48px)] flex-col gap-2 bg-[linear-gradient(180deg,hsl(var(--muted)/0.45)_0%,hsl(var(--background))_100%)] p-1.5 sm:min-h-[calc(100dvh-56px)] sm:gap-3 sm:p-3 lg:p-4">
          <div className="flex h-full flex-1 min-h-0 rounded-xl border border-border bg-card/95 shadow-sm backdrop-blur-sm sm:rounded-2xl sm:shadow-xl">
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
          </div>
        </main>
      </div>
      </div>

      {panelBindings ? (
        <MascotRenderDialog
          open={isMascotRenderDialogOpen}
          onOpenChange={setIsMascotRenderDialogOpen}
          value={panelBindings.mascot}
          onChange={panelBindings.onMascotChange}
          onCreateVideo={panelBindings.onMascotCreateVideo}
          canCreateVideo={canCreateMascotVideo}
          isCreatingVideo={panelBindings.isCreatingMascotVideo}
        />
      ) : null}
    </>
  );
}
