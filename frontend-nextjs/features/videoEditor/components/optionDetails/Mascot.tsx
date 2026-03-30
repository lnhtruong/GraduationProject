"use client";

import Image from "next/image";
import { Upload, Move, Maximize2 } from "lucide-react";
import type { MascotOption } from "@/features/videoEditor/types";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Props {
  value: MascotOption;
  onChange: (value: MascotOption) => void;
  onApply?: () => void;
  isApplying?: boolean;
  hasVideo?: boolean;
  mascotProgress?: string;
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

function shortenMiddle(text: string, head = 12, tail = 10) {
  if (!text) return text;
  if (text.length <= head + tail + 3) return text;
  return `${text.slice(0, head)}...${text.slice(-tail)}`;
}

export default function MascotOptions({
  value,
  onChange,
  onApply,
  isApplying,
  hasVideo = false,
  mascotProgress,
}: Props) {
  const selectedMascotName =
    value.type === "preset"
      ? presetMascots.find((m) => m.id === value.presetId)?.name
      : value.type === "custom"
        ? shortenMiddle(value.customFile?.name || "")
        : undefined;

  const hasSelectedMascot =
    value.type !== "none" && Boolean(value.presetUrl || value.customFile);
  const hasPlacedMascot =
    value.position === "replace" || Boolean(value.previewPlacement?.hasPlaced);
  const hasValidScale = value.scale >= 0.1 && value.scale <= 2;

  const canApply =
    hasSelectedMascot &&
    hasVideo &&
    hasPlacedMascot &&
    hasValidScale &&
    !isApplying;

  const setNoMascot = () =>
    onChange({
      type: "none",
      position: "replace",
      margin_x: 0,
      margin_y: 0,
      scale: 1,
      previewPlacement: undefined,
    });

  const setPresetMascot = (mascot: (typeof presetMascots)[number]) => {
    onChange({
      type: "preset",
      presetId: mascot.id,
      presetUrl: mascot.filePath,
      customFile: undefined,
      position: "bottom-right",
      margin_x: 40,
      margin_y: 40,
      scale: 1,
      previewPlacement: undefined,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Chọn Mascot</label>

        <div
          onClick={setNoMascot}
          className={`p-3 rounded-lg border-2 cursor-pointer mb-2 transition-colors ${
            value.type === "none"
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/50"
          }`}
        >
          <p className="text-sm font-medium">Không dùng Mascot</p>
          <p className="text-xs text-muted-foreground">Giữ nguyên video gốc</p>
        </div>

        <div className="mb-2">
          <details className="group" open={value.type === "preset"}>
            <summary className="p-3 rounded-lg border-2 border-border hover:border-primary/50 cursor-pointer list-none transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Mascot có sẵn</p>
                  <p className="text-xs text-muted-foreground">
                    {value.type === "preset"
                      ? `${
                          presetMascots.find((m) => m.id === value.presetId)
                            ?.name
                        }`
                      : "Chọn mascot từ thư viện"}
                  </p>
                </div>
                <svg
                  className="w-4 h-4 transition-transform group-open:rotate-180"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </summary>

            <div className="grid grid-cols-4 gap-1.5 mt-2 px-1">
              {presetMascots.map((mascot) => (
                <div
                  key={mascot.id}
                  onClick={() => setPresetMascot(mascot)}
                  className={`p-1.5 rounded-md border cursor-pointer transition-all hover:scale-105 ${
                    value.type === "preset" && value.presetId === mascot.id
                      ? "border-primary bg-primary/10 ring-2 ring-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="aspect-square bg-muted rounded-sm mb-1 flex items-center justify-center overflow-hidden relative">
                    <Image
                      src={mascot.thumbnail}
                      alt={mascot.name}
                      fill
                      sizes="(max-width: 768px) 25vw, 10vw"
                      className="object-contain p-1"
                    />
                  </div>
                  <p className="text-[10px] text-center font-medium leading-tight truncate">
                    {mascot.name}
                  </p>
                </div>
              ))}
            </div>
          </details>
        </div>

        <div
          className={`p-3 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
            value.type === "custom"
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/50"
          }`}
        >
          <label className="cursor-pointer block">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Mascot tự tạo</p>
                <p className="text-xs text-muted-foreground truncate">
                  {value.type === "custom" && value.customFile
                    ? shortenMiddle(value.customFile.name)
                    : "Tải lên file hình ảnh (.png, .jpg)"}
                </p>
              </div>
            </div>
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onChange({
                    type: "custom",
                    customFile: file,
                    presetUrl: undefined,
                    presetId: undefined,
                    position: "bottom-right",
                    margin_x: 40,
                    margin_y: 40,
                    scale: 1,
                    previewPlacement: undefined,
                  });
                }
              }}
            />
          </label>
        </div>
      </div>

      {value.type !== "none" && (
        <>
          <div className="bg-linear-to-r from-primary/20 via-primary/10 to-primary/20 border-2 border-primary rounded-lg p-3">
            <div className="flex items-center gap-2">
              <div className="shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-primary-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-primary mb-0.5">
                  Mascot đã sẵn sàng
                </p>
                <p className="text-xs text-foreground min-w-0">
                  <strong className="font-bold inline-block max-w-full truncate align-bottom">
                    {selectedMascotName}
                  </strong>
                  <span className="ml-1 text-muted-foreground">
                    {value.type === "preset" ? "(Có sẵn)" : "(Tự tải lên)"}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <Alert>
            <Move className="h-4 w-4" />
            <AlertDescription className="text-xs leading-relaxed">
              {hasVideo
                ? "Kéo mascot trực tiếp trên khung video để chọn vị trí mong muốn."
                : "Chọn hoặc kéo thả video vào preview trước, sau đó mới kéo mascot lên video được."}
            </AlertDescription>
          </Alert>

          <div className="space-y-2 border-t pt-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Kích thước mascot</p>
              <Badge variant="secondary" className="text-xs font-mono">
                {value.scale.toFixed(2)}x
              </Badge>
            </div>
            <Slider
              value={[value.scale * 100]}
              onValueChange={([nextValue]) => {
                onChange({
                  ...value,
                  scale: nextValue / 100,
                });
              }}
              min={10}
              max={200}
              step={5}
              disabled={isApplying || !hasVideo}
            />
            <p className="text-[10px] text-muted-foreground text-center">
              0.10x đến 2.00x
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg border p-3">
            <div className="flex items-start gap-2">
              <Maximize2 className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div className="text-xs text-muted-foreground leading-relaxed">
                <p>
                  Trạng thái kéo thả: {hasPlacedMascot ? "Đã đặt" : "Chưa đặt"}
                </p>
                <p>
                  Scale hiện tại: <span className="font-semibold">{value.scale.toFixed(2)}x</span>
                </p>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <Button
              onClick={onApply}
              disabled={!canApply}
              className="w-full"
              size="lg"
            >
              {isApplying ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Đang áp dụng...
                </>
              ) : (
                "Áp dụng Mascot"
              )}
            </Button>

            {!canApply && !isApplying && (
              <p className="text-xs text-destructive mt-2 text-center">
                {!hasSelectedMascot
                  ? "Vui lòng chọn mascot trước"
                  : !hasVideo
                    ? "Vui lòng chọn video trước khi kéo mascot"
                    : !hasPlacedMascot
                      ? "Hãy kéo mascot lên video trước khi áp dụng"
                      : !hasValidScale
                        ? "Scale phải nằm trong khoảng 0.1 - 2.0"
                        : "Dữ liệu mascot chưa sẵn sàng"}
              </p>
            )}
          </div>

          {isApplying && mascotProgress && (
            <Alert className="animate-pulse">
              <div className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <AlertDescription className="text-xs font-medium">
                  {mascotProgress}
                </AlertDescription>
              </div>
            </Alert>
          )}
        </>
      )}
    </div>
  );
}
