"use client";

import { CreditCard, Loader2, ShieldCheck } from "lucide-react";
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
    <Card className="gap-0 overflow-hidden rounded-lg border-border/60 py-0 shadow-sm">
      <CardHeader className="border-b border-border/50 bg-muted/20 px-6 py-5">
        <CardTitle className="flex items-center gap-2 text-base">
          <CreditCard className="h-4 w-4 text-primary" />
          Tóm tắt đơn hàng
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 px-6 pb-6">
        <div className="space-y-2.5 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              Tổng phụ ({itemCount} khóa học)
            </span>
            <span className="font-medium">{formatPrice(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Phí thanh toán</span>
            <span className="font-medium text-emerald-600">0 đ</span>
          </div>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <span className="text-base font-bold">Cần thanh toán</span>
          <span className="text-xl font-extrabold tabular-nums">
            {formatPrice(subtotal)}
          </span>
        </div>

        <Button
          size="lg"
          className="w-full bg-accent text-accent-foreground shadow-md shadow-accent/20 hover:bg-accent/90"
          onClick={onCheckout}
          disabled={itemCount === 0 || isCheckingOut}
        >
          {isCheckingOut ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang tạo đơn...
            </>
          ) : (
            `Thanh toán ngay (${itemCount} khóa học)`
          )}
        </Button>

        <div className="flex gap-2 rounded-md border border-border/60 bg-muted/25 p-3 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <p>
            Thanh toán qua cổng bảo mật. Sau khi giao dịch thành công, khóa học
            sẽ tự động xuất hiện trong mục học tập của bạn.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
