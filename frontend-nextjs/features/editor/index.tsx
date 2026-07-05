"use client";

import { useCallback, useRef, useState } from "react";
import { Monitor, UploadCloud } from "lucide-react";
import CoreEditor from "@/features/editor/components/CoreEditor";
import type { ExternalEditorPanelBindings } from "@/features/editor/types";
import { useStudioSession } from "@/features/editor/hooks/useStudioSession";
import { StudioHeader } from "@/features/editor/components/studio/StudioHeader";
import { StudioSidebar } from "@/features/editor/components/studio/StudioSidebar";

export default function Editor() {
  const [panelBindings, setPanelBindings] =
    useState<ExternalEditorPanelBindings | null>(null);
  const panelBindingsRef = useRef<ExternalEditorPanelBindings | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground lg:hidden">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Monitor className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-xl font-bold">Studio chỉnh sửa cần màn hình lớn</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Trình chỉnh sửa video có timeline, preview và nhiều bảng công cụ nên hiện chỉ hỗ trợ tốt trên desktop hoặc laptop.
          </p>
          <a
            href="/upload"
            className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            <UploadCloud className="h-4 w-4" />
            Tải video lên
          </a>
        </div>
      </div>

      <div className="relative hidden min-h-screen w-full bg-background text-foreground lg:flex">
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
          onSaveSession={(name) =>
            handleSaveSession(name, panelBindingsRef.current)
          }
          hasMascotOverlay={Boolean(existingMascotOverlay)}
          isCreatingMascotVideo={panelBindings?.isCreatingMascotVideo ?? false}
          mascotProgress={panelBindings?.mascotProgress ?? ""}
          onCreateMascotVideo={panelBindings?.onMascotCreateVideo}
        />

        <main className="min-h-[calc(100vh-56px)] bg-[linear-gradient(180deg,hsl(var(--muted)/0.45)_0%,hsl(var(--background))_100%)] p-2 sm:p-3 lg:p-4">
          <div className="h-full rounded-2xl border border-border bg-card/95 shadow-xl backdrop-blur-sm">
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
