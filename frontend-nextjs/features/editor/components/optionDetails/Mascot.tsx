"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import {
  Check,
  ChevronDown,
  ImagePlus,
  Maximize2,
  Move,
  Settings2,
  Sparkles,
  Upload,
  Loader,
} from "lucide-react";
import { useUploadMascotImage } from "@/features/editor/api/mascot-image.hooks";
import type { MascotOption } from "@/features/editor/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
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
import { cn } from "@/lib/utils";

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
}

const presetMascots = [
  {
    id: "cat",
    name: "Mèo",
    thumbnail: "/mascots/cat.jpg",
    filePath: "/mascots/cat.jpg",
  },
  {
    id: "dog",
    name: "Chó",
    thumbnail: "/mascots/dog.jpg",
    filePath: "/mascots/dog.jpg",
  },
  {
    id: "bear",
    name: "Gấu",
    thumbnail: "/mascots/bear.jpg",
    filePath: "/mascots/bear.jpg",
  },
  {
    id: "rabbit",
    name: "Thỏ",
    thumbnail: "/mascots/rabbit.jpg",
    filePath: "/mascots/rabbit.jpg",
  },
  {
    id: "person",
    name: "Người",
    thumbnail: "/mascots/person.jpg",
    filePath: "/mascots/person.jpg",
  },
];

const renderQualityOptions = [
  { value: "ultrafast", label: "Rất nhanh" },
  { value: "fast", label: "Nhanh" },
  { value: "balanced", label: "Cân bằng" },
  { value: "quality", label: "Chất lượng cao" },
] as const;

