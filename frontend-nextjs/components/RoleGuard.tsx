"use client";

import { useAuth } from "@/components/providers/AuthProvider";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: number[];
  fallback?: React.ReactNode;
}

/**
 * Role Guard Component
 * Shows content only if user has one of the allowed roles
 * Used for conditional rendering within a page
 */
export function RoleGuard({
  children,
  allowedRoles,
  fallback = null,
}: RoleGuardProps) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <>{fallback}</>;
  }

  if (!allowedRoles.includes(user.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Role constants for reference
 * Update these based on your backend role values
 */
export const USER_ROLES = {
  USER: 1,
  ADMIN: 2,
  MODERATOR: 3,
} as const;
