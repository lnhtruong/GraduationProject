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
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    ),
  },
);

export default function Page() {
  return <AdminRevenuePage />;
}
