"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Upload, AlertCircle } from "lucide-react";
import type { MascotOption } from "@/features/videoEditor/types";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  validateMascotParams,
  calculateMaxMargins,
} from "@/features/_shared/utils/validation";

interface Props {
  value: MascotOption;
  onChange: (value: MascotOption) => void;
  onApply?: () => void;
  isApplying?: boolean;
  videoFile?: File | null;
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

export default function MascotOptions({
  value,
  onChange,
  onApply,
  isApplying,
  videoFile,
  mascotProgress,
}: Props) {
  const [maxMargins, setMaxMargins] = useState<{
    maxMarginX: number;
    maxMarginY: number;
  } | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Calculate max margins when mascot file or scale changes
  useEffect(() => {
    const calculateMargins = async () => {
      if (!videoFile || value.position === "replace" || value.type === "none") {
        setMaxMargins(null);
        return;
      }

      setIsCalculating(true);
      try {
        let mascotFile: File;

        // Nếu chọn preset thì load ảnh từ public folder
        if (value.type === "preset" && value.presetUrl) {
          const response = await fetch(value.presetUrl);
          const blob = await response.blob();
          mascotFile = new File([blob], `${value.presetId}.png`, {
            type: "image/png",
          });
        }
        // Nếu custom thì dùng file user upload
        else if (value.type === "custom" && value.customFile) {
          mascotFile = value.customFile;
        } else {
          setIsCalculating(false);
          return;
        }

        const margins = await calculateMaxMargins(
          videoFile,
          mascotFile,
          value.scale,
        );
        setMaxMargins(margins);

        // Auto-adjust margins if they exceed limits
        const newMarginX = Math.min(value.margin_x, margins.maxMarginX);
        const newMarginY = Math.min(value.margin_y, margins.maxMarginY);

        if (newMarginX !== value.margin_x || newMarginY !== value.margin_y) {
          onChange({
            ...value,
            margin_x: newMarginX,
            margin_y: newMarginY,
          });
        }
      } catch (error) {
        console.error("Failed to calculate margins:", error);
      } finally {
        setIsCalculating(false);
      }
    };

    calculateMargins();
  }, [
    value.customFile,
    value.presetUrl,
    value.scale,
    videoFile,
    value.position,
    value.type,
    onChange,
  ]);

  // Validate parameters
  useEffect(() => {
    if (value.type === "none") {
      setValidationError(null);
      return;
    }

    if (!maxMargins) {
      setValidationError(null);
      return;
    }

    const validation = validateMascotParams(
      value.position,
      value.margin_x,
      value.margin_y,
      maxMargins.maxMarginX,
      maxMargins.maxMarginY,
    );

    setValidationError(
      validation.isValid ? null : validation.errors[0] || null,
    );
  }, [value, maxMargins]);

  const canApply =
    value.type !== "none" &&
    (value.presetUrl || value.customFile) &&
    !validationError &&
    !isApplying &&
    !isCalculating;

  return (
    <div className="space-y-4">
      {/* Chọn Mascot */}
      <div>
        <label className="block text-sm font-medium mb-2">Chọn Mascot</label>

        {/* Option: Không dùng mascot */}
        <div
          onClick={() =>
            onChange({
              type: "none",
              position: "replace",
              margin_x: 0,
              margin_y: 0,
              scale: 0.5,
            })
          }
          className={`p-3 rounded-lg border-2 cursor-pointer mb-2 transition-colors ${
            value.type === "none"
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/50"
          }`}
        >
          <p className="text-sm font-medium">Không dùng Mascot</p>
          <p className="text-xs text-muted-foreground">Giữ nguyên video gốc</p>
        </div>

        {/* Preset Mascots */}
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
                  onClick={() => {
                    console.log("Selected preset mascot:", mascot);
                    onChange({
                      type: "preset",
                      presetId: mascot.id,
                      presetUrl: mascot.filePath,
                      customFile: undefined,
                      position: "bottom-right",
                      margin_x: 40,
                      margin_y: 40,
                      scale: 1,
                    });
                  }}
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

        {/* Custom Mascot - Chỉ hiện khi KHÔNG chọn preset */}
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
                    ? `${value.customFile.name}`
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
                  console.log("Selected custom file:", file);
                  onChange({
                    type: "custom",
                    customFile: file,
                    presetUrl: undefined, // Clear preset URL
                    presetId: undefined, // Clear preset ID
                    position: "bottom-right",
                    margin_x: 10,
                    margin_y: 10,
                    scale: 0.3,
                  });
                }
              }}
            />
          </label>
        </div>
      </div>

      {/* Position + Parameters (only if mascot selected) */}
      {value.type !== "none" && (
        <>
          {/* Current Selection Info */}
          <div className="bg-linear-to-r from-primary/20 via-primary/10 to-primary/20 border-2 border-primary rounded-lg p-3 shadow-sm">
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
                  Đã chọn Mascot
                </p>
                <p className="text-xs text-foreground">
                  {value.type === "preset" && (
                    <>
                      <strong className="font-bold">
                        {
                          presetMascots.find((m) => m.id === value.presetId)
                            ?.name
                        }
                      </strong>
                      <span className="text-muted-foreground ml-1">
                        (Có sẵn)
                      </span>
                    </>
                  )}
                  {value.type === "custom" && value.customFile && (
                    <>
                      <strong className="font-bold">
                        {value.customFile.name}
                      </strong>
                      <span className="text-muted-foreground ml-1">
                        (Tự tạo)
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Position Selection */}
          <div className="space-y-2 border-t pt-4">
            <Label className="text-sm font-semibold">Vị trí Mascot</Label>

            {/* Replace option */}
            <div
              onClick={() =>
                onChange({
                  ...value,
                  position: "replace",
                  margin_x: 0,
                  margin_y: 0,
                })
              }
              className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                value.position === "replace"
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <p className="text-sm font-medium">Thay thế video</p>
              <p className="text-xs text-muted-foreground">
                Mascot sẽ thay thế toàn bộ video gốc
              </p>
            </div>

            {/* Corner positions */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "top-left", label: "Trên trái" },
                { value: "top-right", label: "Trên phải" },
                { value: "bottom-left", label: "Dưới trái" },
                { value: "bottom-right", label: "Dưới phải" },
              ].map((pos) => (
                <div
                  key={pos.value}
                  onClick={() =>
                    onChange({
                      ...value,
                      position: pos.value as MascotOption["position"],
                    })
                  }
                  className={`p-2 rounded-lg border-2 cursor-pointer transition-colors ${
                    value.position === pos.value
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <p className="text-xs font-medium text-center">{pos.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Margin & Scale controls (only for corner positions) */}
          {value.position !== "replace" && (
            <>
              {/* Scale Slider */}
              <div className="space-y-2 border-t pt-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">
                    Kích thước (Scale)
                  </Label>
                  <Badge variant="secondary" className="text-xs font-mono">
                    {value.scale.toFixed(1)}x
                  </Badge>
                </div>
                <Slider
                  value={[value.scale * 10]}
                  onValueChange={([val]) =>
                    onChange({ ...value, scale: val / 10 })
                  }
                  min={1}
                  max={20}
                  step={1}
                  disabled={isApplying}
                />
                <p className="text-[10px] text-muted-foreground text-center">
                  0.1x (nhỏ nhất) ← → 2.0x (lớn nhất)
                </p>
              </div>

              {/* Calculating margins indicator */}
              {isCalculating && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Đang tính toán giới hạn lề...
                  </AlertDescription>
                </Alert>
              )}

              {/* Margin X Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">
                    Lề ngang (Margin X)
                  </Label>
                  <Badge variant="secondary" className="text-xs font-mono">
                    {value.margin_x}px
                    {maxMargins && ` / ${Math.round(maxMargins.maxMarginX)}px`}
                  </Badge>
                </div>
                <Slider
                  value={[value.margin_x]}
                  onValueChange={([margin_x]) =>
                    onChange({ ...value, margin_x })
                  }
                  min={0}
                  max={maxMargins?.maxMarginX || 500}
                  step={5}
                  disabled={isApplying || isCalculating}
                />
              </div>

              {/* Margin Y Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">
                    Lề dọc (Margin Y)
                  </Label>
                  <Badge variant="secondary" className="text-xs font-mono">
                    {value.margin_y}px
                    {maxMargins && ` / ${Math.round(maxMargins.maxMarginY)}px`}
                  </Badge>
                </div>
                <Slider
                  value={[value.margin_y]}
                  onValueChange={([margin_y]) =>
                    onChange({ ...value, margin_y })
                  }
                  min={0}
                  max={maxMargins?.maxMarginY || 500}
                  step={5}
                  disabled={isApplying || isCalculating}
                />
              </div>

              {/* Visual hint */}
              <div className="bg-muted/50 rounded-lg p-3 border">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Lề được tính từ góc{" "}
                    <span className="font-semibold text-foreground">
                      {value.position === "top-left"
                        ? "trên trái"
                        : value.position === "top-right"
                          ? "trên phải"
                          : value.position === "bottom-left"
                            ? "dưới trái"
                            : "dưới phải"}
                    </span>{" "}
                    của ảnh mascot
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Validation Error */}
          {validationError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                {validationError}
              </AlertDescription>
            </Alert>
          )}

          {/* Apply Button */}
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
              ) : isCalculating ? (
                "Đang tính toán..."
              ) : (
                "Áp dụng Mascot"
              )}
            </Button>

            {!canApply && !isApplying && !isCalculating && (
              <p className="text-xs text-destructive mt-2 text-center">
                {!value.customFile && !value.presetUrl
                  ? "Vui lòng chọn mascot trước"
                  : validationError || "Đang kiểm tra..."}
              </p>
            )}
          </div>

          {/* Progress Display - Show below button */}
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
