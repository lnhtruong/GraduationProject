"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { PageLoader } from "@/components/PageLoader";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Single role ID or array of allowed role IDs */
  requiredRole?: number | number[];
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
      } else if (requiredRole !== undefined) {
        const hasRole = Array.isArray(requiredRole)
          ? requiredRole.includes(user?.role ?? -1)
          : user?.role === requiredRole;
        if (!hasRole) router.push("/unauthorized");
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
  if (requiredRole !== undefined) {
    const hasRole = Array.isArray(requiredRole)
      ? requiredRole.includes(user?.role ?? -1)
      : user?.role === requiredRole;
    if (!hasRole) return <PageLoader />;
  }

  // All checks passed
  return <>{children}</>;
}
