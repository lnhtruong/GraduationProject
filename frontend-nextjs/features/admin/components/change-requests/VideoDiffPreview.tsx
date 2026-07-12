"use client";

import { useState } from "react";
import { Check, ExternalLink, Loader2, Play, Video as VideoIcon, AlertCircle } from "lucide-react";
import Image from "next/image";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useVideoById } from "@/features/video/api/video.hooks";

/**
 * Preview video cho change request `lesson.create`/`lesson.update` khi
 * contentType là "video" — cùng pattern với VideoPreviewInline trong
 * AdminCourseReviewModal, nhưng video ở đây chưa được join sẵn (change
 * request chỉ lưu `videoId`) nên phải fetch riêng qua GET /videos/:id.
 */
export function VideoDiffPreview({ videoId, title }: { videoId: number; title: string }) {
  const [open, setOpen] = useState(false);
  const { data: video, isLoading, isError } = useVideoById(videoId);

  if (isLoading) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Đang tải video...
      </span>
    );
  }

  if (isError || !video) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
        <AlertCircle className="h-3 w-3" />
        Không tải được video (ID #{videoId})
      </span>
    );
  }

  const videoUrl = video.url?.trim();
  if (!videoUrl) {
    return (
      <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
        Video đang xử lý, chưa có URL
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative h-[27px] w-12 shrink-0 overflow-hidden rounded border border-border/60 bg-muted transition-opacity hover:opacity-90"
        aria-label={`Xem video: ${title}`}
      >
        {video.thumbnail ? (
          <Image src={video.thumbnail} alt={title} fill className="object-cover" sizes="48px" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <VideoIcon className="h-3.5 w-3.5 text-muted-foreground/50" />
          </div>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 transition-opacity group-hover:opacity-100">
          <Play className="h-3 w-3 translate-x-px text-white drop-shadow" />
        </span>
      </button>
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
        <Check className="h-3 w-3" />
        Có video
      </span>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-2xl">
          <DialogHeader className="border-b border-border/60 px-4 py-3 pr-12">
            <DialogTitle className="flex items-center gap-2 text-sm font-medium">
              <span className="line-clamp-1 flex-1">{title}</span>
              <a
                href={videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Mở video gốc"
                onClick={(e) => e.stopPropagation()}
                className="shrink-0 text-muted-foreground/60 hover:text-primary transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </DialogTitle>
          </DialogHeader>
          <div className="aspect-video w-full bg-black">
            {open && (
              <video src={videoUrl} controls autoPlay className="h-full w-full object-contain" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
