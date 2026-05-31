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
import { ShoppingCart } from "lucide-react";
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

  const items = cartItems ?? store.items;
  const inCartItems = items.filter((i) => !i.savedForLater);

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

  if (!isLoading && inCartItems.length === 0) {
    return <CartEmptyState />;
  }

  return (
    <div className="min-h-screen bg-background">

      {/* ── Hero header ────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border/40 py-10 lg:py-14">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-br from-primary/5 via-background to-background" />
        <div className="container mx-auto max-w-7xl px-4 lg:px-8">
          <Breadcrumb className="mb-3">
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
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <ShoppingCart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight lg:text-3xl">
                Giỏ hàng của bạn
              </h1>
              <p className="text-sm text-muted-foreground">
                {inCartItems.length > 0
                  ? `${inCartItems.length} khoá học đang chờ thanh toán`
                  : "Chưa có khoá học nào trong giỏ"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto max-w-7xl px-4 lg:px-8 py-8">

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
