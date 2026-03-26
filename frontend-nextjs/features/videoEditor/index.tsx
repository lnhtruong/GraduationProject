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
          prev.effect === next.effect &&
          prev.mascot === next.mascot &&
          prev.voice === next.voice &&
          prev.layers === next.layers &&
          prev.selectedTextId === next.selectedTextId &&
          prev.videoFile === next.videoFile &&
          prev.isApplyingMascot === next.isApplyingMascot &&
          prev.mascotProgress === next.mascotProgress;

        if (sameState) {
          return prev;
        }

        return {
          ...prev,
          effect: next.effect,
          mascot: next.mascot,
          voice: next.voice,
          layers: next.layers,
          selectedTextId: next.selectedTextId,
          videoFile: next.videoFile,
          isApplyingMascot: next.isApplyingMascot,
          mascotProgress: next.mascotProgress,
          onEffectChange: next.onEffectChange,
          onMascotChange: next.onMascotChange,
          onMascotApply: next.onMascotApply,
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
    handleStartEmptyProject,
    handleCreateProjectOnFirstVideo,
    handleStartFromHighlight,
    handleSaveSession,
  } = useStudioSession();

  return (
    <div className="relative flex min-h-screen w-full bg-background text-foreground">
      {!isSidebarCollapsed && (
        <div
          className="fixed inset-y-0 left-14 right-0 z-40 bg-black/45 backdrop-blur-[1px] transition-opacity lg:hidden"
          onClick={() => setIsSidebarCollapsed(true)}
        />
      )}

      <StudioSidebar
        highlightVideos={highlightVideos}
        highlightVideosLoading={highlightVideosLoading}
        mascotVideos={mascotVideos}
        mascotVideosLoading={mascotVideosLoading}
        onSelectVideo={(video) => {
          void handleStartFromHighlight(video);
        }}
        panelBindings={panelBindings}
        collapsed={isSidebarCollapsed}
        onToggleCollapsed={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      <div
        className={`ml-14 w-full flex-1 motion-safe:transition-[margin] motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)] ${isSidebarCollapsed ? "lg:ml-18" : "lg:ml-90"}`}
      >
        <StudioHeader
          activeSessionName={activeSessionName}
          activeEditId={activeEditId}
          isLoading={isLoading}
          onStartEmptyProject={handleStartEmptyProject}
          onSaveSession={handleSaveSession}
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
              hideRightPanel
              onPanelBindingsChange={handlePanelBindingsChange}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
