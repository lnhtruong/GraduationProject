"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const RoadmapCreatePage = dynamic(
  () => import("@/features/instructor/roadmap-management/RoadmapCreate"),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    ),
  },
);

export default function Page() {
  return <RoadmapCreatePage />;
}
