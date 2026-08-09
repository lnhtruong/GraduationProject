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
  className = "grid grid-cols-2 gap-2 min-[420px]:grid-cols-3 sm:grid-cols-4",
  imageClassName = "h-full w-full object-cover",
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
            className="group overflow-hidden rounded-lg border bg-background shadow-sm transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="block aspect-square overflow-hidden bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt={image.name ?? `Ảnh minh chứng ${image.imageId}`}
                className={`${imageClassName} transition-transform duration-200 group-hover:scale-[1.03]`}
              />
            </span>
          </button>
        ))}
      </div>

      <Dialog open={Boolean(selectedImage)} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-3xl p-2 pt-8 sm:p-3 sm:pt-9">
          <DialogTitle className="sr-only">{label}</DialogTitle>
          <DialogDescription className="sr-only">
            Xem ảnh minh chứng kích thước lớn.
          </DialogDescription>
          {selectedImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={selectedImage.url}
              alt={selectedImage.name ?? `Ảnh minh chứng ${selectedImage.imageId}`}
              className="max-h-[82dvh] w-full rounded-lg object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
