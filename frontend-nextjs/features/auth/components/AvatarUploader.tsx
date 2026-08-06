"use client";

import React, { useCallback, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Camera, Eye, ImagePlus, ZoomIn } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Slider } from "@/components/ui/slider";
import { Spinner } from "@/components/ui/spinner";
import { useAvatarUpload } from "@/features/auth/hooks/useAvatarUpload";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { getUserDisplayName, getUserInitials } from "@/lib/user-display";
import { toast } from "sonner";

function createImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.src = src;
  });
}

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<File> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas context is not available");
  }

  const outputSize = 512;
  canvas.width = outputSize;
  canvas.height = outputSize;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputSize,
    outputSize,
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (!result) {
          reject(new Error("Failed to export cropped image"));
          return;
        }
        resolve(result);
      },
      "image/jpeg",
      0.95,
    );
  });

  return new File([blob], `avatar-${Date.now()}.jpg`, {
    type: "image/jpeg",
  });
}

export default function AvatarUploader() {
  const { user } = useAuth();
  const { upload } = useAvatarUpload();

  const [open, setOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const fullName = getUserDisplayName(user);
  const initials = getUserInitials(user);

  const openFilePicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleOpenViewer = useCallback(() => {
    if (!user?.avatarUrl) {
      return;
    }

    setViewOpen(true);
  }, [user?.avatarUrl]);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast.error("Vui lòng chọn một file ảnh hợp lệ.");
        event.target.value = "";
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("Kích thước ảnh không được vượt quá 5MB.");
        event.target.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(String(reader.result ?? ""));
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setOpen(true);
      };
      reader.readAsDataURL(file);
      event.target.value = "";
    },
    [],
  );

  const handleCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleClose = useCallback((nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setImageSrc(null);
      setCroppedAreaPixels(null);
      setLoading(false);
    }
  }, []);

  const handleUpload = useCallback(async () => {
    if (!imageSrc || !croppedAreaPixels) {
      toast.error("Vui lòng chọn và căn chỉnh ảnh trước khi tải lên.");
      return;
    }

    setLoading(true);
    try {
      const croppedFile = await getCroppedImg(imageSrc, croppedAreaPixels);
      await upload(croppedFile);
      toast.success("Cập nhật ảnh đại diện thành công.");
      handleClose(false);
    } catch (error) {
      console.error(error);
      toast.error("Tải lên thất bại, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [croppedAreaPixels, handleClose, imageSrc, upload]);

  return (
    <div className="space-y-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="group relative mx-auto block h-28 w-28 cursor-pointer overflow-hidden rounded-full border-2 border-border/80 shadow-sm transition-all duration-200 hover:border-primary/60 hover:shadow-md"
            aria-label="Thay đổi ảnh đại diện"
          >
            <Avatar className="h-full w-full">
              <AvatarImage src={user?.avatarUrl ?? undefined} alt={fullName} />
              <AvatarFallback className="bg-muted text-xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <div className="flex flex-col items-center gap-1 text-white">
                <Camera className="h-5 w-5" />
                <span className="text-[10px] font-medium uppercase tracking-[0.16em]">
                  Thay đổi
                </span>
              </div>
            </div>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="center" className="w-56">
          {user?.avatarUrl ? (
            <DropdownMenuItem onClick={handleOpenViewer}>
              <Eye className="mr-2 h-4 w-4" />
              Xem ảnh đại diện
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem onClick={openFilePicker}>
            <ImagePlus className="mr-2 h-4 w-4" />
            Chọn ảnh đại diện mới
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-130 overflow-hidden p-0">
          <DialogHeader className="border-b border-border/50 px-6 py-4">
            <DialogTitle>Chỉnh sửa ảnh đại diện</DialogTitle>
            <DialogDescription>
              Kéo trực tiếp ảnh để căn chỉnh. Dùng thanh zoom để phóng to hoặc
              thu nhỏ trước khi lưu.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 px-6 py-5">
            <div className="relative h-72 overflow-hidden rounded-2xl border border-border/60 bg-neutral-950 shadow-inner">
              {imageSrc ? (
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onCropComplete={handleCropComplete}
                  onZoomChange={setZoom}
                  objectFit="horizontal-cover"
                  classes={{
                    containerClassName: "bg-neutral-950",
                    cropAreaClassName:
                      "border border-white/35 shadow-[0_0_0_9999px_rgba(0,0,0,0.52)]",
                  }}
                />
              ) : null}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <ZoomIn className="h-3.5 w-3.5" />
                  Zoom
                </span>
                <span>{Math.round(zoom * 100)}%</span>
              </div>
              <Slider
                min={1}
                max={3}
                step={0.01}
                value={[zoom]}
                onValueChange={(values) => setZoom(values[0] ?? 1)}
                className="py-1"
              />
            </div>
          </div>

          <DialogFooter className="border-t border-border/50 bg-muted/30 px-6 py-4">
            <div className="flex w-full justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleClose(false)}
                disabled={loading}
              >
                Huỷ
              </Button>
              <Button type="button" onClick={handleUpload} disabled={loading}>
                {loading ? <Spinner className="h-4 w-4" /> : "Tải lên"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-140 overflow-hidden p-0">
          <DialogHeader className="border-b border-border/50 px-6 py-4">
            <DialogTitle>Ảnh đại diện</DialogTitle>
            <DialogDescription>
              Đây là ảnh đại diện hiện tại của bạn.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-neutral-950 p-4">
            <div className="relative mx-auto aspect-square max-w-105 overflow-hidden rounded-2xl border border-white/10 bg-black">
              <Avatar className="h-full w-full rounded-none">
                <AvatarImage
                  src={user?.avatarUrl ?? undefined}
                  alt={fullName}
                />
                <AvatarFallback className="h-full w-full rounded-none bg-muted text-3xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>

          <DialogFooter className="border-t border-border/50 bg-muted/30 px-6 py-4">
            <div className="flex w-full justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setViewOpen(false)}
              >
                Đóng
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setViewOpen(false);
                  openFilePicker();
                }}
              >
                Chọn ảnh mới
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
