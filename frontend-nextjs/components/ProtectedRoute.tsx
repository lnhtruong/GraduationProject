"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { PageLoader } from "@/components/PageLoader";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: number;
}

/**
 * Protected Route Component
 * Wraps pages that require authentication
 * Optional role-based access control
 */
export function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        // Not authenticated, redirect to sign in
        const returnUrl = encodeURIComponent(pathname);
        router.push(`/signin?returnUrl=${returnUrl}`);
      } else if (requiredRole !== undefined && user?.role !== requiredRole) {
        // Authenticated but insufficient role
        router.push("/unauthorized");
      }
    }
  }, [isAuthenticated, isLoading, user, requiredRole, router, pathname]);

  // Show loader while checking authentication
  if (isLoading) {
    return <PageLoader />;
  }

  // Not authenticated
  if (!isAuthenticated) {
    return <PageLoader />;
  }

  // Authenticated but insufficient role
  if (requiredRole !== undefined && user?.role !== requiredRole) {
    return <PageLoader />;
  }

  // All checks passed
  return <>{children}</>;
}
