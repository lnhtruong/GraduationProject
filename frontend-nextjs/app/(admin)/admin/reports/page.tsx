"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const AdminReportsPage = dynamic(
  () => import("@/features/admin/components/reports/AdminReportsPage"),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    ),
  },
);

export default function AdminReportsRoute() {
  return <AdminReportsPage />;
}
