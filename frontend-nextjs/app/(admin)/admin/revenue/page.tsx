"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const AdminRevenuePage = dynamic(
  () => import("@/features/admin/components/revenue/AdminRevenuePage"),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    ),
  },
);

export default function RevenuePage() {
  return <AdminRevenuePage />;
}
