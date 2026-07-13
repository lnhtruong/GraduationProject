"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  Film,
  FolderOpen,
  Mic,
  Sparkles,
  Sticker,
  Type,
  UploadCloud,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  MascotImage,
  UserVideo,
} from "@/features/editor/types";
import type {
  ExternalEditorPanelBindings,
  TextOption,
} from "@/features/editor/types";
import EffectOptions from "@/features/editor/components/optionDetails/Effect";
import TextOptions from "@/features/editor/components/optionDetails/Text";
import MascotOptions from "@/features/editor/components/optionDetails/Mascot";
import VoiceOptions from "@/features/editor/components/optionDetails/Voice";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { useCloudinaryDirectUpload } from "@/features/cloudinary";
import {
  createMediaUploadStream,
  type VideoCompletedPayload,
} from "@/features/_shared/realtime/media-upload-stream";
import { videoKeys } from "@/features/video/api/video.hooks";
import { videoApi } from "@/features/video/api/video.api";
import { authStorageHelper } from "@/store/auth";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface StudioSidebarProps {
  highlightVideos: UserVideo[];
  highlightVideosLoading: boolean;
  mascotImages: MascotImage[];
  mascotImagesLoading: boolean;
  onSelectVideo: (video: {
    id?: number;
    video_id?: number;
    url: string;
  }) => void;
  selectedMascotImageId?: number | null;
  onSelectMascotImage?: (image: { image_id?: number; url: string }) => void;
  panelBindings: ExternalEditorPanelBindings | null;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export function StudioSidebar({
  highlightVideos,
  highlightVideosLoading,
  mascotImages,
  mascotImagesLoading,
  onSelectVideo,
  selectedMascotImageId,
  onSelectMascotImage,
  panelBindings,
  collapsed,
  onToggleCollapsed,
}: StudioSidebarProps) {
  const [activeTab, setActiveTab] = useState<
    "files" | "effect" | "mascot" | "text" | "voice"
  >("files");
  const [search, setSearch] = useState("");
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploadPending, setIsUploadPending] = useState(false);
  const inFlightUploadKeyRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useCloudinaryDirectUpload((percent: number) =>
    setUploadProgress(percent),
  );

  const resolveUserId = (): number | undefined => {
    if (typeof user?.id === "number") return user.id;
    const stored = authStorageHelper.getUser() as {
      id?: number;
      user_id?: number;
    } | null;
    if (typeof stored?.id === "number") return stored.id;
    if (typeof stored?.user_id === "number") return stored.user_id;
    return undefined;
  };

  const validateVideoDuration = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      const url = URL.createObjectURL(file);

      const onLoadedMetadata = () => {
        const duration = Math.round(video.duration);
        const maxDuration = 180; // 3 minutes in seconds

        URL.revokeObjectURL(url);
        video.removeEventListener("loadedmetadata", onLoadedMetadata);

        if (duration > maxDuration) {
          const minutes = Math.ceil(duration / 60);
          toast.error(`Video quá dài (${minutes} phút). Tối đa 3 phút.`);
          resolve(false);
          return;
        }

        resolve(true);
      };

      const onError = () => {
        URL.revokeObjectURL(url);
        video.removeEventListener("loadedmetadata", onLoadedMetadata);
        video.removeEventListener("error", onError);
        toast.error("Không thể xác định độ dài video. Vui lòng thử tệp khác.");
        resolve(false);
      };

      video.addEventListener("loadedmetadata", onLoadedMetadata, { once: true });
      video.addEventListener("error", onError, { once: true });
      video.src = url;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadOpen(true);
      void handleUploadFile(file);
    }
    e.target.value = "";
  };

  const waitForUploadedVideoId = (
    uploadedUrl: string,
    timeoutMs = 30000,
  ): Promise<number | undefined> => {
    const userId = resolveUserId();
    if (!userId || !uploadedUrl) {
      return Promise.resolve(undefined);
    }

    return new Promise((resolve) => {
      const normalizeUrl = (value?: string) => {
        if (!value) return "";
        try {
          const parsed = new URL(value);
          return `${parsed.origin}${parsed.pathname}`;
        } catch {
          return value;
        }
      };

      const targetUrl = normalizeUrl(uploadedUrl);
      let settled = false;
      let polling = false;
      let pollTimer: number | null = null;

      const finish = (videoId?: number) => {
        if (settled) return;
        settled = true;
        stream.close();
        clearTimeout(timeout);
        if (pollTimer) clearInterval(pollTimer);
        resolve(videoId);
      };

      const findPersistedVideo = async () => {
        if (polling || settled) return;
        polling = true;
        try {
          const videos = await videoApi.getAllByUser("highlight");
          const matched = videos.find(
            (video) => normalizeUrl(video.url) === targetUrl,
          );
          if (matched?.id) finish(matched.id);
        } finally {
          polling = false;
        }
      };

      const timeout = window.setTimeout(() => {
        finish(undefined);
      }, timeoutMs);

      const stream = createMediaUploadStream(
        {
          onCompleted: (payload: VideoCompletedPayload) => {
            const eventUrl = payload?.data?.url;
            const eventId = payload?.data?.videoId;
            if (normalizeUrl(eventUrl) === targetUrl && eventId) {
              finish(eventId);
            }
          },
          onProgress: () => {},
        },
        { userId },
      );

      // fallback polling
      pollTimer = window.setInterval(findPersistedVideo, 2500);
      void findPersistedVideo();
    });
  };

  const handleUploadFile = async (file: File) => {
    const uploadKey = `${file.name}:${file.size}:${file.lastModified}`;
    if (inFlightUploadKeyRef.current === uploadKey) return;
    inFlightUploadKeyRef.current = uploadKey;

    setIsUploadPending(true);
    setUploadProgress(0);

    // Validate video duration
    const isValidDuration = await validateVideoDuration(file);
    if (!isValidDuration) {
      setIsUploadOpen(false);
      setIsUploadPending(false);
      inFlightUploadKeyRef.current = null;
      return;
    }

    try {
      const uploadJobId = crypto.randomUUID();
      const response = await uploadMutation.mutateAsync({
        file,
        folderName: "editor-uploads",
        jobId: uploadJobId,
        type: "highlight",
      });

      const uploadedUrl = response.secure_url;
      const videoId = await waitForUploadedVideoId(uploadedUrl);
      if (!videoId) {
        throw new Error(
          "Video đã tải lên nhưng máy chủ chưa xác nhận lưu. Vui lòng thử lại sau.",
        );
      }
      await queryClient.invalidateQueries({ queryKey: videoKeys.root });
      toast.success("Video đã được thêm vào thư viện");
      setIsUploadOpen(false);
    } catch (error) {
      console.error("[StudioSidebar] Upload failed:", error);
      setIsUploadOpen(false);
    } finally {
      setIsUploadPending(false);
      inFlightUploadKeyRef.current = null;
    }
  };
  const [draftText, setDraftText] = useState<TextOption>(() => ({
    id: crypto.randomUUID(),
    text: "",
    position: { x: 50, y: 50 },
    fontSize: 32,
    color: "#FFFFFF",
    fontFamily: "Arial",
    fontWeight: "bold",
    fontStyle: "normal",
    textDecoration: "none",
    textAlign: "center",
    startTime: 0,
    duration: 5000,
    width: 300,
    height: 100,
  }));

  const handleTabChange = (
    tab: "files" | "effect" | "mascot" | "text" | "voice",
  ) => {
    setActiveTab(tab);
  };

  const filterByUrl = <T extends { url: string }>(items: T[]) => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return items;

    return items.filter((item) => {
      const fileName = item.url?.split("/").pop()?.split("?")[0] || "";
      return fileName.toLowerCase().includes(keyword);
    });
  };

  const filteredHighlightVideos = filterByUrl(highlightVideos);
  const filteredMascotImages = filterByUrl(mascotImages);

  const formatDuration = (duration?: number | null) => {
    if (!duration || duration <= 0) return null;
    const totalSeconds = Math.max(0, Math.round(duration));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const textOverlays = useMemo(() => {
    if (!panelBindings) return [];
    return panelBindings.layers
      .filter((l) => l.type === "text")
      .map((l) => l.data as TextOption);
  }, [panelBindings]);

  useEffect(() => {
    if (panelBindings?.selectedTextId) return;
    setDraftText((prev) => ({
      ...prev,
      id: crypto.randomUUID(),
    }));
  }, [panelBindings?.selectedTextId]);

  const currentText = useMemo<TextOption>(() => {
    if (!panelBindings) {
      return draftText;
    }

    return textOverlays.find((t) => t.id === panelBindings.selectedTextId) || draftText;
  }, [draftText, panelBindings, textOverlays]);

  const handleTextChange = (newValue: TextOption) => {
    if (!panelBindings) return;
    const selectedId = panelBindings.selectedTextId;

    if (selectedId && textOverlays.find((t) => t.id === selectedId)) {
      panelBindings.onTextUpdate(selectedId, newValue);
    } else {
      setDraftText(newValue);
    }
  };

  const handleTextAdd = () => {
    if (!panelBindings) return;
    const textValue = currentText.text.trim();
    if (!textValue) return;
    const newText: TextOption = {
      id: crypto.randomUUID(),
      text: textValue,
      position: currentText.position,
      fontSize: currentText.fontSize,
      color: currentText.color,
      fontFamily: currentText.fontFamily,
      fontWeight: currentText.fontWeight,
      fontStyle: currentText.fontStyle,
      textDecoration: currentText.textDecoration,
      textAlign: currentText.textAlign,
      startTime: currentText.startTime ?? 0,
      duration: currentText.duration || 5000,
      width: currentText.width || 300,
      height: currentText.height || 100,
    };
    panelBindings.onTextAdd(newText);
    panelBindings.onTextSelect(newText.id);
    setDraftText((prev) => ({
      ...prev,
      id: crypto.randomUUID(),
      text: "",
    }));
  };

  const handleTextRemove = () => {
    if (!panelBindings?.selectedTextId) return;
    panelBindings.onTextRemove(panelBindings.selectedTextId);
    const remaining = textOverlays.filter(
      (t) => t.id !== panelBindings.selectedTextId,
    );
    panelBindings.onTextSelect(remaining[0]?.id || null);
  };

  return (
    <aside
      className={`fixed left-0 top-0 z-50 h-screen bg-muted/55 text-foreground shadow-2xl motion-safe:transition-all motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)] lg:shadow-sm ${"translate-x-0"} ${
        collapsed ? "w-14 lg:w-[4.5rem]" : "w-[88vw] sm:w-[28rem] lg:w-[28rem]"
      }`}
    >
      <div className="flex h-full w-full overflow-hidden border-r border-border">
        <div
          className={`flex h-full shrink-0 ${
            collapsed ? "w-14 lg:w-[4.5rem]" : "w-[88vw] sm:w-[28rem] lg:w-[28rem]"
          }`}
        >
          <Tabs
            value={activeTab}
            onValueChange={(value) => {
              handleTabChange(
                value as "files" | "effect" | "mascot" | "text" | "voice",
              );
            }}
            className="flex h-full w-full flex-row gap-0"
          >
            <nav className="flex w-14 shrink-0 flex-col items-center border-r border-border bg-muted p-1.5 lg:w-18 lg:p-2">
              <div className="mb-3 flex items-center justify-center">
                <div className="grid h-9 w-9 place-items-center overflow-hidden rounded-lg">
                  <Image
                    src="/logo.png"
                    alt="Logo"
                    width={28}
                    height={28}
                    className="object-contain"
                  />
                </div>
              </div>

              <TabsList
                className="flex h-auto w-full flex-col gap-0 border-0 bg-transparent p-0"
                onClick={() => {
                  if (collapsed) {
                    onToggleCollapsed();
                  }
                }}
              >
                <TabsTrigger
                  value="files"
                  className="mb-2 flex w-full flex-col items-center rounded-lg px-1 py-2 text-[11px] whitespace-nowrap transition data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-accent data-[state=inactive]:hover:text-foreground border-0"
                >
                  <FolderOpen size={16} className="lg:mb-1" />
                  <span className="hidden lg:block">Tệp</span>
                </TabsTrigger>
                <TabsTrigger
                  value="effect"
                  className="mb-2 flex w-full flex-col items-center rounded-lg px-1 py-2 text-[11px] whitespace-nowrap transition data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-accent data-[state=inactive]:hover:text-foreground border-0"
                >
                  <Sparkles size={16} className="lg:mb-1" />
                  <span className="hidden lg:block">Hiệu ứng</span>
                </TabsTrigger>
                <TabsTrigger
                  value="mascot"
                  className="mb-2 flex w-full flex-col items-center rounded-lg px-1 py-2 text-[11px] whitespace-nowrap transition data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-accent data-[state=inactive]:hover:text-foreground border-0"
                >
                  <Sticker size={16} className="lg:mb-1" />
                  <span className="hidden lg:block">Mascot</span>
                </TabsTrigger>
                <TabsTrigger
                  value="text"
                  className="flex w-full flex-col items-center rounded-lg px-1 py-2 text-[11px] whitespace-nowrap transition data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-accent data-[state=inactive]:hover:text-foreground border-0"
                >
                  <Type size={16} className="lg:mb-1" />
                  <span className="hidden lg:block">Văn bản</span>
                </TabsTrigger>
                <TabsTrigger
                  value="voice"
                  className="mt-2 flex w-full flex-col items-center rounded-lg px-1 py-2 text-[11px] whitespace-nowrap transition data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-accent data-[state=inactive]:hover:text-foreground border-0"
                >
                  <Mic size={16} className="lg:mb-1" />
                  <span className="hidden lg:block">Giọng nói</span>
                </TabsTrigger>
              </TabsList>
            </nav>

            <div
              className={`min-w-0 flex-1 shrink-0 overflow-hidden bg-card p-3 sm:p-4 motion-safe:transition-[opacity,transform] motion-safe:duration-300 motion-safe:ease-out ${
                collapsed
                  ? "hidden pointer-events-none -translate-x-2 opacity-0 lg:block"
                  : "block translate-x-0 opacity-100"
              }`}
            >
              <TabsContent value="files" className="m-0 space-y-3">
                <div className="mb-3 rounded-xl border border-border bg-background/70 px-3 py-2">
                  <h3 className="text-sm font-semibold">Tệp</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Highlight videos
                  </p>
                </div>

                <div className="mb-3 rounded-xl border border-border bg-background/70 p-2">
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm video..."
                    className="h-8 border-border bg-background"
                  />
                </div>

                <div className="mb-3 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-border bg-accent px-2 py-1 font-medium text-accent-foreground">
                      Tất cả
                    </span>
                    <span className="rounded-full border border-border px-2 py-1 text-muted-foreground">
                      {filteredHighlightVideos.length} video
                    </span>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="video/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button
                    onClick={() => {
                      window.dispatchEvent(
                        new Event("editor-media-upload-request"),
                      );
                    }}
                    className="h-8 gap-2 px-3 shadow-sm"
                    size="sm"
                  >
                    <UploadCloud size={14} />
                    Tải lên
                  </Button>
                </div>

                <ScrollArea className="h-[calc(100dvh-230px)] w-full overflow-x-hidden pr-2">
                  <div className="space-y-2 pb-4">
                    {highlightVideosLoading ? (
                      <div className="rounded-lg border border-border bg-muted/60 px-3 py-4 text-sm text-muted-foreground">
                        Đang tải media...
                      </div>
                    ) : filteredHighlightVideos.length === 0 ? (
                      <div className="rounded-lg border border-border bg-muted/60 px-3 py-4 text-sm text-muted-foreground">
                        Không tìm thấy video phù hợp.
                      </div>
                    ) : (
                      filteredHighlightVideos.map((video) => {
                        const key = video.video_id ?? video.id ?? video.url;
                        const isCurrentVideo =
                          Boolean(panelBindings?.videoSourceUrl) &&
                          video.url === panelBindings?.videoSourceUrl;
                        const fileName =
                          video.url?.split("/").pop()?.split("?")[0] || "Video";
                        const thumbnailSrc = video.thumbnail || video.url;

                        return (
                          <button
                            key={key}
                            type="button"
                            draggable
                            onClick={() => onSelectVideo(video)}
                            onDragStart={(e) => {
                              const dragData = {
                                type: "video",
                                id: video.video_id ?? video.id,
                                video_id: video.video_id ?? video.id,
                                url: video.url,
                                fileName,
                              };
                              e.dataTransfer?.setData(
                                "application/json",
                                JSON.stringify(dragData),
                              );
                              e.dataTransfer.effectAllowed = "copy";
                            }}
                            className={`w-full rounded-xl border p-2 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
                              isCurrentVideo
                                ? "border-primary bg-primary/[0.02] shadow-xs ring-1 ring-primary/20"
                                : "border-border bg-background hover:border-primary/70 hover:bg-accent/25"
                            }`}
                          >
                            <div className="space-y-2">
                              <div className="h-24 w-full overflow-hidden rounded-lg border border-border bg-muted/45 relative">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={thumbnailSrc}
                                  alt="Video thumbnail"
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                  onError={(e) => {
                                    const target = e.currentTarget;
                                    if (target.src !== video.url) {
                                      target.src = video.url;
                                    }
                                  }}
                                />
                                {isCurrentVideo && (
                                  <div className="absolute top-1.5 right-1.5 rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold text-primary-foreground shadow-sm">
                                    Đang mở
                                  </div>
                                )}
                              </div>

                              <div className="px-0.5">
                                <p className="truncate font-semibold text-xs text-foreground block w-full" title={video.name || fileName}>
                                  {video.name || fileName}
                                </p>
                              </div>

                              <div className="flex items-center justify-between text-[11px] text-muted-foreground px-0.5">
                                <span className="rounded-full border border-border px-1.5 py-0.5 bg-muted/40">
                                  <Film size={10} className="mr-1 inline" />
                                  {video.type ?? "video"}
                                </span>
                                {formatDuration(video.duration) ? (
                                  <span>{formatDuration(video.duration)}</span>
                                ) : null}
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="effect" className="m-0">
                <div className="mb-3 rounded-xl border border-border bg-background/70 px-3 py-2">
                  <h3 className="text-sm font-semibold">Hiệu ứng</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Chỉnh bộ lọc và thông số video
                  </p>
                </div>
                {panelBindings ? (
                  <div className="max-h-[calc(100dvh-170px)] min-w-0 overflow-x-hidden overflow-y-auto rounded-xl border border-border bg-background p-3 pr-2">
                    <EffectOptions
                      value={panelBindings.effect}
                      onChange={panelBindings.onEffectChange}
                    />
                  </div>
                ) : (
                  <div className="rounded-lg border border-border bg-muted/60 px-3 py-4 text-sm text-muted-foreground">
                    Đang khởi tạo editor...
                  </div>
                )}
              </TabsContent>

              <TabsContent value="mascot" className="m-0 space-y-3">
                <div className="mb-3 rounded-xl border border-border bg-background/70 px-3 py-2">
                  <h3 className="text-sm font-semibold">Mascot</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Quản lý mascot cho project
                  </p>
                </div>

                <div className="mb-3 rounded-xl border border-border bg-background/70 p-2">
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm mascot image..."
                    className="h-8 border-border bg-background"
                  />
                </div>

                <ScrollArea className="h-[calc(100dvh-210px)] w-full overflow-x-hidden pr-2">
                  <div className="space-y-2 pb-6">
                    {mascotImagesLoading ? (
                      <div className="rounded-lg border border-border bg-muted/60 px-3 py-4 text-sm text-muted-foreground">
                        Đang tải mascot image...
                      </div>
                    ) : filteredMascotImages.length === 0 ? (
                      <div className="rounded-lg border border-border bg-muted/60 px-3 py-4 text-sm text-muted-foreground">
                        Chưa có mascot image.
                      </div>
                    ) : (
                      <div className="rounded-xl border border-border bg-background p-2">
                        <div className="mb-2 text-[11px] text-muted-foreground">
                          {filteredMascotImages.length} mascot image
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {filteredMascotImages.map((image) => {
                            const key = image.image_id ?? image.url;
                            const isSelected =
                              typeof image.image_id === "number" &&
                              image.image_id === selectedMascotImageId;

                            return (
                              <button
                                key={key}
                                type="button"
                                onClick={() => {
                                  onSelectMascotImage?.(image);

                                  panelBindings?.onMascotChange({
                                    ...panelBindings.mascot,
                                    type: "custom",
                                    customFile: undefined,
                                    imageId: image.image_id,
                                    presetUrl: image.url,
                                    presetId: undefined,
                                    position:
                                      panelBindings.mascot.position ===
                                      "replace"
                                        ? "bottom-right"
                                        : panelBindings.mascot.position,
                                    margin_x:
                                      panelBindings.mascot.margin_x || 40,
                                    margin_y:
                                      panelBindings.mascot.margin_y || 40,
                                    scale: panelBindings.mascot.scale || 1,
                                    previewPlacement:
                                      panelBindings.mascot.previewPlacement,
                                  });
                                }}
                                className={`relative aspect-square min-w-0 overflow-hidden rounded-lg border transition-all ${
                                  isSelected
                                    ? "border-primary bg-primary/10 ring-2 ring-primary"
                                    : "border-border hover:border-primary/50 hover:scale-105"
                                }`}
                                title="Chọn mascot"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={image.url}
                                  alt="Mascot image"
                                  className="h-full w-full object-contain p-1"
                                  loading="lazy"
                                />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {panelBindings ? (
                      <div className="min-w-0 rounded-xl border border-border bg-background p-3">
                        <MascotOptions
                          value={panelBindings.mascot}
                          onChange={panelBindings.onMascotChange}
                          onApply={panelBindings.onMascotApply}
                          onCreateVideo={panelBindings.onMascotCreateVideo}
                          isApplying={panelBindings.isApplyingMascot}
                          isCreatingVideo={panelBindings.isCreatingMascotVideo}
                          mascotProgress={panelBindings.mascotProgress}
                          onMascotImageIdChange={(imageId) =>
                            onSelectMascotImage?.({
                              image_id:
                                typeof imageId === "number"
                                  ? imageId
                                  : undefined,
                              url: "",
                            })
                          }
                          hasVideo={Boolean(
                            panelBindings.videoFile ||
                            panelBindings.videoSourceUrl,
                          )}
                        />
                      </div>
                    ) : null}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="text" className="m-0">
                <div className="mb-3 rounded-xl border border-border bg-background/70 px-3 py-2">
                  <h3 className="text-sm font-semibold">Văn bản</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Thêm và chỉnh sửa text layers
                  </p>
                </div>
                {panelBindings ? (
                  <div className="max-h-[calc(100dvh-170px)] min-w-0 overflow-x-hidden overflow-y-auto rounded-xl border border-border bg-background p-3 pr-2">
                    <TextOptions
                      value={currentText}
                      onChange={handleTextChange}
                      onAdd={handleTextAdd}
                      onRemove={
                        panelBindings.selectedTextId
                          ? handleTextRemove
                          : undefined
                      }
                    />
                  </div>
                ) : (
                  <div className="rounded-lg border border-border bg-muted/60 px-3 py-4 text-sm text-muted-foreground">
                    Đang khởi tạo editor...
                  </div>
                )}
              </TabsContent>

              <TabsContent value="voice" className="m-0">
                <div className="mb-3 rounded-xl border border-border bg-background/70 px-3 py-2">
                  <h3 className="text-sm font-semibold">Giọng nói</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Chỉnh giọng nói
                  </p>
                </div>
                {panelBindings ? (
                  <div className="max-h-[calc(100dvh-170px)] min-w-0 overflow-x-hidden overflow-y-auto rounded-xl border border-border bg-background p-3 pr-2">
                    <VoiceOptions
                      value={panelBindings.voice}
                      onChange={panelBindings.onVoiceChange}
                    />
                  </div>
                ) : (
                  <div className="rounded-lg border border-border bg-muted/60 px-3 py-4 text-sm text-muted-foreground">
                    Đang khởi tạo editor...
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="absolute -right-3 top-1/2 hidden h-14 w-3 -translate-y-1/2 items-center justify-center rounded-r-md border border-l-0 border-border bg-background/95 text-muted-foreground shadow-sm transition hover:bg-accent hover:text-foreground lg:flex"
            title={collapsed ? "Mở rộng bảng công cụ" : "Thu gọn bảng công cụ"}
          >
            {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={10}>
          {collapsed ? "Mở rộng" : "Thu gọn"} bảng công cụ
        </TooltipContent>
      </Tooltip>

      <Dialog open={isUploadOpen} onOpenChange={(next) => {
        if (!isUploadPending) {
          setIsUploadOpen(next);
        }
      }}>
        <DialogContent
          className="w-[92vw] max-w-md overflow-hidden rounded-2xl border border-border/70 p-0 shadow-2xl flex flex-col"
        >
          <div className="flex flex-col">
            <DialogHeader className="border-b border-border/70 bg-linear-to-r from-background to-muted/20 px-5 py-4 text-left relative pr-12">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <UploadCloud className="h-3.5 w-3.5 animate-pulse" />
                <span>Tải lên video thư viện</span>
              </div>
              <DialogTitle className="text-lg font-bold mt-2">
                Đang tải video
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground/80 mt-1">
                Tệp video của bạn đang được tải lên Cloudinary trực tiếp. Vui lòng chờ cho đến khi hoàn thành.
              </DialogDescription>
            </DialogHeader>

            <div className="px-5 py-6">
              <div className="flex flex-col items-center justify-center gap-4 text-center">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold">Đang tải video lên Cloudinary...</p>
                  <p className="text-xs text-muted-foreground">Tiến trình: {uploadProgress}%</p>
                </div>
                <div className="w-full max-w-xs bg-muted rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-primary h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
