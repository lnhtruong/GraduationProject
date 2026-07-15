"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/features/courses/utils";
import type { CartItem } from "../types";

interface CartOrderSummaryProps {
  items: CartItem[];
  onCheckout?: () => void;
  isCheckingOut?: boolean;
}

export function CartOrderSummary({
  items,
  onCheckout,
  isCheckingOut,
}: CartOrderSummaryProps) {
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const itemCount = items.length;

  return (
    <Card className="gap-0 rounded-lg border-border/60 py-0">
      <CardHeader className="px-6 py-5">
        <CardTitle className="text-base">Tóm tắt đơn hàng</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 px-6 pb-6">
        <div className="space-y-2.5 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              Tổng phụ ({itemCount} khóa học)
            </span>
            <span className="font-medium">{formatPrice(subtotal)}</span>
          </div>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <span className="text-base font-bold">Tổng cộng</span>
          <span className="text-[17px] font-extrabold">
            {formatPrice(subtotal)}
          </span>
        </div>

        <Button
          size="lg"
          className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
          onClick={onCheckout}
          disabled={itemCount === 0 || isCheckingOut}
        >
          {isCheckingOut
            ? "Đang xử lý..."
            : `Thanh toán ngay (${itemCount} khóa học)`}
        </Button>

        <Button
          variant="ghost"
          className="w-full text-sm text-muted-foreground hover:text-foreground"
          asChild
        >
          <Link href="/courses/search">Tiếp tục mua sắm</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
