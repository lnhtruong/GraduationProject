"use client";

import { use } from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const RoadmapDetailPage = dynamic(
  () => import("@/features/instructor/roadmap-management/RoadmapDetail"),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    ),
  },
);

interface Props {
  params: Promise<{ roadmapId: string }>;
}

export default function Page({ params }: Props) {
  const { roadmapId } = use(params);
  return <RoadmapDetailPage roadmapId={Number(roadmapId)} />;
}
