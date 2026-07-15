"use client";

import Image from "next/image";
import Link from "next/link";
import { BookOpen, GraduationCap, ShoppingCart, Star, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { AppEmptyState } from "@/features/_shared/components/AppEmptyState";
import { AppLoadingState } from "@/features/_shared/components/AppLoadingState";
import { AppPageHeader } from "@/features/_shared/components/AppPageHeader";
import { formatPrice, parseHHMMSS, formatDuration } from "@/features/courses/utils";
import { useAddToCart, useIsInCart } from "@/features/cart/api/cart.hooks";
import { useWishlistQuery, useToggleWishlistMutation } from "../api/wishlist.hooks";
import type { WishlistItem } from "../types";

const LIMIT = 20;

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
    <Card
      className={`group gap-0 overflow-hidden rounded-lg border-border/60 py-0
        transition-all duration-200 hover:border-primary/40 hover:shadow-md
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
            className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
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
      <CardContent className="flex flex-1 flex-col gap-2 p-4">
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
      </CardContent>
    </Card>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────
function WishlistEmptyState() {
  return (
    <AppEmptyState
      icon={<BookOpen className="h-8 w-8" />}
      title="Bạn chưa lưu khóa học nào"
      description="Nhấn vào biểu tượng tim trên khóa học để lưu lại và quay lại xem sau."
      action={
        <Button variant="outline" asChild>
          <Link href="/courses/search">Khám phá khóa học</Link>
        </Button>
      }
    />
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
    <div className="min-h-screen bg-background">
      <AppPageHeader
        eyebrow="Danh sách cá nhân"
        title="Khóa học đã lưu"
        description={
          !isLoading && total > 0
            ? `${total} khóa học bạn muốn quay lại sau`
            : "Lưu lại các khóa học yêu thích để so sánh và đăng ký khi sẵn sàng."
        }
        icon={<BookOpen className="h-5 w-5" />}
      />

      <div className="container mx-auto max-w-7xl px-4 py-8 lg:px-8">

      {/* Error state */}
      {isError && (
        <Alert variant="destructive">
          <AlertDescription>
            Không thể tải danh sách. Vui lòng thử lại sau.
          </AlertDescription>
        </Alert>
      )}

      {/* Loading */}
      {isLoading && (
        <AppLoadingState
          variant="cards"
          count={8}
          message="Đang tải danh sách khóa học đã lưu..."
        />
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
    </div>
  );
}
