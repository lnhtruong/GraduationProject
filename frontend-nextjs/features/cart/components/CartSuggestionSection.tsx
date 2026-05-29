"use client";

import { CourseCard } from "@/features/home/component/CourseCard";
import { useCartSuggestions } from "../api/cart-suggestion.hooks";

function SuggestionCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl border border-border/60 bg-card">
      <div className="aspect-video w-full bg-muted" />
      <div className="space-y-2.5 p-4">
        <div className="h-4 w-3/4 rounded bg-muted" />
        <div className="h-3 w-1/2 rounded bg-muted" />
        <div className="flex items-center justify-between pt-1">
          <div className="h-3 w-16 rounded bg-muted" />
          <div className="h-4 w-20 rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}

interface CartSuggestionSectionProps {
  title?: string;
  limit?: number;
  withDivider?: boolean;
}

export function CartSuggestionSection({
  title = "Có thể bạn quan tâm",
  limit = 6,
  withDivider = false,
}: CartSuggestionSectionProps) {
  const { data: courses, isLoading } = useCartSuggestions(limit);

  if (!isLoading && (!courses || courses.length === 0)) return null;

  return (
    <section className={withDivider ? "border-t border-border/40 pt-12" : undefined}>
      <h3 className="mb-6 text-center text-base font-semibold">{title}</h3>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: Math.min(limit, 3) }).map((_, i) => (
              <SuggestionCardSkeleton key={i} />
            ))
          : courses!.slice(0, limit).map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
      </div>
    </section>
  );
}
