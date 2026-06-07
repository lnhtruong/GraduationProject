"use client";

import { useCourseCategories } from "../api/courseSearch.hooks";
import { useQueryParams } from "@/hooks/useQueryParams";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Star, SlidersHorizontal } from "lucide-react";
import { useState, useEffect } from "react";

interface FilterSidebarProps {
  isMobileTrigger?: boolean;
}

export function FilterSidebar({ isMobileTrigger = false }: FilterSidebarProps) {
  const { data: categories = [], isLoading: isLoadingCategories } =
    useCourseCategories();
  const { params, setQueryParams, clearFilters } = useQueryParams();
  const [isOpen, setIsOpen] = useState(false);

  // Active filter count
  const activeFiltersCount =
    params.categoryIds.length +
    (params.level && params.level !== "all" ? 1 : 0) +
    (params.minPrice > 0 || params.maxPrice < 5000000 ? 1 : 0) +
    (params.minRating > 0 ? 1 : 0);

  // Local state for mobile drawer
  const [localCategoryIds, setLocalCategoryIds] = useState<number[]>([]);
  const [localLevel, setLocalLevel] = useState<string>("all");
  const [localRating, setLocalRating] = useState<number>(0);
  const [localPriceRange, setLocalPriceRange] = useState<[number, number]>([
    0, 5000000,
  ]);

  // Sync local state when mobile drawer opens
  useEffect(() => {
    if (isMobileTrigger && isOpen) {
      setLocalCategoryIds(params.categoryIds);
      setLocalLevel(params.level || "all");
      setLocalRating(params.minRating || 0);
      setLocalPriceRange([params.minPrice, params.maxPrice]);
    }
  }, [isOpen, params, isMobileTrigger]);

  // Sync local price range for desktop when URL params change
  useEffect(() => {
    if (!isMobileTrigger) {
      setLocalPriceRange([params.minPrice, params.maxPrice]);
    }
  }, [params.minPrice, params.maxPrice, isMobileTrigger]);

  const handleCategoryChange = (categoryId: number, checked: boolean) => {
    if (isMobileTrigger) {
      setLocalCategoryIds((prev) =>
        checked
          ? [...prev, categoryId]
          : prev.filter((id) => id !== categoryId),
      );
    } else {
      const nextCategories = checked
        ? [...params.categoryIds, categoryId]
        : params.categoryIds.filter((id) => id !== categoryId);
      setQueryParams({ categoryIds: nextCategories, page: 1 });
    }
  };

  const handleLevelChange = (level: string) => {
    if (isMobileTrigger) {
      setLocalLevel(level);
    } else {
      setQueryParams({ level: level === "all" ? undefined : level, page: 1 });
    }
  };

  const handlePriceRangeChange = (values: number[]) => {
    if (values.length === 2) {
      setLocalPriceRange(values as [number, number]);
    }
  };

  const handlePriceRangeCommit = (values: number[]) => {
    if (!isMobileTrigger && values.length === 2) {
      setQueryParams({ minPrice: values[0], maxPrice: values[1], page: 1 });
    }
  };

  const handleRatingChange = (rating: number) => {
    if (isMobileTrigger) {
      setLocalRating((prev) => (prev === rating ? 0 : rating));
    } else {
      const nextRating = params.minRating === rating ? undefined : rating;
      setQueryParams({ minRating: nextRating, page: 1 });
    }
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

  const formatFullPrice = (price: number) => {
    return price.toLocaleString("vi-VN") + " đ";
  };

  // Render the core filter forms
  const renderFilters = () => {
    const selectedCategoryIds = isMobileTrigger
      ? localCategoryIds
      : params.categoryIds;
    const selectedLevel = isMobileTrigger ? localLevel : params.level || "all";
    const selectedRating = isMobileTrigger ? localRating : params.minRating;

    return (
      <Accordion
        type="multiple"
        defaultValue={["categories", "level", "price", "rating"]}
        className="w-full"
      >
        {/* Category Filter */}
        <AccordionItem
          value="categories"
          className="border-b border-border/40 py-1"
        >
          <AccordionTrigger className="py-2.5 hover:no-underline font-semibold text-sm text-foreground hover:text-primary transition-colors">
            Danh mục
          </AccordionTrigger>
          <AccordionContent className="pt-1 pb-3">
            {isLoadingCategories ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-5 w-full animate-pulse rounded bg-muted"
                  />
                ))}
              </div>
            ) : (
              <ScrollArea className="h-52 pr-2">
                <div className="flex flex-col gap-2.5">
                  {categories.map((category) => {
                    const isChecked = selectedCategoryIds.includes(category.id);
                    return (
                      <div
                        key={category.id}
                        className="flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`cat-${category.id}-${isMobileTrigger ? "mobile" : "desktop"}`}
                            checked={isChecked}
                            onCheckedChange={(checked) =>
                              handleCategoryChange(category.id, !!checked)
                            }
                          />
                          <label
                            htmlFor={`cat-${category.id}-${isMobileTrigger ? "mobile" : "desktop"}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {category.name}
                          </label>
                        </div>
                        <Badge
                          variant="secondary"
                          className="bg-muted text-muted-foreground hover:bg-muted/80 text-[10px] px-1.5 h-5 font-normal"
                        >
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

        {/* Level Filter */}
        <AccordionItem value="level" className="border-b border-border/40 py-1">
          <AccordionTrigger className="py-2.5 hover:no-underline font-semibold text-sm text-foreground hover:text-primary transition-colors">
            Trình độ
          </AccordionTrigger>
          <AccordionContent className="pt-1 pb-3">
            <RadioGroup
              value={selectedLevel}
              onValueChange={handleLevelChange}
              className="flex flex-col gap-2.5"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value="all"
                  id={`level-all-${isMobileTrigger ? "mobile" : "desktop"}`}
                />
                <Label
                  htmlFor={`level-all-${isMobileTrigger ? "mobile" : "desktop"}`}
                  className="cursor-pointer font-normal text-sm"
                >
                  Tất cả trình độ
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value="Beginner"
                  id={`level-beginner-${isMobileTrigger ? "mobile" : "desktop"}`}
                />
                <Label
                  htmlFor={`level-beginner-${isMobileTrigger ? "mobile" : "desktop"}`}
                  className="cursor-pointer font-normal text-sm"
                >
                  Beginner
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value="Intermediate"
                  id={`level-intermediate-${isMobileTrigger ? "mobile" : "desktop"}`}
                />
                <Label
                  htmlFor={`level-intermediate-${isMobileTrigger ? "mobile" : "desktop"}`}
                  className="cursor-pointer font-normal text-sm"
                >
                  Intermediate
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value="Advanced"
                  id={`level-advanced-${isMobileTrigger ? "mobile" : "desktop"}`}
                />
                <Label
                  htmlFor={`level-advanced-${isMobileTrigger ? "mobile" : "desktop"}`}
                  className="cursor-pointer font-normal text-sm"
                >
                  Advanced
                </Label>
              </div>
            </RadioGroup>
          </AccordionContent>
        </AccordionItem>

        {/* Price Filter */}
        <AccordionItem value="price" className="border-b border-border/40 py-1">
          <AccordionTrigger className="py-2.5 hover:no-underline font-semibold text-sm text-foreground hover:text-primary transition-colors">
            Khoảng giá
          </AccordionTrigger>
          <AccordionContent className="pt-1 pb-3">
            <div className="px-1 pt-2">
              <Slider
                min={0}
                max={5000000}
                step={100000}
                value={localPriceRange}
                onValueChange={handlePriceRangeChange}
                onValueCommit={handlePriceRangeCommit}
                className="mb-4"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                <span>Min: {formatFullPrice(localPriceRange[0])}</span>
                <span>Max: {formatFullPrice(localPriceRange[1])}</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Rating Filter */}
        <AccordionItem value="rating" className="border-b-0 py-1">
          <AccordionTrigger className="py-2.5 hover:no-underline font-semibold text-sm text-foreground hover:text-primary transition-colors">
            Đánh giá tối thiểu
          </AccordionTrigger>
          <AccordionContent className="pt-1 pb-1">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => {
                  const starValue = i + 1;
                  const isFilled = starValue <= selectedRating;
                  return (
                    <button
                      key={starValue}
                      type="button"
                      onClick={() => handleRatingChange(starValue)}
                      className="p-1 rounded hover:bg-muted/80 transition-colors"
                      aria-label={`Đánh giá tối thiểu ${starValue} sao`}
                    >
                      <Star
                        className={`h-5 w-5 transition-all ${
                          isFilled
                            ? "fill-primary text-primary scale-105"
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
  };

  // If this is rendered as the mobile trigger button and drawer
  if (isMobileTrigger) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            className="flex items-center justify-center gap-2 w-full h-10 font-bold shadow-sm rounded-xl border-border/80"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Bộ lọc{" "}
            {activeFiltersCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-primary text-primary-foreground font-bold">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-[85vw] max-w-[360px] flex flex-col h-full p-6"
        >
          <SheetHeader className="mb-4 shrink-0">
            <SheetTitle className="text-left font-extrabold text-lg flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-primary" />
              Bộ lọc khóa học
            </SheetTitle>
          </SheetHeader>

          {/* Scrollable filters section */}
          <div className="flex-1 overflow-y-auto pr-1 pb-4">
            {renderFilters()}
          </div>

          {/* Sticky Actions inside mobile drawer */}
          <div className="mt-auto pt-4 border-t border-border/60 flex gap-3 shrink-0">
            <Button
              variant="outline"
              onClick={handleClearMobileFilters}
              className="flex-1 border-dashed hover:border-destructive hover:text-destructive hover:bg-destructive/5"
            >
              Xóa tất cả
            </Button>
            <Button
              onClick={handleApplyMobileFilters}
              className="flex-1 shadow-sm bg-primary text-primary-foreground"
            >
              Áp dụng
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop sidebar container
  return (
    <aside className="sticky top-20 hidden md:block w-64 shrink-0 h-fit rounded-xl border border-border/60 bg-card p-5 shadow-sm">
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
            className="h-7 px-2 text-xs font-semibold text-destructive hover:bg-destructive/5 hover:text-destructive rounded-md"
          >
            Xóa tất cả
          </Button>
        )}
      </div>

      <div className="pt-2">{renderFilters()}</div>
    </aside>
  );
}
