"use client";

import { useEffect, useState } from "react";
import { SlidersHorizontal, Star } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { useQueryParams } from "@/hooks/useQueryParams";
import { useCourseCategories } from "../api/courseSearch.hooks";
import type { CategorySummary } from "../api/courseSearch.api";

interface FilterSidebarProps {
  isMobileTrigger?: boolean;
  categories?: CategorySummary[];
  isLoadingCategories?: boolean;
}

const LEVEL_OPTIONS = [
  { value: "all", label: "Tất cả trình độ" },
  { value: "Beginner", label: "Cơ bản" },
  { value: "Intermediate", label: "Trung cấp" },
  { value: "Advanced", label: "Nâng cao" },
];

export function FilterSidebar({
  isMobileTrigger = false,
  categories: providedCategories,
  isLoadingCategories: providedLoadingCategories,
}: FilterSidebarProps) {
  const shouldFetchCategories = providedCategories === undefined;
  const categoriesQuery = useCourseCategories(shouldFetchCategories);
  const categories = providedCategories ?? categoriesQuery.data ?? [];
  const isLoadingCategories =
    providedLoadingCategories ?? categoriesQuery.isLoading;
  const { params, setQueryParams, clearFilters } = useQueryParams();
  const [isOpen, setIsOpen] = useState(false);

  const activeFiltersCount =
    params.categoryIds.length +
    (params.level && params.level !== "all" ? 1 : 0) +
    (params.minPrice > 0 || params.maxPrice < 5000000 ? 1 : 0) +
    (params.minRating > 0 ? 1 : 0);

  const [localCategoryIds, setLocalCategoryIds] = useState<number[]>([]);
  const [localLevel, setLocalLevel] = useState("all");
  const [localRating, setLocalRating] = useState(0);
  const [localPriceRange, setLocalPriceRange] = useState<[number, number]>([0, 5000000]);

  useEffect(() => {
    if (isMobileTrigger && isOpen) {
      setLocalCategoryIds(params.categoryIds);
      setLocalLevel(params.level || "all");
      setLocalRating(params.minRating || 0);
      setLocalPriceRange([params.minPrice, params.maxPrice]);
    }
  }, [isOpen, params, isMobileTrigger]);

  useEffect(() => {
    if (!isMobileTrigger) {
      setLocalPriceRange([params.minPrice, params.maxPrice]);
    }
  }, [params.minPrice, params.maxPrice, isMobileTrigger]);

  const selectedCategoryIds = isMobileTrigger ? localCategoryIds : params.categoryIds;
  const selectedLevel = isMobileTrigger ? localLevel : params.level || "all";
  const selectedRating = isMobileTrigger ? localRating : params.minRating;

  const formatFullPrice = (price: number) => `${price.toLocaleString("vi-VN")} đ`;

  const handleCategoryChange = (categoryId: number, checked: boolean) => {
    if (isMobileTrigger) {
      setLocalCategoryIds((prev) =>
        checked ? [...prev, categoryId] : prev.filter((id) => id !== categoryId),
      );
      return;
    }

    const nextCategories = checked
      ? [...params.categoryIds, categoryId]
      : params.categoryIds.filter((id) => id !== categoryId);
    setQueryParams({ categoryIds: nextCategories, page: 1 });
  };

  const handleLevelChange = (level: string) => {
    if (isMobileTrigger) {
      setLocalLevel(level);
      return;
    }
    setQueryParams({ level: level === "all" ? undefined : level, page: 1 });
  };

  const handlePriceRangeCommit = (values: number[]) => {
    if (!isMobileTrigger && values.length === 2) {
      setQueryParams({ minPrice: values[0], maxPrice: values[1], page: 1 });
    }
  };

  const handleRatingChange = (rating: number) => {
    if (isMobileTrigger) {
      setLocalRating((prev) => (prev === rating ? 0 : rating));
      return;
    }
    setQueryParams({
      minRating: params.minRating === rating ? undefined : rating,
      page: 1,
    });
  };

  const handleApplyMobileFilters = () => {
    setQueryParams({
      categoryIds: localCategoryIds,
      level: localLevel === "all" ? undefined : localLevel,
      minPrice: localPriceRange[0],
      maxPrice: localPriceRange[1],
      minRating: localRating > 0 ? localRating : undefined,
      page: 1,
    });
    setIsOpen(false);
  };

  const handleClearMobileFilters = () => {
    clearFilters();
    setIsOpen(false);
  };

  const renderFilters = () => (
    <Accordion
      type="multiple"
      defaultValue={["categories", "level", "price", "rating"]}
      className="w-full"
    >
      <AccordionItem value="categories" className="border-b border-border/40 py-1">
        <AccordionTrigger className="py-2.5 text-sm font-semibold hover:text-primary hover:no-underline">
          Danh mục
        </AccordionTrigger>
        <AccordionContent className="pb-3 pt-1">
          {isLoadingCategories ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-5 w-full animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : (
            <ScrollArea className="h-52 pr-2">
              <div className="flex flex-col gap-2.5">
                {categories.map((category) => {
                  const isChecked = selectedCategoryIds.includes(category.id);
                  const id = `cat-${category.id}-${isMobileTrigger ? "mobile" : "desktop"}`;
                  return (
                    <div key={category.id} className="flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={id}
                          checked={isChecked}
                          onCheckedChange={(checked) => handleCategoryChange(category.id, !!checked)}
                        />
                        <label htmlFor={id} className="cursor-pointer text-sm font-medium leading-none">
                          {category.name}
                        </label>
                      </div>
                      <Badge variant="secondary" className="h-5 bg-muted px-1.5 text-[10px] font-normal text-muted-foreground">
                        {category.courseCount}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="level" className="border-b border-border/40 py-1">
        <AccordionTrigger className="py-2.5 text-sm font-semibold hover:text-primary hover:no-underline">
          Trình độ
        </AccordionTrigger>
        <AccordionContent className="pb-3 pt-1">
          <RadioGroup value={selectedLevel} onValueChange={handleLevelChange} className="flex flex-col gap-2.5">
            {LEVEL_OPTIONS.map((option) => {
              const id = `level-${option.value}-${isMobileTrigger ? "mobile" : "desktop"}`;
              return (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={id} />
                  <Label htmlFor={id} className="cursor-pointer text-sm font-normal">
                    {option.label}
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="price" className="border-b border-border/40 py-1">
        <AccordionTrigger className="py-2.5 text-sm font-semibold hover:text-primary hover:no-underline">
          Khoảng giá
        </AccordionTrigger>
        <AccordionContent className="pb-3 pt-1">
          <div className="px-1 pt-2">
            <Slider
              min={0}
              max={5000000}
              step={100000}
              value={localPriceRange}
              onValueChange={(values) => {
                if (values.length === 2) setLocalPriceRange(values as [number, number]);
              }}
              onValueCommit={handlePriceRangeCommit}
              className="mb-4"
            />
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>Từ {formatFullPrice(localPriceRange[0])}</span>
              <span>Đến {formatFullPrice(localPriceRange[1])}</span>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="rating" className="border-b-0 py-1">
        <AccordionTrigger className="py-2.5 text-sm font-semibold hover:text-primary hover:no-underline">
          Đánh giá tối thiểu
        </AccordionTrigger>
        <AccordionContent className="pb-1 pt-1">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, index) => {
                const starValue = index + 1;
                const isFilled = starValue <= selectedRating;
                return (
                  <button
                    key={starValue}
                    type="button"
                    onClick={() => handleRatingChange(starValue)}
                    className="rounded p-1 transition-colors hover:bg-muted/80"
                    aria-label={`Đánh giá tối thiểu ${starValue} sao`}
                  >
                    <Star
                      className={`h-5 w-5 transition-all ${
                        isFilled
                          ? "fill-primary text-primary"
                          : "text-muted-foreground/45 hover:text-muted-foreground"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            {selectedRating > 0 && (
              <span className="text-xs font-semibold text-muted-foreground">
                Từ {selectedRating} sao trở lên
              </span>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );

  if (isMobileTrigger) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border-border/80 bg-background font-bold shadow-lg"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Bộ lọc
            {activeFiltersCount > 0 && (
              <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex h-full w-[85vw] max-w-[360px] flex-col p-6">
          <SheetHeader className="mb-4 shrink-0">
            <SheetTitle className="flex items-center gap-2 text-left text-lg font-extrabold">
              <SlidersHorizontal className="h-5 w-5 text-primary" />
              Bộ lọc khóa học
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto pb-4 pr-1">{renderFilters()}</div>

          <div className="mt-auto flex shrink-0 gap-3 border-t border-border/60 pt-4">
            <Button variant="outline" onClick={handleClearMobileFilters} className="flex-1 border-dashed">
              Xóa tất cả
            </Button>
            <Button onClick={handleApplyMobileFilters} className="flex-1">
              Áp dụng
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside className="sticky top-20 hidden h-fit w-64 shrink-0 rounded-xl border border-border/60 bg-card p-5 shadow-sm md:block">
      <div className="mb-4 flex items-center justify-between font-bold text-foreground">
        <div className="flex items-center gap-1.5">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold">Bộ lọc</h2>
          {activeFiltersCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary/10 px-1 text-[10px] font-bold text-primary">
              {activeFiltersCount}
            </span>
          )}
        </div>
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-7 rounded-md px-2 text-xs font-semibold text-destructive hover:bg-destructive/5 hover:text-destructive"
          >
            Xóa
          </Button>
        )}
      </div>

      <div className="pt-2">{renderFilters()}</div>
    </aside>
  );
}
