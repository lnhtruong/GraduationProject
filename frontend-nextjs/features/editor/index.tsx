"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import CoreEditor from "@/features/editor/components/CoreEditor";
import type { ExternalEditorPanelBindings } from "@/features/editor/types";
import { useStudioSession } from "@/features/editor/hooks/useStudioSession";
import { StudioHeader } from "@/features/editor/components/studio/StudioHeader";
import { StudioSidebar } from "@/features/editor/components/studio/StudioSidebar";

export default function Editor() {
  const [panelBindings, setPanelBindings] =
    useState<ExternalEditorPanelBindings | null>(null);
  const panelBindingsRef = useRef<ExternalEditorPanelBindings | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 1023px)").matches;
  });

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1023px)");
    const handleChange = () => setIsSidebarCollapsed(media.matches);
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  const handlePanelBindingsChange = useCallback(
    (next: ExternalEditorPanelBindings) => {
      panelBindingsRef.current = next;

      setPanelBindings((prev) => {
        if (!prev) return next;

        const sameState =
          prev.editId === next.editId &&
          prev.effect === next.effect &&
          prev.mascot === next.mascot &&
          prev.existingMascotOverlayId === next.existingMascotOverlayId &&
          prev.voice === next.voice &&
          prev.layers === next.layers &&
          prev.selectedTextId === next.selectedTextId &&
          prev.videoFile === next.videoFile &&
          prev.videoSourceUrl === next.videoSourceUrl &&
          prev.mascotFrameSize === next.mascotFrameSize &&
          prev.isApplyingMascot === next.isApplyingMascot &&
          prev.isCreatingMascotVideo === next.isCreatingMascotVideo &&
          prev.mascotProgress === next.mascotProgress;

        if (sameState) {
          return prev;
        }

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

      <div
        className={`min-w-0 flex-1 pb-[calc(5rem+env(safe-area-inset-bottom))] transition-[margin] duration-300 lg:pb-0 ${
          isSidebarCollapsed ? "lg:ml-[4.5rem]" : "lg:ml-[28rem]"
        }`}
      >
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
          onCreateMascotVideo={panelBindings?.onMascotCreateVideo}
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
    </>
  );
}
