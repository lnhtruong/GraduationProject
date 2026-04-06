"use client";

import { useCallback, useState } from "react";
import CoreVideoEditor from "@/features/videoEditor/components/CoreVideoEditor";
import type { ExternalEditorPanelBindings } from "@/features/videoEditor/types";
import { useStudioSession } from "@/features/videoEditor/hooks/useStudioSession";
import { StudioHeader } from "@/features/videoEditor/components/studio/StudioHeader";
import { StudioSidebar } from "@/features/videoEditor/components/studio/StudioSidebar";

export default function VideoEditor() {
  const [panelBindings, setPanelBindings] =
    useState<ExternalEditorPanelBindings | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handlePanelBindingsChange = useCallback(
    (next: ExternalEditorPanelBindings) => {
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
    <div className="relative flex min-h-screen w-full bg-background text-foreground">
      {!isSidebarCollapsed && (
        <div
          className="fixed inset-y-0 left-14 right-0 z-40 bg-black/35 backdrop-blur-[1px] transition-opacity"
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

      <div className="ml-14 w-full flex-1">
        <StudioHeader
          activeSessionName={activeSessionName}
          activeEditId={activeEditId}
          isLoading={isLoading}
          onStartEmptyProject={handleStartEmptyProject}
          onSaveSession={(name) => handleSaveSession(name, panelBindings)}
          hasMascotOverlay={Boolean(existingMascotOverlay)}
          isCreatingMascotVideo={panelBindings?.isCreatingMascotVideo ?? false}
          mascotProgress={panelBindings?.mascotProgress ?? ""}
          onCreateMascotVideo={panelBindings?.onMascotCreateVideo}
        />

        <main className="min-h-[calc(100vh-56px)] bg-[linear-gradient(180deg,hsl(var(--muted)/0.45)_0%,hsl(var(--background))_100%)] p-2 sm:p-3 lg:p-4">
          <div className="h-full rounded-2xl border border-border bg-card/95 shadow-xl backdrop-blur-sm">
            <CoreVideoEditor
              onFirstVideoAdded={handleCreateProjectOnFirstVideo}
              onVideoDrop={(video) => {
                void handleStartFromHighlight({
                  url: video.url,
                  id: undefined,
                });
              }}
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
  );
}
