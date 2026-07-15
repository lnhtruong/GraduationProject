"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppEmptyState } from "@/features/_shared/components/AppEmptyState";
import { AppPageHeader } from "@/features/_shared/components/AppPageHeader";
import { CartSuggestionSection } from "./CartSuggestionSection";

export function CartEmptyState() {
  return (
    <div className="min-h-screen bg-background">
      <AppPageHeader
        eyebrow="Thanh toán"
        title="Giỏ hàng của bạn"
        description="Lưu các khóa học muốn mua vào đây trước khi thanh toán."
        icon={<ShoppingCart className="h-5 w-5" />}
      />
      <div className="container mx-auto max-w-7xl space-y-8 px-4 py-8 lg:px-8">
        <AppEmptyState
          icon={<ShoppingCart className="h-8 w-8" />}
          title="Giỏ hàng của bạn đang trống"
          description="Hãy thêm khóa học bạn muốn học vào đây để bắt đầu hành trình học tập."
          action={
            <Button variant="outline" asChild>
              <Link href="/courses/search">Khám phá khóa học</Link>
            </Button>
          }
        />
        <CartSuggestionSection withDivider limit={3} />
      </div>
    </div>
  );
}
