"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useQueryClient } from "@tanstack/react-query";
import {
  Check,
  ChevronDown,
  Eraser,
  ImagePlus,
  Loader,
  Search,
  Upload,
} from "lucide-react";
import { useUploadMascotImage } from "@/features/editor/api/mascot-image.hooks";
import { imageApi } from "@/features/image/api/image.api";
import type { MascotImage, MascotOption } from "@/features/editor/types";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function normalizeAssetUrl(value?: string) {
  if (!value) return "";
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
    const fallbackOrigin =
      typeof window !== "undefined" ? window.location.origin : undefined;
    return new URL(value, siteUrl || fallbackOrigin).toString();
  } catch {
    return value;
  }
}

interface Props {
  value: MascotOption;
  onChange: (value: MascotOption) => void;
  onApply?: () => void;
  onCreateVideo?: () => void;
  isApplying?: boolean;
  isCreatingVideo?: boolean;
  hasVideo?: boolean;
  mascotProgress?: string;
  onMascotImageIdChange?: (imageId: number | null) => void;
  mascotImages?: MascotImage[];
  mascotImagesLoading?: boolean;
  selectedMascotImageId?: number | null;
  onSelectMascotImage?: (image: { image_id?: number; url: string }) => void;
}

const presetMascots = [
  {
    id: "cat",
    name: "Mèo",
    thumbnail: "/mascots/cat.jpg",
    filePath: "/mascots/cat.jpg",
    animationMode: "animal",
  },
  {
    id: "dog",
    name: "Chó",
    thumbnail: "/mascots/dog.jpg",
    filePath: "/mascots/dog.jpg",
    animationMode: "animal",
  },
  {
    id: "bear",
    name: "Gấu",
    thumbnail: "/mascots/bear.jpg",
    filePath: "/mascots/bear.jpg",
    animationMode: "animal",
  },
  {
    id: "rabbit",
    name: "Thỏ",
    thumbnail: "/mascots/rabbit.jpg",
    filePath: "/mascots/rabbit.jpg",
    animationMode: "animal",
  },
  {
    id: "person",
    name: "Người",
    thumbnail: "/mascots/person.jpg",
    filePath: "/mascots/person.jpg",
    animationMode: "human",
  },
] as const;

const backgroundQualityOptions = [
  { value: "fast", label: "Tạo nhanh" },
  { value: "clean", label: "Viền sạch hơn" },
] as const;

function withMascotDefaults(value: Partial<MascotOption>): MascotOption {
  return {
    type: "none",
    position: "bottom-right",
    margin_x: 40,
    margin_y: 40,
    scale: 1,
    removeBackground: false,
    bgMode: "green_screen",
    bgQualityMode: "fast",
    greenScreenColor: "00FF00",
    chromakeySimilarity: 0.2,
    chromakeyBlend: 0.08,
    alphaContractPx: 1,
    alphaBlurPx: 1,
    animationMode: "human",
    qualityMode: "ultrafast",
    drivingMultiplier: 1,
    flagStitching: true,
    flagPasteback: true,
    flagNormalizeLip: true,
    flagRelativeMotion: true,
    flagDoCrop: true,
    cropScale: 2.3,
    vxRatio: 0,
    vyRatio: -0.125,
    ...value,
  } as MascotOption;
}

