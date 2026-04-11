"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authApi } from "@/features/auth/api/auth.api";
import { isPublicAuthRoute } from "@/lib/auth-routes";
import { useAuthStore } from "@/store/auth";

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Auth Provider - Handles authentication on app startup
 * - Restores persisted auth user from Zustand store
 * - Validates and refreshes tokens if needed
 * - Handles redirects based on auth status
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isInitialized, setIsInitialized] = useState(false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const setUser = useAuthStore((state) => state.setUser);
  const setAccessToken = useAuthStore((state) => state.setAccessToken);

  // Initialize auth on app startup
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Restore session using refresh-cookie flow when needed
        await authApi.initializeAuth();
      } catch (error) {
        console.error("Auth initialization failed:", error);
      } finally {
        setIsInitialized(true);
      }
    };

    initAuth();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Show loading while initializing
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Đang khôi phục phiên...</p>
        </div>
      </div>
    );
  }

  // Redirect logic after initialization
  const isPublicRoute = isPublicAuthRoute(pathname);

  if (!isAuthenticated && !isPublicRoute) {
    // Not authenticated, redirect to login
    router.replace(`/signin?returnUrl=${encodeURIComponent(pathname)}`);
    return null;
  }

  if (isAuthenticated && isPublicRoute) {
    // Already authenticated, redirect home
    router.replace("/");
    return null;
  }

  return children;
}
