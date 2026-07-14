import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { GraduationCap, Star, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CourseCardData } from "@/features/_shared/course-card.types";
import { WishlistButton } from "@/features/wishlist/components/WishlistButton";

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

interface CourseCardProps {
  course: CourseCardData;
}

export function CourseCard({ course }: CourseCardProps) {
  const [imageError, setImageError] = useState(false);

  const avgRating =
    typeof course.avgRating === "number"
      ? course.avgRating
      : Number(course.avgRating);
  const reviewCount =
    typeof course.reviewCount === "number"
      ? course.reviewCount
      : Number(course.reviewCount);
  const enrolledCount =
    typeof course.enrolledCount === "number"
      ? course.enrolledCount
      : Number(course.enrolledCount);

  return (
    <motion.div className="group relative sm:h-full" variants={itemVariants}>
      {/* WishlistButton nằm ngoài Link để tránh nested interactive elements */}
      <WishlistButton
        courseId={course.id}
        className="absolute right-2 top-2 z-10 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
      />

      <Link href={`/courses/${course.id}`} className="block sm:h-full">
      <Card className="p-0 gap-0 sm:h-full cursor-pointer overflow-hidden border-border/60 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden bg-muted">
          {course.thumbnailUrl && !imageError ? (
            <Image
              src={course.thumbnailUrl}
              alt={course.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-primary/10 to-accent/5">
              <GraduationCap className="h-10 w-10 text-primary/45" />
            </div>
          )}
          {course.category && (
            <Badge className="absolute left-2 top-2 bg-primary text-primary-foreground text-xs font-semibold">
              {course.category}
            </Badge>
          )}
        </div>

        <CardContent className="flex flex-col gap-2 p-3.5 pt-2.5">
          {/* Title */}
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground/90 transition-colors group-hover:text-primary">
            {course.title}
          </h3>

          {/* Instructor */}
          <div className="flex items-center gap-1.5">
            {course.instructorAvatar ? (
              <Image
                src={course.instructorAvatar}
                alt={course.instructorName ?? "Giảng viên"}
                width={20}
                height={20}
                unoptimized
                className="h-5 w-5 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border bg-muted">
                <GraduationCap className="h-3 w-3 text-muted-foreground" />
              </div>
            )}
            <span className="truncate text-xs text-muted-foreground">
              {course.instructorName ?? "Giảng viên"}
            </span>
          </div>

          {/* Stats + Price */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3">
              {/* Rating — chỉ hiện khi có data thật */}
              {Number.isFinite(avgRating) && avgRating > 0 && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                  <span className="font-semibold text-foreground">
                    {avgRating.toFixed(1)}
                  </span>
                  {Number.isFinite(reviewCount) && reviewCount > 0 && (
                    <span>({reviewCount.toLocaleString()})</span>
                  )}
                </span>
              )}

              {/* Enrolled — chỉ hiện khi có data thật */}
              {Number.isFinite(enrolledCount) && enrolledCount > 0 && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  <span>{enrolledCount.toLocaleString()}</span>
                </span>
              )}
            </div>

            {/* Price */}
            {course.price !== null ? (
              <span className="text-base font-extrabold text-foreground">
                {course.price.toLocaleString()}đ
              </span>
            ) : (
              <span className="text-base font-extrabold text-primary">Miễn phí</span>
            )}
          </div>
        </CardContent>
      </Card>
      </Link>
    </motion.div>
  );
}
