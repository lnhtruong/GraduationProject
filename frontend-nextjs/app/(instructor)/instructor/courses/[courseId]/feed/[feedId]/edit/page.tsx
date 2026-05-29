"use client";

import { use } from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const CourseFeedEditPage = dynamic(
  () => import("@/features/instructor/course-management/CourseFeedEditPage"),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    ),
  },
);

interface Props {
  params: Promise<{ courseId: string; feedId: string }>;
}

export default function Page({ params }: Props) {
  const { courseId, feedId } = use(params);
  return (
    <CourseFeedEditPage courseId={Number(courseId)} feedId={Number(feedId)} />
  );
}
