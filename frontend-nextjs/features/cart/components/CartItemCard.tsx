"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Star, Trash2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
  onToggleSelected?: (courseId: number, selected: boolean) => void;
  isRemoving?: boolean;
  isSelected?: boolean;
}

export function CartItemCard({
  item,
  onRemove,
  onToggleSelected,
  isRemoving = false,
  isSelected = false,
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
    <Card
      className={`flex flex-col gap-4 rounded-lg border-border/60 p-4
        transition-all duration-200 hover:border-primary/30 hover:shadow-md
        sm:flex-row
        ${isSelected ? "border-primary/50 bg-primary/5" : ""}
        ${isRemoving ? "pointer-events-none opacity-40" : ""}`}
    >
      <div className="flex items-center sm:items-start sm:pt-1">
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) =>
            onToggleSelected?.(item.courseId, checked === true)
          }
          aria-label={`Chon ${item.title}`}
        />
      </div>

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
          <div className="flex h-full w-full items-center justify-center bg-muted" />
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

        {/* "Xem thử" badge khi video đang play */}
        {item.highlightVideoUrl && videoReady && (
          <Badge className="absolute left-2 top-2 text-[11px]">
            Xem thử
          </Badge>
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
        <div className="mt-2 flex justify-end border-t border-border/40 pt-3 text-xs">
          <RemoveButton courseId={item.courseId} onRemove={onRemove} />
        </div>
      </div>
    </Card>
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
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Xoá
        </Button>
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
