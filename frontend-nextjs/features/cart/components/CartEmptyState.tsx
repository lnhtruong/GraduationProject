"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartSuggestionSection } from "./CartSuggestionSection";

export function CartEmptyState() {
  return (
    <div className="container mx-auto max-w-7xl px-4 lg:px-8 py-8">
      {/* Empty illustration */}
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
          <ShoppingCart className="h-12 w-12 text-muted-foreground/40" />
        </div>
        <h2 className="mb-2 text-xl font-bold">Giỏ hàng của bạn đang trống</h2>
        <p className="mb-8 max-w-sm text-sm text-muted-foreground">
          Hãy thêm khoá học bạn muốn học vào đây để bắt đầu hành trình học tập.
        </p>
        <Button
          variant="outline"
          className="border-primary/40 text-primary hover:bg-primary/5"
          asChild
        >
          <Link href="/courses">Khám phá khoá học</Link>
        </Button>
      </div>

      <CartSuggestionSection withDivider limit={3} />
    </div>
  );
}
