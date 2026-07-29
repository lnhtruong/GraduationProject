"use client";

import type { ReactNode } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { getRoleAccess } from "@/lib/route-access";
import { AdminMobileSidebar } from "./AdminMobileSidebar";
import { AdminSidebar } from "./AdminSidebar";

interface Props {
  children: ReactNode;
}

export function AdminShell({ children }: Props) {
  return (
    <ProtectedRoute
      requiredRole={getRoleAccess("admin")}
      title="Khu vực quản trị"
      description="Đăng nhập bằng tài khoản admin để tiếp tục."
    >
      <div className="flex h-screen overflow-hidden bg-muted/10">
        <AdminSidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border/60 bg-background px-4 lg:hidden">
            <AdminMobileSidebar />
            <BrandLogo
              compact
              badge="Admin"
              subtitle=""
              className="px-0 hover:bg-transparent"
            />
          </header>
          <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
