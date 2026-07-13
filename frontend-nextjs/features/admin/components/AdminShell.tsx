"use client";

import { PageLoader } from "@/components/PageLoader";
import { BrandLogo } from "@/components/BrandLogo";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { ROLES } from "@/lib/roles";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AdminMobileSidebar } from "./AdminMobileSidebar";
import { AdminSidebar } from "./AdminSidebar";

interface Props {
  children: React.ReactNode;
}

export function AdminShell({ children }: Props) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated) {
      router.replace("/signin");
      return;
    }

    if (user?.role !== ROLES.ADMIN) {
      router.replace("/unauthorized");
    }
  }, [isAuthenticated, isLoading, user?.role, router]);

  if (isLoading || !isAuthenticated) {
    return <PageLoader className="min-h-screen" />;
  }

  if (user?.role !== ROLES.ADMIN) {
    return <PageLoader className="min-h-screen" />;
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
