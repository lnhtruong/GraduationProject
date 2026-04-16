"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/features/home/component/CourseCard";
import { useFeaturedCourses } from "@/features/home/api/home.hooks";

export function CartEmptyState() {
  // [MOCK] dùng useFeaturedCourses() — đã có sẵn, trả về mock data
  // [SWAP] Khi có API courses: hook này tự động dùng real data
  const { data: featuredCourses } = useFeaturedCourses();

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

      {/* Gợi ý khoá học */}
      {featuredCourses && featuredCourses.length > 0 && (
        <section className="mt-4 border-t border-border/40 pt-12">
          <h3 className="mb-6 text-center text-base font-semibold">
            Có thể bạn quan tâm
          </h3>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featuredCourses.slice(0, 3).map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
