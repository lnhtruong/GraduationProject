"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

export type EvidenceImageItem = {
  imageId: number;
  url: string;
  name?: string | null;
};

interface EvidenceImageGalleryProps {
  images: EvidenceImageItem[];
  label?: string;
  className?: string;
  imageClassName?: string;
}

export function EvidenceImageGallery({
  images,
  label = "Ảnh minh chứng",
  className = "flex flex-wrap gap-2",
  imageClassName = "h-16 w-16 object-cover",
}: EvidenceImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<EvidenceImageItem | null>(null);

  if (images.length === 0) return null;

  return (
    <>
      <div className={className}>
        {images.map((image) => (
          <button
            key={image.imageId}
            type="button"
            onClick={() => setSelectedImage(image)}
            className="overflow-hidden rounded-md border border-border transition-opacity hover:opacity-80"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.url}
              alt={image.name ?? `Ảnh minh chứng ${image.imageId}`}
              className={imageClassName}
            />
          </button>
        ))}
      </div>

      <Dialog open={Boolean(selectedImage)} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-3xl p-3">
          <DialogTitle className="sr-only">{label}</DialogTitle>
          <DialogDescription className="sr-only">
            Xem ảnh minh chứng kích thước lớn.
          </DialogDescription>
          {selectedImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={selectedImage.url}
              alt={selectedImage.name ?? `Ảnh minh chứng ${selectedImage.imageId}`}
              className="max-h-[80vh] w-full rounded-md object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
