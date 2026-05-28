"use client";

import { use } from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const CourseOverviewPage = dynamic(
  () => import("@/features/instructor/course-management/CourseOverviewPage"),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    ),
  },
);

interface Props {
  params: Promise<{ courseId: string }>;
}

export default function Page({ params }: Props) {
  const { courseId } = use(params);
  return <CourseOverviewPage courseId={Number(courseId)} />;
}
