"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Film,
  FolderOpen,
  Library,
  Mic,
  SlidersHorizontal,
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
import { BRAND } from "@/lib/brand";

const VIDEO_PAGE_SIZE = 12;

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
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "files" | "effect" | "mascot" | "text" | "voice"
  >("files");
  const [search, setSearch] = useState("");
  const [visibleVideoCount, setVisibleVideoCount] =
    useState(VIDEO_PAGE_SIZE);
  const loadMoreVideosRef = useRef<HTMLDivElement | null>(null);
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
  const normalizedVisibleVideoCount = Math.min(
    visibleVideoCount,
    Math.max(filteredHighlightVideos.length, VIDEO_PAGE_SIZE),
  );
  const visibleHighlightVideos = filteredHighlightVideos.slice(
    0,
    normalizedVisibleVideoCount,
  );
  const hasMoreHighlightVideos =
    normalizedVisibleVideoCount < filteredHighlightVideos.length;

  useEffect(() => {
    if (!hasMoreHighlightVideos || highlightVideosLoading) return;
    const node = loadMoreVideosRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setVisibleVideoCount((prev) =>
          Math.min(prev + VIDEO_PAGE_SIZE, filteredHighlightVideos.length),
        );
      },
      { rootMargin: "160px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [
    filteredHighlightVideos.length,
    hasMoreHighlightVideos,
    highlightVideosLoading,
  ]);

  const handleOpenVideoUpload = () => {
    if (!collapsed) {
      onToggleCollapsed();
    }

    window.setTimeout(() => {
      window.dispatchEvent(new Event("editor-media-upload-request"));
    }, 0);
  };

  const handleSelectVideo = (video: {
    id?: number;
    video_id?: number;
    url: string;
  }) => {
    onSelectVideo(video);
    if (!collapsed) {
      onToggleCollapsed();
    }
  };

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
      className={`fixed z-50 bg-muted/55 text-foreground shadow-2xl motion-safe:transition-all motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)] lg:left-0 lg:top-0 lg:h-screen lg:shadow-sm ${
        collapsed
          ? "inset-x-0 bottom-0 h-16 w-full lg:inset-auto lg:w-[4.5rem]"
          : "inset-x-0 bottom-0 h-[72dvh] w-full rounded-t-2xl lg:inset-auto lg:h-screen lg:w-[28rem] lg:rounded-none"
      }`}
    >
      <div className="flex h-full w-full overflow-hidden border-t border-border lg:border-r lg:border-t-0">
        <div
          className={`flex h-full shrink-0 ${
            collapsed
              ? "w-full lg:w-[4.5rem]"
              : "w-full lg:w-[28rem]"
          }`}
        >
          <Tabs
            value={activeTab}
            onValueChange={(value) => {
              handleTabChange(
                value as "files" | "effect" | "mascot" | "text" | "voice",
              );
            }}
            className={`flex h-full w-full gap-0 ${
              collapsed ? "flex-row" : "flex-col-reverse lg:flex-row"
            }`}
          >
            <nav
              className={`flex shrink-0 items-center border-border bg-muted p-1.5 lg:w-18 lg:flex-col lg:border-r lg:p-2 ${
                collapsed
                  ? "h-full w-full flex-row justify-between border-t bg-background/95 px-3 py-2 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur lg:h-auto lg:w-18 lg:flex-col lg:justify-start lg:border-t-0 lg:bg-muted lg:px-2 lg:py-2 lg:shadow-none"
                  : "h-16 w-full flex-row justify-between border-t bg-background/95 px-3 py-2 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur lg:h-full lg:w-18 lg:flex-col lg:justify-start lg:border-r lg:border-t-0 lg:bg-muted lg:px-2 lg:py-2 lg:shadow-none"
              }`}
            >
              <div
                className={`items-center justify-center ${
                  collapsed
                    ? "hidden lg:mb-3 lg:flex lg:h-10 lg:w-10 lg:shrink-0"
                    : "hidden lg:mb-3 lg:flex lg:h-10 lg:w-10 lg:shrink-0"
                }`}
              >
                <button
                  type="button"
                  aria-label="Về trang chủ"
                  title="Về trang chủ"
                  onClick={() => router.push("/")}
                  className="grid h-9 w-9 cursor-pointer place-items-center overflow-hidden rounded-lg"
                >
                  <Image
                    src={BRAND.logo}
                    alt="Logo"
                    width={28}
                    height={28}
                    className="object-contain"
                  />
                </button>
              </div>

              <TabsList
                className={`h-auto border-0 bg-transparent p-0 ${
                  collapsed
                    ? "grid flex-1 grid-cols-5 gap-1 lg:flex lg:w-full lg:flex-none lg:flex-col lg:justify-start lg:gap-0"
                    : "grid flex-1 grid-cols-5 gap-1 lg:flex lg:w-full lg:flex-none lg:flex-col lg:gap-0"
                }`}
                onClick={() => {
                  if (collapsed) {
                    onToggleCollapsed();
                  }
                }}
              >
                <TabsTrigger
                  value="files"
                  className="mx-auto flex h-12 w-full flex-none flex-col items-center justify-center rounded-xl px-1 py-1.5 text-[11px] whitespace-nowrap transition data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-accent data-[state=inactive]:hover:text-foreground border-0 lg:mb-2 lg:h-auto lg:rounded-lg lg:py-2"
                >
                  <FolderOpen size={16} className="lg:mb-1" />
                  <span className="mt-0.5 block text-[10px] leading-none lg:text-[11px]">
                    Tệp
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="effect"
                  className="mx-auto flex h-12 w-full flex-none flex-col items-center justify-center rounded-xl px-1 py-1.5 text-[11px] whitespace-nowrap transition data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-accent data-[state=inactive]:hover:text-foreground border-0 lg:mb-2 lg:h-auto lg:rounded-lg lg:py-2"
                >
                  <SlidersHorizontal size={16} className="lg:mb-1" />
                  <span className="mt-0.5 block text-[10px] leading-none lg:text-[11px]">
                    Hiệu ứng
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="mascot"
                  className="mx-auto flex h-12 w-full flex-none flex-col items-center justify-center rounded-xl px-1 py-1.5 text-[11px] whitespace-nowrap transition data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-accent data-[state=inactive]:hover:text-foreground border-0 lg:mb-2 lg:h-auto lg:rounded-lg lg:py-2"
                >
                  <Sticker size={16} className="lg:mb-1" />
                  <span className="mt-0.5 block text-[10px] leading-none lg:text-[11px]">
                    Mascot
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="text"
                  className="mx-auto flex h-12 w-full flex-none flex-col items-center justify-center rounded-xl px-1 py-1.5 text-[11px] whitespace-nowrap transition data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-accent data-[state=inactive]:hover:text-foreground border-0 lg:h-auto lg:rounded-lg lg:py-2"
                >
                  <Type size={16} className="lg:mb-1" />
                  <span className="mt-0.5 block text-[10px] leading-none lg:text-[11px]">
                    Text
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="voice"
                  className="mx-auto flex h-12 w-full flex-none flex-col items-center justify-center rounded-xl px-1 py-1.5 text-[11px] whitespace-nowrap transition data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-accent data-[state=inactive]:hover:text-foreground border-0 lg:mt-2 lg:h-auto lg:rounded-lg lg:py-2"
                >
                  <Mic size={16} className="lg:mb-1" />
                  <span className="mt-0.5 block text-[10px] leading-none lg:text-[11px]">
                    Audio
                  </span>
                </TabsTrigger>
              </TabsList>
            </nav>

            <div
              className={`min-h-0 min-w-0 flex-1 overflow-hidden bg-card p-3 sm:p-4 motion-safe:transition-[opacity,transform] motion-safe:duration-300 motion-safe:ease-out ${
                collapsed
                  ? "hidden pointer-events-none translate-y-2 opacity-0 lg:block lg:-translate-x-2 lg:translate-y-0"
                  : "block translate-y-0 opacity-100 lg:translate-x-0"
              }`}
            >
              <TabsContent value="files" className="m-0 flex h-full min-h-0 flex-col gap-3">
                <div className="rounded-xl border border-border bg-background/70 px-3 py-2">
                  <h3 className="text-sm font-semibold">Tệp</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Highlight videos
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-background/70 p-2">
                  <Input
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setVisibleVideoCount(VIDEO_PAGE_SIZE);
                    }}
                    placeholder="Tìm video..."
                    className="h-8 border-border bg-background"
                  />
                </div>

                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-border bg-accent px-2 py-1 font-medium text-accent-foreground">
                      Tất cả
                    </span>
                    <span className="rounded-full border border-border px-2 py-1 text-muted-foreground">
                      {filteredHighlightVideos.length} video
                    </span>
                  </div>
                  <Button
                    onClick={handleOpenVideoUpload}
                    className="h-8 gap-2 px-3 shadow-sm"
                    size="sm"
                  >
                    <UploadCloud size={14} />
                    Từ máy
                  </Button>
                </div>

                <ScrollArea className="min-h-0 flex-1 w-full overflow-x-hidden pr-2">
                  <div className="space-y-2 pb-20 lg:pb-6">
                    {highlightVideosLoading ? (
                      <div className="rounded-lg border border-border bg-muted/60 px-3 py-4 text-sm text-muted-foreground">
                        Đang tải media...
                      </div>
                    ) : filteredHighlightVideos.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-border bg-background px-4 py-8 text-center shadow-sm">
                        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
                          <Library size={22} />
                        </div>
                        <p className="mt-4 text-sm font-semibold text-foreground">
                          {search.trim()
                            ? "Không có video phù hợp"
                            : "Chưa có video trong thư viện"}
                        </p>
                        <p className="mx-auto mt-1 max-w-[16rem] text-xs leading-5 text-muted-foreground">
                          {search.trim()
                            ? "Thử từ khóa khác hoặc chọn video từ máy để thêm vào thư viện."
                            : "Chọn video từ máy để bắt đầu dựng project đầu tiên."}
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          className="mt-4 gap-2"
                          onClick={handleOpenVideoUpload}
                        >
                          <UploadCloud size={14} />
                          Chọn video từ máy
                        </Button>
                      </div>
                    ) : (
                      <>
                        {visibleHighlightVideos.map((video) => {
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
                            onClick={() => handleSelectVideo(video)}
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
                            className={`w-full rounded-xl border p-2.5 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
                              isCurrentVideo
                                ? "border-primary bg-primary/[0.02] shadow-xs ring-1 ring-primary/20"
                                : "border-border bg-background hover:border-primary/70 hover:bg-accent/25"
                            }`}
                          >
                            <div className="grid min-w-0 grid-cols-[132px_minmax(0,1fr)] gap-3">
                              <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-lg border border-border bg-muted/45">
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

                              <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 py-0.5">
                                <p
                                  className="line-clamp-2 text-sm font-semibold leading-snug text-foreground"
                                  title={video.name || fileName}
                                >
                                  {video.name || fileName}
                                </p>

                                <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                                  <span className="inline-flex min-w-0 items-center rounded-full border border-border bg-muted/40 px-1.5 py-0.5">
                                    <Film size={10} className="mr-1 shrink-0" />
                                    <span className="truncate">
                                      {video.type ?? "video"}
                                    </span>
                                  </span>
                                  {formatDuration(video.duration) ? (
                                    <span className="shrink-0 rounded-full border border-border bg-muted/30 px-1.5 py-0.5">
                                      {formatDuration(video.duration)}
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                        })}

                        <div
                          ref={loadMoreVideosRef}
                          className="flex min-h-10 items-center justify-center pb-1 pt-2 text-xs text-muted-foreground"
                        >
                          {hasMoreHighlightVideos ? (
                            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5">
                              <Loader2 size={12} className="animate-spin" />
                              Đang tải thêm video
                            </span>
                          ) : visibleHighlightVideos.length > VIDEO_PAGE_SIZE ? (
                            <span>
                              Đã hiển thị {visibleHighlightVideos.length} video
                            </span>
                          ) : (
                            <span className="sr-only">
                              Đã hiển thị {visibleHighlightVideos.length} video
                            </span>
                          )}
                        </div>
                      </>
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
                  <div className="max-h-[calc(72dvh-10rem)] min-w-0 overflow-x-hidden overflow-y-auto rounded-xl border border-border bg-background p-3 pb-20 pr-2 lg:max-h-[calc(100dvh-170px)] lg:pb-3">
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
                    Chọn mascot và cấu hình video hoàn chỉnh
                  </p>
                </div>

                <ScrollArea className="h-[calc(72dvh-9rem)] min-h-44 w-full overflow-x-hidden pr-2 lg:h-[calc(100dvh-160px)]">
                  <div className="space-y-2 pb-20 lg:pb-6">
                    {panelBindings ? (
                      <div className="min-w-0">
                        <MascotOptions
                          value={panelBindings.mascot}
                          onChange={panelBindings.onMascotChange}
                          onApply={panelBindings.onMascotApply}
                          onCreateVideo={panelBindings.onMascotCreateVideo}
                          isApplying={panelBindings.isApplyingMascot}
                          isCreatingVideo={panelBindings.isCreatingMascotVideo}
                          mascotProgress={panelBindings.mascotProgress}
                          mascotImages={mascotImages}
                          mascotImagesLoading={mascotImagesLoading}
                          selectedMascotImageId={selectedMascotImageId}
                          onSelectMascotImage={onSelectMascotImage}
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
                  <div className="max-h-[calc(72dvh-10rem)] min-w-0 overflow-x-hidden overflow-y-auto rounded-xl border border-border bg-background p-3 pb-20 pr-2 lg:max-h-[calc(100dvh-170px)] lg:pb-3">
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
                  <div className="max-h-[calc(72dvh-10rem)] min-w-0 overflow-x-hidden overflow-y-auto rounded-xl border border-border bg-background p-3 pb-20 pr-2 lg:max-h-[calc(100dvh-170px)] lg:pb-3">
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
    </aside>
  );
}
