"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { useAuthStore } from "@/store/auth";
import { ROLES } from "@/lib/roles";
import { PageLoader } from "@/components/PageLoader";

interface Props {
  children: React.ReactNode;
}

export function AdminShell({ children }: Props) {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  useEffect(() => {
    if (user === null) {
      router.replace("/signin");
      return;
    }
    if (user.role !== ROLES.ADMIN) {
      router.replace("/unauthorized");
    }
  }, [user, router]);

  // user === null: chưa đăng nhập, đang redirect sang /signin
  if (user === null) {
    return <PageLoader className="min-h-screen" />;
  }

  // Không đủ quyền, đang redirect sang /unauthorized
  if (user.role !== ROLES.ADMIN) {
    return <PageLoader className="min-h-screen" />;
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
