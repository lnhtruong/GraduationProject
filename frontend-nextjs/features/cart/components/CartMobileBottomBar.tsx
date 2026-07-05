"use client";

import { Button } from "@/components/ui/button";
import { formatPrice } from "@/features/courses/utils";
import type { CartItem } from "../types";

interface CartMobileBottomBarProps {
  items: CartItem[]; // chỉ in-cart items
  onCheckout?: () => void;
}

export function CartMobileBottomBar({ items, onCheckout }: CartMobileBottomBarProps) {
  const total = items.reduce((sum, i) => sum + i.price, 0);

  // Không render nếu không có item
  if (items.length === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-border/60 bg-background/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-sm lg:hidden">
      <div className="flex flex-col">
        <span className="text-base font-extrabold text-foreground">
          {formatPrice(total)}
        </span>
      </div>
      <Button
        size="lg"
        className="flex-1 bg-accent text-accent-foreground shadow-md shadow-accent/25 hover:bg-accent/90 active:scale-[0.98]"
        onClick={onCheckout}
      >
        Thanh toán ngay
      </Button>
    </div>
  );
}
