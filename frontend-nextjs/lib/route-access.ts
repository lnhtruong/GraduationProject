/**
 * Route access control configuration
 * Centralized definition of which roles can access which routes/sections
 * Usage: Import and use in layout.tsx or components
 */

import { ROLES, type RoleValue } from "./roles";

/**
 * Define role requirements for major route groups
 * Extend this object when adding new protected areas
 */
export const ROUTE_ACCESS = {
  // Instructor/Teacher Mode - chỉ Lecturer + Admin
  instructor: [ROLES.LECTURER, ROLES.ADMIN] as const,

  // Student learning area - chỉ Student + những học viên được cấp access
  student: [ROLES.STUDENT] as const,

  // Admin only
  admin: [ROLES.ADMIN] as const,

  // Public access (không cần role)
  public: [] as const,
} as const;

export type RouteAccessKey = keyof typeof ROUTE_ACCESS;

/**
 * Get role requirements for a specific route/section
 * @example
 * <ProtectedRoute requiredRole={getRoleAccess('instructor')}>
 *   <InstructorDashboard />
 * </ProtectedRoute>
 */
export function getRoleAccess(route: RouteAccessKey): readonly RoleValue[] {
  return ROUTE_ACCESS[route];
}

/**
 * Check if user has access to a specific route
 * @example
 * if (hasRouteAccess('instructor', userRole)) {
 *   // User can access instructor area
 * }
 */
export function hasRouteAccess(
  route: RouteAccessKey,
  userRole?: number,
): boolean {
  if (!userRole) return false;
  const allowedRoles = getRoleAccess(route);
  return allowedRoles.includes(userRole as RoleValue);
}
