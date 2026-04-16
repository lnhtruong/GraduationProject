"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/features/courses/utils";
import { CartCouponInput } from "./CartCouponInput";
import { useCartStore } from "../hooks/useCartStore";
import type { CartItem } from "../types";

interface CartOrderSummaryProps {
  items: CartItem[]; // chỉ in-cart items (không tính saved)
  onCheckout?: () => void;
}

export function CartOrderSummary({ items, onCheckout }: CartOrderSummaryProps) {
  const { discountAmount, couponCode } = useCartStore();

  // [MOCK] tính từ local items — [SWAP] lấy từ useCartSummary() khi có backend
  const subtotal = items.reduce((sum, i) => sum + i.price, 0);
  const total = Math.max(0, subtotal - discountAmount);
  const itemCount = items.length;

  return (
    <div className="rounded-xl border border-border/60 bg-card p-6 shadow-[0_8px_40px_rgba(0,0,0,0.13)] space-y-4">
      <h2 className="text-base font-bold">Tóm tắt đơn hàng</h2>

      {/* Price rows */}
      <div className="space-y-2.5 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">
            Tổng phụ ({itemCount} khoá học)
          </span>
          <span className="font-medium">{formatPrice(subtotal)}</span>
        </div>

        {discountAmount > 0 && couponCode && (
          <div className="flex items-center justify-between text-green-600 dark:text-green-400">
            <span>Giảm giá ({couponCode})</span>
            <span className="font-medium">−{formatPrice(discountAmount)}</span>
          </div>
        )}
      </div>

      <Separator />

      {/* Total */}
      <div className="flex items-center justify-between">
        <span className="text-base font-bold">Tổng cộng</span>
        <span className="text-[17px] font-extrabold">{formatPrice(total)}</span>
      </div>

      {/* Coupon input — tự ẩn nếu COUPON_ENABLED=false */}
      <CartCouponInput />

      {/* CTA */}
      <Button
        size="lg"
        className="w-full bg-accent text-accent-foreground shadow-md shadow-accent/25 hover:bg-accent/90 active:scale-[0.98]"
        onClick={onCheckout}
        disabled={itemCount === 0}
      >
        Thanh toán ngay ({itemCount} khoá học)
      </Button>

      {/* Tiếp tục mua sắm */}
      <Button
        variant="ghost"
        className="w-full text-sm text-muted-foreground hover:text-foreground"
        asChild
      >
        <Link href="/courses">Tiếp tục mua sắm</Link>
      </Button>

      {/* Trust badge */}
      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
        <Lock className="h-3 w-3 shrink-0" />
        Đảm bảo hoàn tiền trong 30 ngày
      </p>
    </div>
  );
}
