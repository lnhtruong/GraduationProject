"use client";

import Image from "next/image";
import Link from "next/link";
import { BookOpen, GraduationCap, ShoppingCart, Star, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatPrice, parseHHMMSS, formatDuration } from "@/features/courses/utils";
import { useAddToCart, useIsInCart } from "@/features/cart/api/cart.hooks";
import { useWishlistQuery, useToggleWishlistMutation } from "../api/wishlist.hooks";
import type { WishlistItem } from "../types";

const LIMIT = 20;

// ─── Skeleton card ───────────────────────────────────────────────────────────
function WishlistCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card animate-pulse">
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="flex flex-col gap-2 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
        <div className="mt-3 flex gap-2">
          <Skeleton className="h-8 flex-1 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// ─── Card item ───────────────────────────────────────────────────────────────
function WishlistItemCard({ item }: { item: WishlistItem }) {
  const isInCart = useIsInCart(item.id);
  const addToCart = useAddToCart();
  const { mutate: toggleWishlist, isPending: isRemoving } = useToggleWishlistMutation();

  const handleAddToCart = () => {
    if (isInCart) return;
    addToCart.mutate(item.id, {
      onSuccess: () => toast.success("Đã thêm vào giỏ hàng"),
      onError: () => toast.error("Không thể thêm vào giỏ hàng"),
    });
  };

  const handleRemove = () => {
    toggleWishlist(
      { courseId: item.id, currentlyInWishlist: true },
      { onSuccess: () => toast.success("Đã xóa khỏi danh sách lưu") },
    );
  };

  const durationSecs = parseHHMMSS(item.duration);

  return (
    <div
      className={`group flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm
        transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md
        ${isRemoving ? "pointer-events-none opacity-50" : ""}`}
    >
      {/* Thumbnail */}
      <Link href={`/courses/${item.id}`} className="relative block aspect-video overflow-hidden bg-muted">
        {item.thumbnailUrl ? (
          <Image
            src={item.thumbnailUrl}
            alt={item.name}
            fill
            unoptimized
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary/10">
            <GraduationCap className="h-12 w-12 text-primary/40" />
          </div>
        )}
        {item.level && (
          <Badge className="absolute left-2 top-2 bg-primary text-primary-foreground text-xs font-semibold">
            {item.level}
          </Badge>
        )}
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link href={`/courses/${item.id}`}>
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug transition-colors hover:text-primary">
            {item.name}
          </h3>
        </Link>

        {/* Instructor */}
        {item.instructor && (
          <div className="flex items-center gap-1.5">
            {item.instructor.avatarUrl ? (
              <Image
                src={item.instructor.avatarUrl}
                alt={item.instructor.name}
                width={18}
                height={18}
                unoptimized
                className="h-4.5 w-4.5 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-border bg-muted">
                <GraduationCap className="h-2.5 w-2.5 text-muted-foreground" />
              </div>
            )}
            <span className="truncate text-xs text-muted-foreground">
              {item.instructor.name}
            </span>
          </div>
        )}

        {/* Stats */}
        <div className="flex flex-wrap items-center gap-3">
          {item.avgRating > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="font-medium text-foreground">
                {item.avgRating.toFixed(1)}
              </span>
              {item.reviewCount > 0 && (
                <span>({item.reviewCount.toLocaleString()})</span>
              )}
            </span>
          )}
          {item.enrollCount > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              {item.enrollCount.toLocaleString()}
            </span>
          )}
          {durationSecs > 0 && (
            <span className="text-xs text-muted-foreground">
              {formatDuration(durationSecs)}
            </span>
          )}
        </div>

        <div className="flex-1" />

        {/* Price */}
        <span className="text-sm font-bold text-foreground">
          {item.price === 0 ? (
            <span className="text-primary">Miễn phí</span>
          ) : (
            formatPrice(item.price)
          )}
        </span>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <Button
            size="sm"
            variant={isInCart ? "secondary" : "default"}
            className="flex-1 gap-1.5 text-xs"
            disabled={isInCart || addToCart.isPending}
            onClick={handleAddToCart}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            {isInCart ? "Đã trong giỏ" : "Thêm vào giỏ"}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 shrink-0 p-0 text-muted-foreground hover:text-destructive"
            disabled={isRemoving}
            onClick={handleRemove}
            aria-label="Xóa khỏi danh sách lưu"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────
function WishlistEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
        <BookOpen className="h-12 w-12 text-muted-foreground/40" />
      </div>
      <h2 className="mb-2 text-xl font-bold">Bạn chưa lưu khóa học nào</h2>
      <p className="mb-8 max-w-sm text-sm text-muted-foreground">
        Nhấn vào icon tim trên bất kỳ khóa học nào để lưu lại và xem sau.
      </p>
      <Button
        variant="outline"
        className="border-primary/40 text-primary hover:bg-primary/5"
        asChild
      >
        <Link href="/courses">Khám phá khóa học</Link>
      </Button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function WishlistPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useWishlistQuery(page, LIMIT);

  const items = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Khóa học đã lưu
          </h1>
          {!isLoading && total > 0 && (
            <p className="mt-1 text-sm text-muted-foreground">
              {total} khóa học
            </p>
          )}
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-sm text-destructive">
            Không thể tải danh sách. Vui lòng thử lại sau.
          </p>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <WishlistCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && items.length === 0 && <WishlistEmptyState />}

      {/* Grid */}
      {!isLoading && !isError && items.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
              <WishlistItemCard key={item.id} item={item} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Trước
              </Button>
              <span className="text-sm text-muted-foreground">
                Trang {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Tiếp
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
