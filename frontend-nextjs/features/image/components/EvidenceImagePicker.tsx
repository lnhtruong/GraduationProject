"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, ImagePlus, Loader2, Search, X } from "lucide-react";
import { toast } from "sonner";
import { imageApi } from "../api/image.api";
import { useEvidenceImageUpload, type EvidenceImageType } from "../hooks/useEvidenceImageUpload";
import type { Image } from "../types";

interface EvidenceImagePickerProps {
  type: EvidenceImageType;
  value: number[];
  onChange: (imageIds: number[]) => void;
  disabled?: boolean;
  label?: string;
  required?: boolean;
}

const MAX_IMAGES = 5;

export function EvidenceImagePicker({
  type,
  value,
  onChange,
  disabled = false,
  label = "Ảnh minh chứng",
  required = false,
}: EvidenceImagePickerProps) {
  const [images, setImages] = useState<Image[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const upload = useEvidenceImageUpload(type);

  const loadImages = useCallback(async () => {
    setIsLoading(true);
    try {
      setImages(await imageApi.getAllByUser({ type }));
    } catch {
      toast.error("Không thể tải kho ảnh minh chứng.");
    } finally {
      setIsLoading(false);
    }
  }, [type]);

  useEffect(() => {
    void loadImages();
  }, [loadImages]);

  const filteredImages = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return images;
    return images.filter((image) =>
      `${image.name ?? ""} ${image.url}`.toLowerCase().includes(keyword),
    );
  }, [images, search]);

  const isSelectionFull = value.length >= MAX_IMAGES;
  const isUploadDisabled = disabled || upload.isUploading || isSelectionFull;

  const toggleImage = (imageId: number) => {
    if (value.includes(imageId)) {
      onChange(value.filter((id) => id !== imageId));
      return;
    }
    if (value.length >= MAX_IMAGES) {
      toast.error(`Chỉ được chọn tối đa ${MAX_IMAGES} ảnh.`);
      return;
    }
    onChange([...value, imageId]);
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
      onChange([...value, ...imageIds].slice(0, MAX_IMAGES));
      await loadImages();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tải ảnh lên.");
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium">
          {label} {required && <span className="text-destructive">*</span>}
        </p>
        <p className="text-xs text-muted-foreground">
          Chọn từ kho ảnh đã tải hoặc thêm ảnh mới. Tối đa {MAX_IMAGES} ảnh.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <label
          aria-disabled={isUploadDisabled}
          className={`inline-flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border px-3 py-2 text-sm transition-colors sm:w-auto ${
            isUploadDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-muted/40"
          }`}
        >
          {upload.isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          {upload.isUploading ? `Đang tải ${upload.progress}%` : "Tải ảnh mới"}
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
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo tên ảnh..."
            className="h-9 w-full rounded-md border border-input bg-transparent pl-8 pr-8 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            disabled={disabled}
          />
          {search && (
            <button
              type="button"
              className="absolute right-2 top-2.5 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => setSearch("")}
              disabled={disabled}
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang tải kho ảnh...
        </div>
      ) : filteredImages.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-3 py-5 text-center text-xs text-muted-foreground">
          Chưa có ảnh {type === "report" ? "báo cáo" : "xác minh giảng viên"} nào.
        </p>
      ) : (
        <div className="grid max-h-56 grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4">
          {filteredImages.map((image) => {
            const selected = value.includes(image.id);
            return (
              <button
                key={image.id}
                type="button"
                disabled={disabled || upload.isUploading}
                onClick={() => toggleImage(image.id)}
                className={`group relative overflow-hidden rounded-md border text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60 ${
                  selected ? "border-primary ring-2 ring-primary" : "border-border"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.url} alt={image.name ?? `Ảnh ${image.id}`} className="h-20 w-full object-cover" />
                {selected && (
                  <span className="absolute right-1 top-1 rounded-full bg-primary p-0.5 text-primary-foreground">
                    <Check className="h-3 w-3" />
                  </span>
                )}
                <span className="block truncate px-1.5 py-1 text-[10px] text-muted-foreground">
                  {image.name ?? `Ảnh #${image.id}`}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {value.length > 0 && (
        <p className="text-xs text-muted-foreground">Đã chọn {value.length}/{MAX_IMAGES} ảnh.</p>
      )}
    </div>
  );
}
