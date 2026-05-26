"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const CoursesPage = dynamic(
  () => import("@/features/instructor/components/courses/CoursesPage"),
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

export default function Page() {
  return <CoursesPage />;
}