export default function MascotOptions({
  value,
  onChange,
  isApplying,
  hasVideo = false,
  mascotProgress,
  onMascotImageIdChange,
  mascotImages = [],
  mascotImagesLoading = false,
  selectedMascotImageId,
  onSelectMascotImage,
}: Props) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isBackgroundOpen, setIsBackgroundOpen] = useState(false);
  const [imageSearch, setImageSearch] = useState("");
  const cloudUploadRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { mutateAsync: uploadMascotImage, isPending: isUploadingMascot } =
    useUploadMascotImage(
      (progress: number) => setUploadProgress(progress),
      ({ imageId }: { imageId: number }) => {
        onMascotImageIdChange?.(imageId);
      },
    );

  const selectedMascotName =
    value.type === "preset"
      ? presetMascots.find((mascot) => mascot.id === value.presetId)?.name
      : value.type === "custom"
        ? "Mascot của bạn"
        : undefined;

  const updateMascot = (patch: Partial<MascotOption>) => {
    onChange(withMascotDefaults({ ...value, ...patch }));
  };

  const filteredMascotImages = mascotImages.filter((image) => {
    const keyword = imageSearch.trim().toLowerCase();
    if (!keyword) return true;
    const fileName = image.url?.split("/").pop()?.split("?")[0] || "";
    return fileName.toLowerCase().includes(keyword);
  });

  const handleSetNoMascot = () => {
    onMascotImageIdChange?.(null);
    onChange(
      withMascotDefaults({
        type: "none",
        position: "replace",
        imageId: undefined,
        margin_x: 0,
        margin_y: 0,
        scale: 1,
        previewPlacement: undefined,
      }),
    );
  };

  const ensurePresetMascotImageId = async (url: string) => {
    const absoluteUrl = normalizeAssetUrl(url);
    const normalizeComparableUrl = (value?: string) => {
      if (!value) return "";
      try {
        const parsed = new URL(value, window.location.origin);
        return `${parsed.origin}${parsed.pathname}`;
      } catch {
        return value;
      }
    };

    const existing = await imageApi.getAllByUser();
    const matched = existing.find(
      (image) =>
        normalizeComparableUrl(image.url) === normalizeComparableUrl(absoluteUrl),
    );
    if (matched?.id) return matched.id;

    const created = await imageApi.create({ url: absoluteUrl });
    void queryClient.invalidateQueries({ queryKey: ["image"] });
    return created.id;
  };

  const setPresetMascot = (mascot: (typeof presetMascots)[number]) => {
    onMascotImageIdChange?.(null);
    const presetUrl = normalizeAssetUrl(mascot.filePath);
    onChange(
      withMascotDefaults({
        type: "preset",
        presetId: mascot.id,
        presetUrl,
        imageId: undefined,
        customFile: undefined,
        animationMode: mascot.animationMode,
        position: "bottom-right",
        margin_x: 40,
        margin_y: 40,
        scale: 1,
        previewPlacement: undefined,
      }),
    );

    void ensurePresetMascotImageId(mascot.filePath)
      .then((imageId) => {
        onMascotImageIdChange?.(imageId);
      })
      .catch((error) => {
        console.error("[MascotOptions] Failed to persist preset mascot:", error);
      });
  };

  const setPersonalMascot = (image: MascotImage) => {
    onSelectMascotImage?.(image);
    onChange(
      withMascotDefaults({
        ...value,
        type: "custom",
        customFile: undefined,
        imageId: image.image_id,
        presetUrl: image.url,
        presetId: undefined,
        animationMode: "human",
        position: value.position === "replace" ? "bottom-right" : value.position,
        margin_x: value.margin_x || 40,
        margin_y: value.margin_y || 40,
        scale: value.scale || 1,
        previewPlacement: value.previewPlacement,
      }),
    );
  };

  const handleCustomMascotUpload = async (file: File) => {
    onChange(
      withMascotDefaults({
        ...value,
        type: "custom",
        customFile: file,
        imageId: undefined,
        presetUrl: undefined,
        presetId: undefined,
        animationMode: "human",
        position: "bottom-right",
      }),
    );

    try {
      const uploaded = await uploadMascotImage({ file });

      onChange(
        withMascotDefaults({
          ...value,
          type: "custom",
          customFile: undefined,
          imageId: uploaded.imageId,
          presetUrl: uploaded.url,
          presetId: undefined,
          animationMode: "human",
          position: "bottom-right",
        }),
      );
    } catch {
      // Mutation hook already shows an error toast.
    }
  };

  return (
    <div className="min-w-0 space-y-3 overflow-x-hidden">
      <section className="space-y-2.5">
        <button
          type="button"
          onClick={handleSetNoMascot}
          className={cn(
            "w-full rounded-xl border p-2.5 text-left transition hover:border-primary/60",
            value.type === "none"
              ? "border-primary bg-primary/10"
              : "border-border bg-background",
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Không dùng mascot</p>
              <p className="text-xs text-muted-foreground">
                Giữ nguyên video gốc.
              </p>
            </div>
            {value.type === "none" ? <Check className="h-4 w-4 text-primary" /> : null}
          </div>
        </button>

        <div
          className={cn(
            "rounded-xl border bg-background p-2.5 transition",
            value.type === "custom"
              ? "border-primary/60 bg-primary/[0.04]"
              : "border-border",
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold">Mascot của bạn</p>
              <p className="text-xs text-muted-foreground">
                Chọn ảnh đã lưu hoặc thêm ảnh từ máy.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              className="h-9 shrink-0 gap-2"
              disabled={isUploadingMascot}
              onClick={() => cloudUploadRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              {isUploadingMascot ? "Đang tải" : "Từ máy"}
            </Button>
          </div>

          <input
            ref={cloudUploadRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            className="hidden"
            disabled={isUploadingMascot}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleCustomMascotUpload(file);
              event.currentTarget.value = "";
            }}
          />

          {isUploadingMascot ? (
            <div className="mt-3 overflow-hidden rounded-full bg-muted">
              <div
                className="h-1.5 rounded-full bg-primary transition-all"
                style={{ width: `${Math.max(0, Math.min(uploadProgress, 100))}%` }}
              />
            </div>
          ) : null}

          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={imageSearch}
              onChange={(event) => setImageSearch(event.target.value)}
              placeholder="Tìm ảnh mascot..."
              className="h-9 rounded-xl pl-9"
            />
          </div>

          <div className="mt-3">
            {mascotImagesLoading ? (
              <div className="rounded-xl border border-border bg-muted/50 px-3 py-4 text-sm text-muted-foreground">
                Đang tải ảnh mascot...
              </div>
            ) : filteredMascotImages.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {filteredMascotImages.map((image) => {
                  const selected =
                    value.type === "custom" &&
                    ((typeof image.image_id === "number" &&
                      image.image_id === selectedMascotImageId) ||
                      image.url === value.presetUrl);

                  return (
                    <button
                      key={image.image_id ?? image.url}
                      type="button"
                      onClick={() => setPersonalMascot(image)}
                      className={cn(
                        "relative aspect-square min-w-0 overflow-hidden rounded-lg border bg-muted/40 transition hover:border-primary/60",
                        selected &&
                          "border-primary bg-primary/10 ring-2 ring-primary/20",
                      )}
                      title="Chọn mascot"
                    >
                      <span className="absolute inset-0 grid place-items-center text-muted-foreground">
                        <ImagePlus className="h-5 w-5" />
                      </span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image.url}
                        alt="Ảnh mascot"
                        className="relative h-full w-full object-contain p-1"
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.style.opacity = "0";
                        }}
                      />
                      {selected ? (
                        <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground">
                          <Check className="h-3 w-3" />
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-muted/30 px-3 py-5 text-center">
                <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
                  <ImagePlus className="h-5 w-5" />
                </div>
                <p className="mt-3 text-sm font-medium">
                  {imageSearch.trim()
                    ? "Không tìm thấy ảnh phù hợp"
                    : "Chưa có mascot cá nhân"}
                </p>
                <p className="mx-auto mt-1 max-w-[14rem] text-xs leading-5 text-muted-foreground">
                  {imageSearch.trim()
                    ? "Thử từ khóa khác hoặc thêm ảnh mới từ máy."
                    : "Thêm ảnh riêng để dùng lại trong các project sau."}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold">Mascot mẫu</Label>
        <div className="grid grid-cols-5 gap-1.5">
          {presetMascots.map((mascot) => {
            const selected =
              value.type === "preset" && value.presetId === mascot.id;
            return (
              <button
                key={mascot.id}
                type="button"
                onClick={() => setPresetMascot(mascot)}
                className={cn(
                  "min-w-0 rounded-lg border bg-background p-1 transition hover:border-primary/60",
                  selected && "border-primary bg-primary/10 ring-2 ring-primary/20",
                )}
              >
                <div className="relative mb-1 aspect-square overflow-hidden rounded-md bg-muted">
                  <Image
                    src={mascot.thumbnail}
                    alt={mascot.name}
                    fill
                    sizes="(max-width: 768px) 20vw, 80px"
                    className="object-contain p-1"
                  />
                </div>
                <p className="truncate text-center text-[10px] font-medium">
                  {mascot.name}
                </p>
              </button>
            );
          })}
        </div>
        </div>
      </section>

      {value.type !== "none" ? (
        <>
          <section className="rounded-xl border border-primary/40 bg-primary/10 p-2.5">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                <Check className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-primary">
                  Mascot đã sẵn sàng
                </p>
                <p className="truncate text-xs text-foreground">
                  {selectedMascotName}
                  <span className="ml-1 text-muted-foreground">
                    {value.type === "preset" ? "(có sẵn)" : "(tự tải lên)"}
                  </span>
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3 rounded-xl border border-border bg-background/70 p-2.5">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Kích thước</Label>
              <span className="font-mono text-xs text-muted-foreground">
                {value.scale.toFixed(2)}x
              </span>
            </div>
            <Slider
              value={[value.scale * 100]}
              onValueChange={([nextValue]) =>
                updateMascot({ scale: nextValue / 100 })
              }
              min={10}
              max={200}
              step={5}
              disabled={isApplying || !hasVideo}
              aria-label="Kích thước Mascot"
            />
            <p className="text-xs text-muted-foreground">
              Kéo mascot trên video hoặc dùng thanh trượt này.
            </p>
          </section>

          <Collapsible
            open={isBackgroundOpen}
            onOpenChange={setIsBackgroundOpen}
          >
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="hidden"
              >
                <span className="inline-flex items-center gap-2">
                  <Eraser className="h-4 w-4" />
                  Tách nền
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition",
                    isBackgroundOpen && "rotate-180",
                  )}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-3 rounded-xl border border-border bg-background/70 p-2.5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Label className="text-sm font-medium">Xóa nền mascot</Label>
                  <p className="text-xs text-muted-foreground">
                    Bật nếu ảnh mascot chưa có nền trong suốt.
                  </p>
                </div>
                <Switch
                  checked={Boolean(value.removeBackground)}
                  onCheckedChange={(checked) =>
                    updateMascot({
                      removeBackground: checked,
                      bgMode: "green_screen",
                    })
                  }
                />
              </div>
              {value.removeBackground ? (
                <div className="grid gap-3">
                  <SelectField
                    label="Ưu tiên tách nền"
                    value={value.bgQualityMode ?? "fast"}
                    onChange={(nextValue) =>
                      updateMascot({
                        bgQualityMode:
                          nextValue as MascotOption["bgQualityMode"],
                      })
                    }
                    options={backgroundQualityOptions}
                  />
                </div>
              ) : null}

            </CollapsibleContent>
          </Collapsible>


          {mascotProgress ? (
            <section className="rounded-xl border bg-muted/50 p-2.5 text-xs leading-relaxed text-muted-foreground">
              {mascotProgress}
            </section>
          ) : null}

        </>
      ) : null}
    </div>
  );
}

interface MascotRenderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: MascotOption;
  onChange: (value: MascotOption) => void;
  onCreateVideo?: () => void | Promise<void>;
  canCreateVideo: boolean;
  isCreatingVideo?: boolean;
}

export function MascotRenderDialog({
  open,
  onOpenChange,
  value,
  onChange,
  onCreateVideo,
  canCreateVideo,
  isCreatingVideo = false,
}: MascotRenderDialogProps) {
  const updateMascot = (patch: Partial<MascotOption>) => {
    onChange(withMascotDefaults({ ...value, ...patch }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Tùy chỉnh mascot</DialogTitle>
          <DialogDescription>
            Chọn cách xử lý nền trước khi tạo video hoàn chỉnh.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <section className="space-y-3 rounded-xl border border-border bg-background/70 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <Label className="inline-flex items-center gap-2 text-sm font-semibold">
                  <Eraser className="h-4 w-4" />
                  Xóa nền mascot
                </Label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Bật nếu ảnh mascot chưa có nền trong suốt.
                </p>
              </div>
              <Switch
                checked={Boolean(value.removeBackground)}
                onCheckedChange={(checked) =>
                  updateMascot({
                    removeBackground: checked,
                    bgMode: "green_screen",
                  })
                }
              />
            </div>
            {value.removeBackground ? (
              <div className="grid gap-3">
                <SelectField
                  label="Ưu tiên tách nền"
                  value={value.bgQualityMode ?? "fast"}
                  onChange={(nextValue) =>
                    updateMascot({
                      bgQualityMode:
                        nextValue as MascotOption["bgQualityMode"],
                    })
                  }
                  options={backgroundQualityOptions}
                />
              </div>
            ) : null}
          </section>

        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCreatingVideo}
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={() => {
              void onCreateVideo?.();
            }}
            disabled={!canCreateVideo || isCreatingVideo}
            className="gap-2"
          >
            {isCreatingVideo ? (
              <Loader size={16} className="animate-spin" />
            ) : null}
            {isCreatingVideo ? "Đang tạo..." : "Tạo video"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly { value: string; label: string }[];
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-10 rounded-xl">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}


