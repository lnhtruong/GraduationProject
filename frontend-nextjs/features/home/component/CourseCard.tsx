import Link from "next/link";
import Image from "next/image";
import { GraduationCap, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { FeaturedCourse } from "../types";

interface CourseCardProps {
  course: FeaturedCourse;
}

export function CourseCard({ course }: CourseCardProps) {
  return (
    <Link href={`/courses/${course.id}`}>
      <Card className="group overflow-hidden border-border/60 hover:border-primary/40 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 cursor-pointer h-full">
        <div className="relative aspect-video overflow-hidden bg-muted">
          <Image
            src={course.thumbnail}
            alt={course.title}
            fill
            unoptimized
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <span className="absolute top-2 left-2 text-xs font-semibold px-2.5 py-1 rounded-full bg-primary text-primary-foreground">
            {course.category}
          </span>
        </div>

        <CardContent className="p-4 flex flex-col gap-2">
          <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {course.title}
          </h3>

          <div className="flex items-center gap-1.5">
            {course.instructorAvatar ? (
              <Image
                src={course.instructorAvatar}
                alt={course.instructor}
                width={20}
                height={20}
                unoptimized
                className="w-5 h-5 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
                <GraduationCap className="h-3 w-3 text-muted-foreground" />
              </div>
            )}
            <span className="text-xs text-muted-foreground truncate">
              {course.instructor}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3.5 w-3.5 text-primary fill-primary" />
              <span className="font-medium text-foreground">
                {course.rating}
              </span>
              <span>({course.reviewCount.toLocaleString()})</span>
            </span>
            {course.price !== null ? (
              <span className="text-sm font-bold text-foreground">
                {course.price.toLocaleString()}đ
              </span>
            ) : (
              <span className="text-sm font-bold text-primary">Miễn phí</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