const backgroundQualityOptions = [
  { value: "fast", label: "Nhanh" },
  { value: "balanced", label: "Cân bằng" },
  { value: "quality", label: "Sắc nét" },
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
  onCreateVideo,
  isApplying,
  isCreatingVideo,
  hasVideo = false,
  mascotProgress,
  onMascotImageIdChange,
}: Props) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isBackgroundOpen, setIsBackgroundOpen] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const cloudUploadRef = useRef<HTMLInputElement>(null);
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

  const hasSelectedMascot =
    value.type !== "none" && Boolean(value.presetUrl || value.customFile);
  const hasValidScale = value.scale >= 0.1 && value.scale <= 2;
  const canCreateVideo =
    hasSelectedMascot &&
    hasVideo &&
    hasValidScale &&
    !isApplying &&
    !isUploadingMascot &&
    !isCreatingVideo &&
    typeof onCreateVideo === "function";

  const updateMascot = (patch: Partial<MascotOption>) => {
    onChange(withMascotDefaults({ ...value, ...patch }));
  };

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

  const setPresetMascot = (mascot: (typeof presetMascots)[number]) => {
    onMascotImageIdChange?.(null);
    onChange(
      withMascotDefaults({
        type: "preset",
        presetId: mascot.id,
        presetUrl: mascot.filePath,
        imageId: undefined,
        customFile: undefined,
        position: "bottom-right",
        margin_x: 40,
        margin_y: 40,
        scale: 1,
        previewPlacement: undefined,
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
          position: "bottom-right",
        }),
      );
    } catch {
      // Mutation hook already shows an error toast.
    }
  };

  return (
    <div className="min-w-0 space-y-4 overflow-x-hidden">
      <section className="space-y-3">
        <div>
          <Label className="text-sm font-semibold">Mascot</Label>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Chọn ảnh, đặt lên video rồi tạo bản hoàn chỉnh.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSetNoMascot}
          className={cn(
            "w-full rounded-xl border p-3 text-left transition hover:border-primary/60",
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

        <div className="grid grid-cols-3 gap-2">
          {presetMascots.map((mascot) => {
            const selected =
              value.type === "preset" && value.presetId === mascot.id;
            return (
              <button
                key={mascot.id}
                type="button"
                onClick={() => setPresetMascot(mascot)}
                className={cn(
                  "min-w-0 rounded-xl border bg-background p-1.5 transition hover:border-primary/60",
                  selected && "border-primary bg-primary/10 ring-2 ring-primary/20",
                )}
              >
                <div className="relative mb-1 aspect-square overflow-hidden rounded-lg bg-muted">
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

        <div
          className={cn(
            "rounded-xl border border-dashed bg-background p-3 transition",
            value.type === "custom"
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/60",
          )}
        >
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <ImagePlus className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Tải mascot của bạn</p>
              <p className="truncate text-xs text-muted-foreground">
                PNG/JPG, ưu tiên ảnh nền trong suốt.
              </p>
            </div>
          </div>

          <div className="mt-3 rounded-lg border border-border bg-muted/35 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <Label className="text-sm font-medium">Xóa nền ảnh mascot</Label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Bật nếu ảnh có nền xanh, nền trắng hoặc cần tách nền trước khi ghép.
                </p>
              </div>
              <Switch
                checked={Boolean(value.removeBackground)}
                onCheckedChange={(checked) =>
                  updateMascot({
                    removeBackground: checked,
                    bgMode: checked ? (value.bgMode ?? "green_screen") : value.bgMode,
                    bgQualityMode: checked
                      ? (value.bgQualityMode ?? "fast")
                      : value.bgQualityMode,
                  })
                }
                aria-label="Xóa nền ảnh mascot"
              />
            </div>
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
            }}
          />

          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-3 h-10 w-full gap-2"
            disabled={isUploadingMascot}
            onClick={() => cloudUploadRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            {isUploadingMascot ? "Đang tải ảnh..." : "Chọn ảnh"}
          </Button>

          {isUploadingMascot ? (
            <p className="mt-2 text-[11px] text-muted-foreground">
              Đang tải ảnh: {uploadProgress}%
            </p>
          ) : null}
        </div>
      </section>

      {value.type !== "none" ? (
        <>
          <section className="rounded-xl border border-primary/40 bg-primary/10 p-3">
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

          <Alert className="rounded-xl">
            <Move className="h-4 w-4" />
            <AlertDescription className="text-xs leading-relaxed">
              {hasVideo
                ? "Kéo mascot trực tiếp trên video để đặt vị trí. Kéo nút ở góc mascot để đổi kích thước."
                : "Chọn video trước, sau đó đặt mascot lên khung preview."}
            </AlertDescription>
          </Alert>

          <section className="space-y-3 rounded-xl border border-border bg-background/70 p-3">
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
              Có thể chỉnh nhanh bằng thanh này hoặc kéo trực tiếp trên preview.
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
                className="h-11 w-full justify-between rounded-xl"
              >
                <span className="inline-flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
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
            <CollapsibleContent className="mt-3 space-y-4 rounded-xl border border-border bg-background/70 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Label className="text-sm font-medium">Xóa nền mascot</Label>
                  <p className="text-xs text-muted-foreground">
                    Bật khi ảnh mascot có nền xanh hoặc nền cần tách.
                  </p>
                </div>
                <Switch
                  checked={Boolean(value.removeBackground)}
                  onCheckedChange={(checked) =>
                    updateMascot({ removeBackground: checked })
                  }
                />
              </div>

              {value.removeBackground ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <SelectField
                      label="Kiểu xử lý"
                      value={value.bgMode ?? "green_screen"}
                      onChange={(nextValue) =>
                        updateMascot({
                          bgMode: nextValue as MascotOption["bgMode"],
                        })
                      }
                      options={[
                        { value: "green_screen", label: "Green screen" },
                        { value: "transparent", label: "Nền trong suốt" },
                      ]}
                    />
                    <SelectField
                      label="Chất lượng tách nền"
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

                  <div className="space-y-2">
                    <Label htmlFor="green-screen-color" className="text-xs">
                      Màu nền cần tách
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={`#${value.greenScreenColor ?? "00FF00"}`}
                        onChange={(event) =>
                          updateMascot({
                            greenScreenColor: event.target.value.replace(
                              "#",
                              "",
                            ),
                          })
                        }
                        className="h-10 w-14 rounded-xl p-1"
                      />
                      <Input
                        id="green-screen-color"
                        value={value.greenScreenColor ?? "00FF00"}
                        onChange={(event) =>
                          updateMascot({
                            greenScreenColor: event.target.value.replace(
                              "#",
                              "",
                            ),
                          })
                        }
                        placeholder="00FF00"
                        className="h-10 rounded-xl font-mono"
                      />
                    </div>
                  </div>
                </>
              ) : null}
            </CollapsibleContent>
          </Collapsible>

          <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full justify-between rounded-xl"
              >
                <span className="inline-flex items-center gap-2">
                  <Settings2 className="h-4 w-4" />
                  Render nâng cao
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition",
                    isAdvancedOpen && "rotate-180",
                  )}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 space-y-4 rounded-xl border border-border bg-background/70 p-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <SelectField
                  label="Chất lượng render"
                  value={value.qualityMode ?? "ultrafast"}
                  onChange={(nextValue) =>
                    updateMascot({
                      qualityMode: nextValue as MascotOption["qualityMode"],
                    })
                  }
                  options={renderQualityOptions}
                />
                <SelectField
                  label="Chuyển động"
                  value={value.animationMode ?? "human"}
                  onChange={(nextValue) =>
                    updateMascot({
                      animationMode:
                        nextValue as MascotOption["animationMode"],
                    })
                  }
                  options={[
                    { value: "human", label: "Tự nhiên" },
                    { value: "default", label: "Mặc định" },
                  ]}
                />
              </div>

              <RangeSetting
                label="Biên độ chuyển động"
                value={value.drivingMultiplier ?? 1}
                min={0.5}
                max={2}
                step={0.1}
                suffix="x"
                onChange={(drivingMultiplier) =>
                  updateMascot({ drivingMultiplier })
                }
              />
            </CollapsibleContent>
          </Collapsible>

          <section className="rounded-xl border bg-muted/50 p-3">
            <div className="flex items-start gap-2">
              <Maximize2 className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div className="text-xs leading-relaxed text-muted-foreground">
                <p>
                  Kích thước hiện tại:{" "}
                  <span className="font-semibold">{value.scale.toFixed(2)}x</span>
                </p>
                {mascotProgress ? <p>Tiến trình: {mascotProgress}</p> : null}
              </div>
            </div>
          </section>

          <section className="sticky bottom-0 z-10 border-t bg-card/95 pt-3 backdrop-blur">
            <Button
              onClick={onCreateVideo}
              disabled={!canCreateVideo || isCreatingVideo}
              className="h-12 w-full rounded-xl font-semibold gap-2"
              size="lg"
              variant="secondary"
            >
              {isCreatingVideo && <Loader size={16} className="animate-spin" />}
              {isCreatingVideo
                ? "Đang tạo video với mascot..."
                : "Tạo video với mascot"}
            </Button>
          </section>
        </>
      ) : null}
    </div>
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

function RangeSetting({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <span className="font-mono text-xs text-muted-foreground">
          {value.toFixed(1)}
          {suffix}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([next]) => onChange(next)}
        aria-label={label}
      />
    </div>
  );
}
