"use client";

import { useState } from "react";
import { CheckCircle, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCartStore } from "../hooks/useCartStore";
import { cartApi } from "../api/cart.api";

// Toggle để bật/tắt feature coupon mà không cần xoá code
// [SWAP] Đổi thành true khi backend có bảng Coupons
const COUPON_ENABLED = false;

export function CartCouponInput() {
  const { couponCode, applyCoupon, clearCoupon } = useCartStore();
  const [inputCode, setInputCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Nếu feature chưa bật → không render
  if (!COUPON_ENABLED) {
    return null;
  }

  // Đã có coupon đang áp dụng
  if (couponCode) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-green-500/30 bg-green-500/8 px-3 py-2">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span className="text-xs font-medium text-green-600 dark:text-green-400">
            Đã áp dụng: <span className="font-bold">{couponCode}</span>
          </span>
        </div>
        <button
          onClick={clearCoupon}
          className="text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Xoá mã giảm giá"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  const handleApply = async () => {
    const code = inputCode.trim().toUpperCase();
    if (!code) return;

    setIsLoading(true);
    try {
      // [MOCK] cartApi.applyCoupon luôn trả về { valid: false } — no-op
      // [SWAP] Khi backend sẵn sàng: response sẽ có valid + discountAmount
      const result = await cartApi.applyCoupon(code);
      if (result.valid && result.discountAmount) {
        applyCoupon(code, result.discountAmount);
        setInputCode("");
        toast.success(`Áp dụng mã "${code}" thành công!`);
      } else {
        toast.error(result.message ?? "Mã không hợp lệ.");
      }
    } catch {
      toast.error("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Input
        placeholder="Nhập mã giảm giá..."
        className="h-10 flex-1 text-sm focus-visible:ring-primary"
        value={inputCode}
        onChange={(e) => setInputCode(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleApply()}
        disabled={isLoading}
      />
      <Button
        size="sm"
        className="h-10 shrink-0 bg-primary px-4 text-primary-foreground hover:bg-primary/90"
        onClick={handleApply}
        disabled={isLoading || !inputCode.trim()}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          "Áp dụng"
        )}
      </Button>
    </div>
  );
}
