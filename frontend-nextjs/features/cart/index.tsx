"use client";

import { useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
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
    <div className="flex animate-pulse gap-4 rounded-xl border border-border/60 bg-card p-4">
      <div className="aspect-video w-[140px] shrink-0 rounded-lg bg-muted" />
      <div className="flex-1 space-y-2.5 pt-1">
        <div className="h-4 w-3/4 rounded bg-muted" />
        <div className="h-3 w-1/2 rounded bg-muted" />
        <div className="h-3 w-1/3 rounded bg-muted" />
        <div className="mt-auto h-5 w-1/4 rounded bg-muted" />
      </div>
    </div>
  );
}

export default function CartPage() {
  const store = useCartStore();
  const [removingIds, setRemovingIds] = useState<Set<number>>(new Set());

  const { data: cartItems, isLoading } = useCartQuery();
  const removeFromCartMutation = useRemoveFromCart();
  const createPayment = useCreatePayment();

  // Sync API data vào store để dùng getInCartItems / getSavedItems / getTotal
  const items = cartItems ?? store.items;
  const inCartItems = items.filter((i) => !i.savedForLater);
  const savedItems = store.getSavedItems();

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

  const handleSave = (courseId: number) => {
    store.saveForLater(courseId);
  };

  const handleMoveToCart = (courseId: number) => {
    store.moveToCart(courseId);
  };

  const handleCheckout = () => {
    const courseIds = inCartItems.map((i) => i.courseId);
    if (courseIds.length === 0) return;
    createPayment.mutate(courseIds);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 lg:px-8 py-8">
        <div className="flex gap-8">
          <div className="flex-1 space-y-4">
            <CartItemSkeleton />
            <CartItemSkeleton />
          </div>
          <div className="hidden w-96 shrink-0 lg:block">
            <div className="animate-pulse rounded-xl border border-border/60 bg-card p-6 space-y-4">
              <div className="h-4 w-1/2 rounded bg-muted" />
              <div className="h-3 w-full rounded bg-muted" />
              <div className="h-3 w-3/4 rounded bg-muted" />
              <div className="h-12 w-full rounded-lg bg-muted" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoading && inCartItems.length === 0 && savedItems.length === 0) {
    return <CartEmptyState />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl px-4 lg:px-8 py-8">

        {/* ── Breadcrumb + Title ─────────────────────────────────── */}
        <div className="mb-8 space-y-2">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Trang chủ</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Giỏ hàng</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="text-2xl font-bold">Giỏ hàng của bạn</h1>
          {inCartItems.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {inCartItems.length} khoá học
            </p>
          )}
        </div>

        {/* ── Main layout ────────────────────────────────────────── */}
        <div className="flex gap-8">

          {/* ── Left: Item list ────────────────────────────────── */}
          <div className="min-w-0 flex-1 space-y-6">

            {/* Mobile: sidebar inline trên mobile */}
            {inCartItems.length > 0 && (
              <div className="lg:hidden">
                <CartOrderSummary
                  items={inCartItems}
                  onCheckout={handleCheckout}
                  isCheckingOut={createPayment.isPending}
                />
              </div>
            )}

            {/* Cart items */}
            {inCartItems.length > 0 && (
              <div className="space-y-4">
                {inCartItems.map((item: CartItem) => (
                  <CartItemCard
                    key={item.id}
                    item={item}
                    isSavedView={false}
                    onRemove={handleRemove}
                    onSave={handleSave}
                    onMoveToCart={handleMoveToCart}
                    isRemoving={removingIds.has(item.courseId)}
                  />
                ))}
              </div>
            )}

            {/* Empty in-cart but has saved items */}
            {inCartItems.length === 0 && savedItems.length > 0 && (
              <div className="rounded-xl border border-border/60 bg-muted/30 p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Giỏ hàng trống. Hãy chuyển khoá học từ &quot;Đã lưu&quot; vào giỏ để thanh toán.
                </p>
              </div>
            )}

            {/* Saved for later section */}
            {savedItems.length > 0 && (
              <div className="space-y-4">
                <Separator />
                <div>
                  <h2 className="mb-1 text-base font-semibold">
                    Đã lưu để sau
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {savedItems.length} khoá học
                  </p>
                </div>
                <div className="space-y-4">
                  {savedItems.map((item: CartItem) => (
                    <CartItemCard
                      key={item.id}
                      item={item}
                      isSavedView={true}
                      onRemove={handleRemove}
                      onSave={handleSave}
                      onMoveToCart={handleMoveToCart}
                      isRemoving={removingIds.has(item.courseId)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Right: Sticky sidebar (desktop) ───────────────── */}
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

      {/* ── Mobile fixed bottom bar ────────────────────────────── */}
      <CartMobileBottomBar items={inCartItems} onCheckout={handleCheckout} />
    </div>
  );
}
