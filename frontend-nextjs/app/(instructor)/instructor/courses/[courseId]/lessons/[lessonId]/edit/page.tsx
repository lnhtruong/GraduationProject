"use client";

import { use } from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const LessonFormPage = dynamic(
  () => import("@/features/instructor/course-management/LessonFormPage"),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    ),
  },
);

interface Props {
  params: Promise<{ courseId: string; lessonId: string }>;
}

export default function Page({ params }: Props) {
  const { courseId, lessonId } = use(params);
  return (
    <LessonFormPage courseId={Number(courseId)} lessonId={Number(lessonId)} />
  );
}
