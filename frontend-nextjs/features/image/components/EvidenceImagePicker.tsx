"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { useEvidenceImageUpload, type EvidenceImageType } from "../hooks/useEvidenceImageUpload";
import type { Image } from "../types";

interface EvidenceImagePickerProps {
  type: EvidenceImageType;
  value: number[];
  onChange: (imageIds: number[]) => void;
  disabled?: boolean;
  label?: string;
  helperText?: string;
  uploadButtonLabel?: string;
  required?: boolean;
  variant?: "panel" | "inline";
}

const MAX_IMAGES = 5;

export function EvidenceImagePicker({
  type,
  value,
  onChange,
  disabled = false,
  label = "Ảnh minh chứng",
  helperText,
  uploadButtonLabel = "Thêm ảnh minh chứng",
  required = false,
  variant = "panel",
}: EvidenceImagePickerProps) {
  const [images, setImages] = useState<Image[]>([]);
  const localPreviewUrlsRef = useRef<Set<string>>(new Set());
  const upload = useEvidenceImageUpload(type);

  useEffect(() => {
    const localPreviewUrls = localPreviewUrlsRef.current;
    return () => {
      localPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
      localPreviewUrls.clear();
    };
  }, []);

  const selectedImages = images.filter((image) => value.includes(image.id));
  const isSelectionFull = value.length >= MAX_IMAGES;
  const isUploadDisabled = disabled || upload.isUploading || isSelectionFull;
  const resolvedHelperText = helperText ?? `Tải ảnh mới cho yêu cầu này. Tối đa ${MAX_IMAGES} ảnh.`;

  const removeImage = (imageId: number) => {
    onChange(value.filter((id) => id !== imageId));
    setImages((currentImages) => {
      const removedImage = currentImages.find((image) => image.id === imageId);
      if (removedImage?.url && localPreviewUrlsRef.current.has(removedImage.url)) {
        URL.revokeObjectURL(removedImage.url);
        localPreviewUrlsRef.current.delete(removedImage.url);
      }
      return currentImages.filter((image) => image.id !== imageId);
    });
  };

  const uploadFiles = async (files: File[]) => {
    if (files.length === 0) return;

    const available = MAX_IMAGES - value.length;
    if (available <= 0) {
      toast.error(`Chỉ được chọn tối đa ${MAX_IMAGES} ảnh.`);
      return;
    }

    const selectedFiles = files.slice(0, available);
    if (files.length > available) {
      toast.warning(`Chỉ tải thêm ${available} ảnh để đủ tối đa ${MAX_IMAGES} ảnh.`);
    }

    try {
      const imageIds = await upload.upload(selectedFiles);
      const nextValue = [...value, ...imageIds].slice(0, MAX_IMAGES);
      onChange(nextValue);

      const uploadedPreviews = imageIds.map((imageId, index) => {
        const file = selectedFiles[index];
        const previewUrl = URL.createObjectURL(file);
        localPreviewUrlsRef.current.add(previewUrl);
        return {
          id: imageId,
          url: previewUrl,
          thumbnail: null,
          type,
          name: file.name,
          format: file.type,
        } satisfies Image;
      });

      setImages((currentImages) => [...currentImages, ...uploadedPreviews]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tải ảnh lên.");
    }
  };
  const containerClassName =
    variant === "inline"
      ? "space-y-3"
      : "rounded-xl border border-primary/20 bg-primary/[0.035] p-3 shadow-sm ring-1 ring-primary/10 sm:p-4";

  return (
    <div className={containerClassName}>
      <div className={variant === "inline" ? "flex items-start justify-between gap-3" : "mb-3 flex items-start justify-between gap-3"}>
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-sm font-semibold leading-snug text-foreground">
              {label}
              {required && <span className="ml-1 text-destructive">*</span>}
            </p>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">{resolvedHelperText}</p>
        </div>
        <span className="shrink-0 rounded-full bg-background px-2.5 py-1 text-[11px] font-semibold text-foreground shadow-sm ring-1 ring-primary/15">
          {value.length}/{MAX_IMAGES}
        </span>
      </div>

      <label
        aria-disabled={isUploadDisabled}
        className={`group relative flex min-h-[58px] w-full items-center justify-center gap-3 overflow-hidden rounded-lg border px-4 py-3 text-sm font-semibold transition-colors ${
          isUploadDisabled
            ? "cursor-not-allowed border-border bg-muted/40 text-muted-foreground opacity-70"
            : "cursor-pointer border-primary/35 bg-background text-primary hover:border-primary/70 hover:bg-primary/[0.06]"
        }`}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          {upload.isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
        </span>
        <span className="min-w-0 truncate">{upload.isUploading ? `Đang tải ${upload.progress}%` : uploadButtonLabel}</span>
        {upload.isUploading && (
          <span
            className="absolute inset-x-0 bottom-0 h-0.5 bg-primary/50"
            style={{ transform: `scaleX(${upload.progress / 100})`, transformOrigin: "left" }}
          />
        )}
        <input
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          disabled={isUploadDisabled}
          onChange={(event) => {
            void uploadFiles(Array.from(event.target.files ?? []));
            event.target.value = "";
          }}
        />
      </label>

      {selectedImages.length > 0 && (
        <div className="mt-3 grid max-h-60 grid-cols-2 gap-2 overflow-y-auto pr-1 min-[420px]:grid-cols-3 sm:grid-cols-4">
          {selectedImages.map((image) => (
            <div key={image.id} className="group relative overflow-hidden rounded-lg border bg-background shadow-sm">
              <div className="aspect-square overflow-hidden bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.url} alt={image.name ?? `Ảnh ${image.id}`} className="h-full w-full object-cover" />
              </div>
              <button
                type="button"
                disabled={disabled || upload.isUploading}
                onClick={() => removeImage(image.id)}
                className="absolute right-1.5 top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-background/95 text-foreground shadow-sm ring-1 ring-border transition-colors hover:bg-destructive hover:text-destructive-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Gỡ ảnh"
                title="Gỡ ảnh"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <span className="block truncate px-2 py-1.5 text-[11px] text-muted-foreground">
                {image.name ?? `Ảnh #${image.id}`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
