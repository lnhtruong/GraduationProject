"use client";

import { ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { formatPrice } from "@/features/courses/utils";
import type { CartItem } from "../types";
import { CartOrderSummary } from "./CartOrderSummary";

interface CartMobileBottomBarProps {
  items: CartItem[];
  onCheckout?: () => void;
  isCheckingOut?: boolean;
  selectedCount?: number;
}

export function CartMobileBottomBar({
  items,
  onCheckout,
  isCheckingOut,
  selectedCount,
}: CartMobileBottomBarProps) {
  const total = items.reduce((sum, i) => sum + i.price, 0);
  const count = selectedCount ?? items.length;

  if (items.length === 0) return null;

  return (
    <Sheet>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-sm lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <span className="block text-[11px] text-muted-foreground">
              {count} khóa đã chọn
            </span>
            <span className="block truncate text-base font-extrabold text-foreground">
              {formatPrice(total)}
            </span>
          </div>
          <SheetTrigger asChild>
            <Button
              type="button"
              size="lg"
              className="min-w-[148px] bg-accent text-accent-foreground shadow-md shadow-accent/25 hover:bg-accent/90 active:scale-[0.98]"
            >
              <ReceiptText className="h-4 w-4" />
              Xem đơn hàng
            </Button>
          </SheetTrigger>
        </div>
      </div>

      <SheetContent
        side="bottom"
        className="max-h-[88vh] overflow-y-auto rounded-t-xl p-0 lg:hidden"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Tóm tắt đơn hàng</SheetTitle>
        </SheetHeader>
        <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <CartOrderSummary
            items={items}
            onCheckout={onCheckout}
            isCheckingOut={isCheckingOut}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
