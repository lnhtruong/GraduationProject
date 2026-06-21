"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const AdminLecturerRequestsPage = dynamic(
  () =>
    import(
      "@/features/lecturer-requests/components/admin/AdminLecturerRequestsPage"
    ),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    ),
  },
);

export default function AdminLecturerRequestsRoute() {
  return <AdminLecturerRequestsPage />;
}
