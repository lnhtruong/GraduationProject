// Cart feature — entry component
//
// [MOCK] Swap checklist — tìm comment [MOCK] để biết chỗ cần thay:
// 1. Thay MOCK_CART_ITEMS bằng data từ useCartQuery() (React Query) — xem cart.hooks.ts
// 2. Thay cartStore.removeItem / saveForLater bằng mutations useRemoveFromCart / useSaveForLater
//    khi backend sẵn sàng, để sync server-side
// 3. Thay handleCheckout bằng navigate tới /checkout hoặc mở payment modal
// 4. Xoá import MOCK_CART_ITEMS sau khi có API

"use client";

import { useEffect, useState } from "react";
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
import { MOCK_CART_ITEMS } from "./mock-data"; // [MOCK] — xoá khi có API
import type { CartItem } from "./types";

// [MOCK] Skeleton cho trạng thái loading
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
  const [isLoaded, setIsLoaded] = useState(false);

  // [MOCK] Khởi tạo store từ mock data khi chưa có dữ liệu nào
  // [SWAP] Xoá useEffect này, thay bằng:
  //   const { data: items = [], isLoading } = useCartQuery();
  //   useEffect(() => { if (items.length) store.setItems(items); }, [items]);
  useEffect(() => {
    if (store.items.length === 0) {
      store.setItems(MOCK_CART_ITEMS);
    }
    setIsLoaded(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const inCartItems = store.getInCartItems();
  const savedItems = store.getSavedItems();

  // Handlers
  const handleRemove = async (courseId: number) => {
    setRemovingIds((prev) => new Set(prev).add(courseId));

    // [MOCK] optimistic remove — [SWAP] thêm: await removeFromCartMutation.mutateAsync(courseId)
    await new Promise((r) => setTimeout(r, 300)); // animation delay
    store.removeItem(courseId);

    setRemovingIds((prev) => {
      const next = new Set(prev);
      next.delete(courseId);
      return next;
    });
  };

  const handleSave = (courseId: number) => {
    // [MOCK] local only — [SWAP] thêm: saveForLaterMutation.mutate({ courseId, saved: true })
    store.saveForLater(courseId);
  };

  const handleMoveToCart = (courseId: number) => {
    // [MOCK] local only — [SWAP] thêm: saveForLaterMutation.mutate({ courseId, saved: false })
    store.moveToCart(courseId);
  };

  const handleCheckout = () => {
    // [SWAP] navigate('/checkout') hoặc mở payment modal
    alert("Tính năng thanh toán sẽ sớm được cập nhật!");
  };

  // Loading state — [MOCK] isLoaded delay nhỏ cho hydration
  // [SWAP] dùng isLoading từ useCartQuery() thay thế
  if (!isLoaded) {
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

  // Empty state
  if (inCartItems.length === 0 && savedItems.length === 0) {
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
