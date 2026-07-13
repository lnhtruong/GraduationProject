"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminMobileSidebar } from "./AdminMobileSidebar";
import { useAuthStore } from "@/store/auth";
import { ROLES } from "@/lib/roles";
import { PageLoader } from "@/components/PageLoader";
import { BrandLogo } from "@/components/BrandLogo";

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
    <div className="flex h-screen overflow-hidden bg-muted/10">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Topbar — chỉ hiển thị dưới lg, thay cho sidebar cố định */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border/60 bg-background px-4 lg:hidden">
          <AdminMobileSidebar />
          <BrandLogo compact badge="Admin" subtitle="" className="px-0 hover:bg-transparent" />
        </header>
        <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
