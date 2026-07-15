"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { LockKeyhole, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { AppEmptyState } from "@/features/_shared/components/AppEmptyState";
import { AppLoadingState } from "@/features/_shared/components/AppLoadingState";
import { AppPageHeader } from "@/features/_shared/components/AppPageHeader";

interface ProtectedRouteProps {
  children: ReactNode;
  /** Single role ID or array of allowed role IDs */
  requiredRole?: number | readonly number[];
  title?: string;
  description?: string;
}

/**
 * Protected Route Component
 * Wraps pages that require authentication.
 * It keeps users on the current page and shows an in-page sign-in prompt
 * instead of redirecting away immediately.
 */
export function ProtectedRoute({
  children,
  requiredRole,
  title = "Bạn cần đăng nhập",
  description = "Đăng nhập để tiếp tục sử dụng nội dung cá nhân của bạn trên StudyLoop.",
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const returnUrl = query ? `${pathname}?${query}` : pathname;
  const signInHref = `/signin?returnUrl=${encodeURIComponent(returnUrl)}`;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppPageHeader
          eyebrow="Đang kiểm tra"
          title={title}
          description="Đang kiểm tra phiên đăng nhập của bạn."
          icon={<LockKeyhole className="h-5 w-5" />}
        />
        <div className="container mx-auto max-w-7xl px-4 py-8 lg:px-8">
          <AppLoadingState message="Đang kiểm tra đăng nhập..." />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <AppPageHeader
          eyebrow="Yêu cầu đăng nhập"
          title={title}
          description={description}
          icon={<LockKeyhole className="h-5 w-5" />}
        />
        <div className="container mx-auto max-w-7xl px-4 py-8 lg:px-8">
          <AppEmptyState
            icon={<LockKeyhole className="h-8 w-8" />}
            title="Hãy đăng nhập để tiếp tục"
            description="Trang này chứa dữ liệu cá nhân, nên bạn cần đăng nhập trước khi xem hoặc chỉnh sửa."
            action={
              <Button asChild>
                <Link href={signInHref}>Đăng nhập</Link>
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  if (requiredRole !== undefined) {
    const hasRole = Array.isArray(requiredRole)
      ? requiredRole.includes(user?.role ?? -1)
      : user?.role === requiredRole;

    if (!hasRole) {
      return (
        <div className="min-h-screen bg-background">
          <AppPageHeader
            eyebrow="Không có quyền"
            title="Bạn không có quyền truy cập"
            description="Tài khoản hiện tại chưa có quyền mở khu vực này."
            icon={<ShieldAlert className="h-5 w-5" />}
          />
          <div className="container mx-auto max-w-7xl px-4 py-8 lg:px-8">
            <AppEmptyState
              icon={<ShieldAlert className="h-8 w-8" />}
              title="Không có quyền truy cập"
              description="Nếu bạn nghĩ đây là nhầm lẫn, hãy đăng nhập bằng tài khoản có quyền phù hợp."
              tone="destructive"
              action={
                <Button variant="outline" asChild>
                  <Link href="/">Về trang chủ</Link>
                </Button>
              }
            />
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
