"use client";

import { useEffect, useMemo, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AppPageHeader } from "@/features/_shared/components/AppPageHeader";
import { CartItemsSection } from "./components/CartItemsSection";
import { CartOrderSummary } from "./components/CartOrderSummary";
import { CartMobileBottomBar } from "./components/CartMobileBottomBar";
import { CartEmptyState } from "./components/CartEmptyState";
import { CartSuggestionSection } from "./components/CartSuggestionSection";
import { useCartStore } from "./hooks/useCartStore";
import { useCartQuery, useRemoveFromCart } from "./api/cart.hooks";
import { useCreatePayment } from "@/features/payment/api/payment.hooks";

const CART_ITEMS_PER_PAGE = 5;

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
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(1);

  const { data: cartItems, isLoading } = useCartQuery();
  const removeFromCartMutation = useRemoveFromCart();
  const createPayment = useCreatePayment();

  const items = cartItems ?? store.items;
  const inCartItems = items;
  const totalPages = Math.max(1, Math.ceil(inCartItems.length / CART_ITEMS_PER_PAGE));
  const visibleItems = useMemo(
    () =>
      inCartItems.slice(
        (page - 1) * CART_ITEMS_PER_PAGE,
        page * CART_ITEMS_PER_PAGE,
      ),
    [inCartItems, page],
  );
  const selectedItems = useMemo(
    () => inCartItems.filter((item) => selectedCourseIds.has(item.courseId)),
    [inCartItems, selectedCourseIds],
  );
  const selectedCount = selectedItems.length;
  const allVisibleSelected =
    visibleItems.length > 0 &&
    visibleItems.every((item) => selectedCourseIds.has(item.courseId));
  const cartIdsKey = inCartItems.map((item) => item.courseId).join(",");

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    const cartIds = inCartItems.map((item) => item.courseId);
    setSelectedCourseIds((previous) => {
      if (cartIds.length === 0) return new Set();

      const next = new Set<number>();
      const stillSelected = cartIds.filter((id) => previous.has(id));
      const newIds = cartIds.filter((id) => !previous.has(id));

      for (const id of stillSelected) next.add(id);
      for (const id of newIds) next.add(id);

      return next;
    });
  }, [cartIdsKey, inCartItems]);

  const markRemoving = (courseIds: number[], removing: boolean) => {
    setRemovingIds((prev) => {
      const next = new Set(prev);
      for (const id of courseIds) {
        if (removing) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  };

  const handleRemove = async (courseId: number) => {
    markRemoving([courseId], true);
    try {
      await removeFromCartMutation.mutateAsync(courseId);
      store.removeItem(courseId);
      setSelectedCourseIds((prev) => {
        const next = new Set(prev);
        next.delete(courseId);
        return next;
      });
      toast.success("Đã xóa khóa học khỏi giỏ.");
    } catch {
      toast.error("Không thể xóa khóa học. Vui lòng thử lại.");
    } finally {
      markRemoving([courseId], false);
    }
  };

  const toggleSelected = (courseId: number, selected: boolean) => {
    setSelectedCourseIds((prev) => {
      const next = new Set(prev);
      if (selected) next.add(courseId);
      else next.delete(courseId);
      return next;
    });
  };

  const toggleVisibleItems = (selected: boolean) => {
    setSelectedCourseIds((prev) => {
      const next = new Set(prev);
      for (const item of visibleItems) {
        if (selected) next.add(item.courseId);
        else next.delete(item.courseId);
      }
      return next;
    });
  };

  const handleRemoveSelected = async () => {
    const courseIds = selectedItems.map((item) => item.courseId);
    if (courseIds.length === 0) return;

    markRemoving(courseIds, true);
    try {
      const results = await Promise.allSettled(
        courseIds.map((courseId) => removeFromCartMutation.mutateAsync(courseId)),
      );
      const removedIds = courseIds.filter(
        (_, index) => results[index].status === "fulfilled",
      );

      for (const courseId of removedIds) {
        store.removeItem(courseId);
      }

      setSelectedCourseIds((prev) => {
        const next = new Set(prev);
        for (const courseId of removedIds) next.delete(courseId);
        return next;
      });

      if (removedIds.length === courseIds.length) {
        toast.success(`Đã xóa ${removedIds.length} khóa học khỏi giỏ.`);
      } else {
        toast.warning(
          `Đã xóa ${removedIds.length}/${courseIds.length} khóa học. Một vài khóa chưa xóa được.`,
        );
      }
    } catch {
      toast.error("Không thể xóa các khóa đã chọn. Vui lòng thử lại.");
    } finally {
      markRemoving(courseIds, false);
    }
  };

  const handleCheckout = () => {
    if (createPayment.isPending) return;
    const courseIds = selectedItems.map((item) => item.courseId);
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

  if (items.length === 0) {
    return <CartEmptyState />;
  }

  return (
    <div className="min-h-screen bg-background pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0">
      <AppPageHeader
        eyebrow="Thanh toán"
        title="Giỏ hàng của bạn"
        description={
          inCartItems.length > 0
            ? `${inCartItems.length} khóa học trong giỏ, ${selectedCount} khóa đang được chọn`
            : "Chua co khoa hoc nao trong gio."
        }
        icon={<ShoppingCart className="h-5 w-5" />}
      />

      <div className="container mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="flex gap-8">
          <div className="min-w-0 flex-1 space-y-6">
            <CartItemsSection
              allVisibleSelected={allVisibleSelected}
              items={visibleItems}
              page={page}
              totalPages={totalPages}
              totalItems={inCartItems.length}
              limit={CART_ITEMS_PER_PAGE}
              selectedCourseIds={selectedCourseIds}
              removingIds={removingIds}
              selectedCount={selectedCount}
              isRemovingSelected={removeFromCartMutation.isPending}
              onToggleVisible={toggleVisibleItems}
              onRemoveSelected={handleRemoveSelected}
              onPageChange={setPage}
              onToggleSelected={toggleSelected}
              onRemove={handleRemove}
            />

            <CartSuggestionSection withDivider limit={3} />
          </div>

          {inCartItems.length > 0 && (
            <div className="hidden w-96 shrink-0 lg:block">
              <div className="sticky top-24">
                <CartOrderSummary
                  items={selectedItems}
                  onCheckout={handleCheckout}
                  isCheckingOut={createPayment.isPending}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <CartMobileBottomBar
        items={selectedItems}
        onCheckout={handleCheckout}
        isCheckingOut={createPayment.isPending}
        selectedCount={selectedCount}
      />
    </div>
  );
}
