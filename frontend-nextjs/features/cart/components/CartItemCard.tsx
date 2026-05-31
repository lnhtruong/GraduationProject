"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Play, Star, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatPrice } from "@/features/courses/utils";
import type { CartItem } from "../types";

// Hiển thị duration seconds → "Xg Yp"
function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}g ${m}p`;
  if (h > 0) return `${h}g`;
  return `${m}p`;
}

const LEVEL_LABELS: Record<CartItem["level"], string> = {
  Beginner: "Cơ bản",
  Intermediate: "Trung cấp",
  Advanced: "Nâng cao",
};

interface CartItemCardProps {
  item: CartItem;
  onRemove: (courseId: number) => void;
  isRemoving?: boolean;
}

export function CartItemCard({
  item,
  onRemove,
  isRemoving = false,
}: CartItemCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);

  const handleMouseEnter = () => {
    if (!item.highlightVideoUrl || !videoRef.current) return;
    videoRef.current.play().catch(() => {});
  };

  const handleMouseLeave = () => {
    if (!videoRef.current) return;
    videoRef.current.pause();
    videoRef.current.currentTime = 0;
    setVideoReady(false);
  };

  return (
    <div
      className={`flex flex-col gap-4 rounded-xl border border-border/60 bg-card p-4 shadow-sm
        transition-all duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)]
        sm:flex-row
        ${isRemoving ? "pointer-events-none opacity-40" : ""}`}
    >
      {/* ── Thumbnail ─────────────────────────────────────────────── */}
      <Link
        href={`/courses/${item.courseId}`}
        className="group relative aspect-video w-full shrink-0 overflow-hidden rounded-lg bg-muted sm:w-[140px]"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Static thumbnail */}
        {item.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.thumbnailUrl}
            alt={item.title}
            className={`h-full w-full object-cover transition-opacity duration-300
              ${item.highlightVideoUrl && videoReady ? "opacity-0" : "opacity-100"}`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/50" />
        )}

        {/* Highlight video — [MOCK] highlightVideoUrl = undefined → không render
            [SWAP] khi backend cung cấp Videos.url thì video tự động hiện */}
        {item.highlightVideoUrl && (
          <video
            ref={videoRef}
            src={item.highlightVideoUrl}
            muted
            loop
            playsInline
            preload="none"
            onCanPlay={() => setVideoReady(true)}
            onPause={() => setVideoReady(false)}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}

        {/* Play icon overlay */}
        <div
          className={`absolute inset-0 flex items-center justify-center
            transition-opacity duration-300
            ${item.highlightVideoUrl && videoReady ? "opacity-0" : "opacity-100"}`}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40">
            <Play className="ml-0.5 h-4 w-4 fill-white text-white" />
          </div>
        </div>

        {/* "Xem thử" badge khi video đang play */}
        {item.highlightVideoUrl && videoReady && (
          <span className="absolute left-2 top-2 rounded-full bg-primary/90 px-2 py-0.5 text-[11px] font-bold text-white">
            Xem thử
          </span>
        )}
      </Link>

      {/* ── Content ───────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {/* Title */}
        <Link href={`/courses/${item.courseId}`}>
          <h3 className="line-clamp-2 text-[15px] font-bold leading-snug hover:text-primary transition-colors">
            {item.title}
          </h3>
        </Link>

        {/* Meta */}
        <p className="text-xs text-muted-foreground">
          {item.instructorName}
          {" · "}
          {LEVEL_LABELS[item.level]}
          {" · "}
          {formatDuration(item.durationSeconds)}
        </p>

        {/* Rating */}
        {item.avgRating !== undefined && (
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-primary text-primary" />
            <span className="text-xs font-semibold text-primary">
              {item.avgRating.toFixed(1)}
            </span>
            {item.reviewCount !== undefined && (
              <span className="text-xs text-muted-foreground">
                ({item.reviewCount.toLocaleString("vi-VN")} đánh giá)
              </span>
            )}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-[17px] font-extrabold">
            {formatPrice(item.price)}
          </span>
        </div>

        {/* Actions */}
        <div className="mt-2 flex items-center gap-3 border-t border-border/40 pt-3 text-xs">
          <RemoveButton courseId={item.courseId} onRemove={onRemove} />
        </div>
      </div>
    </div>
  );
}

// ─── Remove confirm dialog ───────────────────────────────────────────────────
function RemoveButton({
  courseId,
  onRemove,
}: {
  courseId: number;
  onRemove: (id: number) => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button className="flex items-center gap-1 text-destructive transition-colors hover:text-destructive/80">
          <Trash2 className="h-3.5 w-3.5" />
          Xoá
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xoá khỏi giỏ hàng?</AlertDialogTitle>
          <AlertDialogDescription>
            Khoá học sẽ bị xoá khỏi giỏ hàng của bạn. Bạn có thể thêm lại bất cứ lúc nào.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Huỷ</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onRemove(courseId)}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            Xoá
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
