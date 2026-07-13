"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { ROLES } from "@/lib/roles";
import { PageLoader } from "@/components/PageLoader";

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
    <div className="flex min-h-screen flex-col bg-muted/10 md:h-screen md:flex-row md:overflow-hidden">
      <AdminSidebar />
      <main className="min-w-0 flex-1 p-4 md:overflow-y-auto md:p-6">
        {children}
      </main>
    </div>
  );
}
