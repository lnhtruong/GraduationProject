"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authApi } from "@/features/auth/api/auth.api";
import { isPublicAuthRoute } from "@/lib/auth-routes";
import { useAuthStore } from "@/store/auth";
import { PageLoader } from "@/components/PageLoader";

interface AuthProviderProps {
  children: React.ReactNode;
}

function getSafeReturnUrl(value: string | null): string | null {
  if (!value) return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  return value;
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
  const isAuthPage = isPublicAuthRoute(pathname);

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
  }, []);

  // Nếu đã đăng nhập mà vẫn còn ở auth page (ví dụ: back browser về /signin)
  // thì redirect ra khỏi auth page. SignInForm tự redirect sau login nên
  // useEffect này chỉ là fallback cho trường hợp đặc biệt (browser back, bookmark).
  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated) return;
    if (!isAuthPage) return;

    const params =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search)
        : null;
    const returnUrl = getSafeReturnUrl(params?.get("returnUrl") ?? null);
    router.replace(returnUrl ?? "/");
  }, [isInitialized, isAuthenticated, isAuthPage, router]);

  // Show loading while initializing
  if (!isInitialized) {
    return <PageLoader className="min-h-screen" />;
  }

  return children;
}
