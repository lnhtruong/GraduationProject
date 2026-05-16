"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { useAuthStore } from "@/store/auth";
import { ROLES } from "@/lib/roles";

interface Props {
  children: React.ReactNode;
}

export function AdminShell({ children }: Props) {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  // Guard: chỉ ADMIN mới vào được
  useEffect(() => {
    if (user !== undefined && user?.role !== ROLES.ADMIN) {
      router.replace("/unauthorized");
    }
  }, [user, router]);

  if (user === undefined || user?.role !== ROLES.ADMIN) {
    // Chờ user load hoặc đang redirect
    return null;
  }

  return (
    <div className="flex min-h-screen bg-muted/10">
      <AdminSidebar />
      <main className="min-w-0 flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  );
}
