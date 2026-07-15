"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { LockKeyhole, ShieldAlert } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { AppEmptyState } from "@/features/_shared/components/AppEmptyState";
import { AppLoadingState } from "@/features/_shared/components/AppLoadingState";
import { AppPageHeader } from "@/features/_shared/components/AppPageHeader";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { ROLES } from "@/lib/roles";
import { AdminMobileSidebar } from "./AdminMobileSidebar";
import { AdminSidebar } from "./AdminSidebar";

interface Props {
  children: ReactNode;
}

export function AdminShell({ children }: Props) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <AdminGuardState
        eyebrow="Đang kiểm tra"
        title="Khu vực quản trị"
        description="Đang kiểm tra phiên đăng nhập quản trị."
        icon={<LockKeyhole className="h-5 w-5" />}
      >
        <AppLoadingState message="Đang kiểm tra đăng nhập..." />
      </AdminGuardState>
    );
  }

  if (!isAuthenticated) {
    return (
      <AdminGuardState
        eyebrow="Yêu cầu đăng nhập"
        title="Khu vực quản trị"
        description="Đăng nhập bằng tài khoản admin để tiếp tục."
        icon={<LockKeyhole className="h-5 w-5" />}
      >
        <AppEmptyState
          icon={<LockKeyhole className="h-8 w-8" />}
          title="Hãy đăng nhập để tiếp tục"
          description="Khu vực này chỉ dành cho tài khoản quản trị."
          action={
            <Button asChild>
              <Link href="/signin?returnUrl=%2Fadmin">Đăng nhập</Link>
            </Button>
          }
        />
      </AdminGuardState>
    );
  }

  if (user?.role !== ROLES.ADMIN) {
    return (
      <AdminGuardState
        eyebrow="Không có quyền"
        title="Bạn không có quyền truy cập"
        description="Tài khoản hiện tại không phải tài khoản quản trị."
        icon={<ShieldAlert className="h-5 w-5" />}
      >
        <AppEmptyState
          icon={<ShieldAlert className="h-8 w-8" />}
          title="Không có quyền truy cập"
          description="Nếu bạn cần vào khu vực này, hãy đăng nhập bằng tài khoản admin."
          tone="destructive"
          action={
            <Button variant="outline" asChild>
              <Link href="/">Về trang chủ</Link>
            </Button>
          }
        />
      </AdminGuardState>
    );
  }

  return (
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
  );
}

function AdminGuardState({
  eyebrow,
  title,
  description,
  icon,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <AppPageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        icon={icon}
      />
      <div className="container mx-auto max-w-7xl px-4 py-8 lg:px-8">
        {children}
      </div>
    </div>
  );
}
