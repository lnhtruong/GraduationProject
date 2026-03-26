"use client";

import { useMemo, useState } from "react";
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
import type { UserVideo } from "@/features/videoEditor/api/editSession.api";
import type {
  ExternalEditorPanelBindings,
  TextOption,
} from "@/features/videoEditor/types";
import EffectOptions from "@/features/videoEditor/components/optionDetails/Effect";
import TextOptions from "@/features/videoEditor/components/optionDetails/Text";
import MascotOptions from "@/features/videoEditor/components/optionDetails/Mascot";
import VoiceOptions from "@/features/videoEditor/components/optionDetails/Voice";

interface StudioSidebarProps {
  highlightVideos: UserVideo[];
  highlightVideosLoading: boolean;
  mascotVideos: UserVideo[];
  mascotVideosLoading: boolean;
  onSelectVideo: (video: {
    id?: number;
    video_id?: number;
    url: string;
  }) => void;
  panelBindings: ExternalEditorPanelBindings | null;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export function StudioSidebar({
  highlightVideos,
  highlightVideosLoading,
  mascotVideos,
  mascotVideosLoading,
  onSelectVideo,
  panelBindings,
  collapsed,
  onToggleCollapsed,
}: StudioSidebarProps) {
  const [activeTab, setActiveTab] = useState<
    "files" | "effect" | "mascot" | "text" | "voice"
  >("files");
  const [search, setSearch] = useState("");

  const handleTabChange = (
    tab: "files" | "effect" | "mascot" | "text" | "voice",
  ) => {
    setActiveTab(tab);
    if (collapsed) {
      onToggleCollapsed();
    }
  };

  const filterVideos = (videos: UserVideo[]) => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return videos;

    return videos.filter((video) => {
      const fileName = video.url?.split("/").pop()?.split("?")[0] || "";
      return fileName.toLowerCase().includes(keyword);
    });
  };

  const filteredHighlightVideos = filterVideos(highlightVideos);
  const filteredMascotVideos = filterVideos(mascotVideos);

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
      return {
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
      };
    }

    return (
      textOverlays.find((t) => t.id === panelBindings.selectedTextId) || {
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
      }
    );
  }, [panelBindings, textOverlays]);

  const handleTextChange = (newValue: TextOption) => {
    if (!panelBindings) return;
    const selectedId = panelBindings.selectedTextId;

    if (selectedId && textOverlays.find((t) => t.id === selectedId)) {
      panelBindings.onTextUpdate(selectedId, newValue);
    } else {
      panelBindings.onTextAdd(newValue);
      panelBindings.onTextSelect(newValue.id);
    }
  };

  const handleTextAdd = () => {
    if (!panelBindings) return;
    const newText: TextOption = {
      id: crypto.randomUUID(),
      text: "New Text",
      position: { x: 50, y: 50 },
      fontSize: 32,
      color: "#FFFFFF",
      fontFamily: "Arial",
      fontWeight: "bold",
      fontStyle: "normal",
      textDecoration: "none",
      textAlign: "center",
    };
    panelBindings.onTextAdd(newText);
    panelBindings.onTextSelect(newText.id);
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
        collapsed ? "w-14 lg:w-18" : "w-[85vw] sm:w-90 lg:w-90"
      }`}
    >
      <div className="flex h-full w-full overflow-hidden border-r border-border">
        <div
          className={`flex h-full shrink-0 ${
            collapsed ? "w-14 lg:w-18" : "w-[85vw] sm:w-90 lg:w-90"
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

              <TabsList className="flex h-auto w-full flex-col gap-0 border-0 bg-transparent p-0">
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
              className={`flex-1 shrink-0 overflow-hidden bg-card p-3 sm:p-4 motion-safe:transition-[opacity,transform] motion-safe:duration-300 motion-safe:ease-out ${
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
                  <a href="/upload" className="block">
                    <Button className="h-8 gap-2 px-3 shadow-sm" size="sm">
                      <UploadCloud size={14} />
                      Upload
                    </Button>
                  </a>
                </div>

                <ScrollArea className="h-[calc(100vh-230px)] pr-1">
                  <div className="space-y-2">
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
                                url: video.url,
                                fileName,
                              };
                              e.dataTransfer?.setData(
                                "application/json",
                                JSON.stringify(dragData),
                              );
                              e.dataTransfer.effectAllowed = "copy";
                            }}
                            className="w-full rounded-xl border border-border bg-background p-2 text-left transition hover:-translate-y-0.5 hover:border-primary/70 hover:bg-accent/25 hover:shadow-md"
                          >
                            <div className="space-y-2">
                              <div className="h-24 w-full overflow-hidden rounded-lg border border-border bg-muted/45">
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
                              </div>

                              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                <span className="rounded-full border border-border px-2 py-0.5">
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
                  <div className="max-h-[calc(100vh-170px)] overflow-y-auto rounded-xl border border-border bg-background p-3 pr-1">
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
                    placeholder="Tìm mascot video..."
                    className="h-8 border-border bg-background"
                  />
                </div>

                <ScrollArea className="h-[calc(100vh-210px)] pr-1">
                  <div className="space-y-2">
                    {mascotVideosLoading ? (
                      <div className="rounded-lg border border-border bg-muted/60 px-3 py-4 text-sm text-muted-foreground">
                        Đang tải mascot...
                      </div>
                    ) : filteredMascotVideos.length === 0 ? (
                      <div className="rounded-lg border border-border bg-muted/60 px-3 py-4 text-sm text-muted-foreground">
                        Chưa có mascot video.
                      </div>
                    ) : (
                      filteredMascotVideos.map((video) => {
                        const key = video.video_id ?? video.id ?? video.url;
                        const fileName =
                          video.url?.split("/").pop()?.split("?")[0] ||
                          "Mascot";
                        const thumbnailSrc = video.thumbnail || video.url;

                        return (
                          <div
                            key={key}
                            className="rounded-xl border border-border bg-background p-2 hover:border-primary/60"
                          >
                            <div className="flex items-start gap-2">
                              <div className="h-12 w-20 shrink-0 overflow-hidden rounded-md border border-border bg-muted/45">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={thumbnailSrc}
                                  alt={fileName}
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="line-clamp-1 text-sm font-medium">
                                  {fileName}
                                </p>
                                <p className="mt-1 text-[11px] text-muted-foreground">
                                  Dùng để chọn nhanh mascot nguồn
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}

                    {panelBindings ? (
                      <div className="rounded-xl border border-border bg-background p-2">
                        <MascotOptions
                          value={panelBindings.mascot}
                          onChange={panelBindings.onMascotChange}
                          onApply={panelBindings.onMascotApply}
                          isApplying={panelBindings.isApplyingMascot}
                          mascotProgress={panelBindings.mascotProgress}
                          videoFile={panelBindings.videoFile}
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
                  <div className="max-h-[calc(100vh-170px)] overflow-y-auto rounded-xl border border-border bg-background p-3 pr-1">
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
                  <div className="max-h-[calc(100vh-170px)] overflow-y-auto rounded-xl border border-border bg-background p-3 pr-1">
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
