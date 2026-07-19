"use client";

import { ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CartItemCard } from "./CartItemCard";
import { CartPagination } from "./CartPagination";
import type { CartItem } from "../types";

interface CartItemsSectionProps {
  allVisibleSelected: boolean;
  items: CartItem[];
  page: number;
  totalPages: number;
  totalItems: number;
  limit: number;
  selectedCourseIds: Set<number>;
  removingIds: Set<number>;
  selectedCount: number;
  isRemovingSelected?: boolean;
  onToggleVisible: (selected: boolean) => void;
  onRemoveSelected: () => void;
  onPageChange: (page: number) => void;
  onToggleSelected: (courseId: number, selected: boolean) => void;
  onRemove: (courseId: number) => void;
}

export function CartItemsSection({
  allVisibleSelected,
  items,
  page,
  totalPages,
  totalItems,
  limit,
  selectedCourseIds,
  removingIds,
  selectedCount,
  isRemovingSelected = false,
  onToggleVisible,
  onRemoveSelected,
  onPageChange,
  onToggleSelected,
  onRemove,
}: CartItemsSectionProps) {
  if (totalItems === 0) {
    return (
      <Card className="rounded-lg border-dashed border-border/70 py-0">
        <CardContent className="flex flex-col items-center gap-3 px-4 py-10 text-center">
          <ShoppingCart className="h-9 w-9 text-muted-foreground" />
          <div>
            <p className="font-semibold">Chưa có khóa học nào trong giỏ</p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Hay them khoa hoc ban muon hoc de thanh toan tai day.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="flex rounded-lg border border-border/60 bg-background px-4 py-3">
        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <Checkbox
              checked={allVisibleSelected}
              onCheckedChange={(checked) => onToggleVisible(checked === true)}
              aria-label="Chọn các khóa đang hiển thị"
            />
            Chọn tất cả khóa đang hiển thị
          </label>
          {selectedCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={onRemoveSelected}
              disabled={isRemovingSelected}
            >
              <Trash2 className="h-4 w-4" />
              Xóa đã chọn
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <CartItemCard
            key={item.id}
            item={item}
            onRemove={onRemove}
            onToggleSelected={onToggleSelected}
            isRemoving={removingIds.has(item.courseId)}
            isSelected={selectedCourseIds.has(item.courseId)}
          />
        ))}
      </div>

      <CartPagination
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        limit={limit}
        onPageChange={onPageChange}
      />
    </>
  );
}
