"use client";

import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AppPageHeader } from "@/features/_shared/components/AppPageHeader";
import { CartItemCard } from "./components/CartItemCard";
import { CartOrderSummary } from "./components/CartOrderSummary";
import { CartMobileBottomBar } from "./components/CartMobileBottomBar";
import { CartEmptyState } from "./components/CartEmptyState";
import { useCartStore } from "./hooks/useCartStore";
import { useCartQuery, useRemoveFromCart } from "./api/cart.hooks";
import { useCreatePayment } from "@/features/payment/api/payment.hooks";
import type { CartItem } from "./types";

function CartItemSkeleton() {
  return (
    <Card className="rounded-lg border-border/60 py-0">
      <CardContent className="flex gap-4 p-4">
      <Skeleton className="aspect-video w-[140px] shrink-0 rounded-md" />
      <div className="flex-1 space-y-2.5 pt-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="mt-auto h-5 w-1/4" />
      </div>
      </CardContent>
    </Card>
  );
}

export default function CartPage() {
  const store = useCartStore();
  const [removingIds, setRemovingIds] = useState<Set<number>>(new Set());

  const { data: cartItems, isLoading } = useCartQuery();
  const removeFromCartMutation = useRemoveFromCart();
  const createPayment = useCreatePayment();

  const items = cartItems ?? store.items;
  const inCartItems = items.filter((item) => !item.savedForLater);

  const handleRemove = async (courseId: number) => {
    setRemovingIds((prev) => new Set(prev).add(courseId));
    try {
      await removeFromCartMutation.mutateAsync(courseId);
      store.removeItem(courseId);
    } finally {
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(courseId);
        return next;
      });
    }
  };

  const handleCheckout = () => {
    const courseIds = inCartItems.map((item) => item.courseId);
    if (courseIds.length === 0) return;
    createPayment.mutate(courseIds);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppPageHeader
          eyebrow="Thanh toán"
          title="Giỏ hàng của bạn"
          description="Đang tải các khóa học trong giỏ"
          icon={<ShoppingCart className="h-5 w-5" />}
        />
        <div className="container mx-auto max-w-7xl px-4 py-8 lg:px-8">
          <div className="flex gap-8">
            <div className="flex-1 space-y-4">
              <CartItemSkeleton />
              <CartItemSkeleton />
            </div>
            <div className="hidden w-96 shrink-0 lg:block">
              <Card className="rounded-lg border-border/60 py-0">
                <CardContent className="space-y-4 p-6">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-12 w-full rounded-md" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (inCartItems.length === 0) {
    return <CartEmptyState />;
  }

  return (
    <div className="min-h-screen bg-background pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0">
      <AppPageHeader
        eyebrow="Thanh toán"
        title="Giỏ hàng của bạn"
        description={`${inCartItems.length} khóa học đang chờ thanh toán`}
        icon={<ShoppingCart className="h-5 w-5" />}
      />

      <div className="container mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="flex gap-8">
          <div className="min-w-0 flex-1 space-y-6">
            {inCartItems.length > 0 && (
              <div className="lg:hidden">
                <CartOrderSummary
                  items={inCartItems}
                  onCheckout={handleCheckout}
                  isCheckingOut={createPayment.isPending}
                />
              </div>
            )}

            <div className="space-y-4">
              {inCartItems.map((item: CartItem) => (
                <CartItemCard
                  key={item.id}
                  item={item}
                  onRemove={handleRemove}
                  isRemoving={removingIds.has(item.courseId)}
                />
              ))}
            </div>
          </div>

          {inCartItems.length > 0 && (
            <div className="hidden w-96 shrink-0 lg:block">
              <div className="sticky top-24">
                <CartOrderSummary
                  items={inCartItems}
                  onCheckout={handleCheckout}
                  isCheckingOut={createPayment.isPending}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <CartMobileBottomBar items={inCartItems} onCheckout={handleCheckout} />
    </div>
  );
}
