"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { LockKeyhole, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useInstructorCourseById } from "@/features/instructor/course-management/api/course-management.hooks";
import { AppEmptyState } from "@/features/_shared/components/AppEmptyState";
import { AppLoadingState } from "@/features/_shared/components/AppLoadingState";
import { AppPageHeader } from "@/features/_shared/components/AppPageHeader";

interface CourseOwnerGuardProps {
  courseId: number;
  children: React.ReactNode;
}

export function CourseOwnerGuard({ courseId, children }: CourseOwnerGuardProps) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const returnUrl = query ? `${pathname}?${query}` : pathname;

  const {
    data: course,
    isLoading: courseLoading,
    error,
  } = useInstructorCourseById(courseId);

  const isErrorForbidden = getErrorStatus(error) === 403;
  const isOwner = Boolean(course && user && course.userId === user.id);

  if (authLoading || courseLoading) {
    return (
      <GuardState
        eyebrow="Đang kiểm tra"
        title="Quản lý khóa học"
        description="Đang kiểm tra quyền truy cập khóa học."
        icon={<LockKeyhole className="h-5 w-5" />}
      >
        <AppLoadingState message="Đang kiểm tra quyền truy cập..." />
      </GuardState>
    );
  }

  if (!isAuthenticated) {
    return (
      <GuardState
        eyebrow="Yêu cầu đăng nhập"
        title="Quản lý khóa học"
        description="Đăng nhập bằng tài khoản giảng viên để tiếp tục."
        icon={<LockKeyhole className="h-5 w-5" />}
      >
        <AppEmptyState
          icon={<LockKeyhole className="h-8 w-8" />}
          title="Hãy đăng nhập để tiếp tục"
          description="Trang này chứa dữ liệu quản lý khóa học, nên bạn cần đăng nhập trước."
          action={
            <Button asChild>
              <Link href={`/signin?returnUrl=${encodeURIComponent(returnUrl)}`}>
                Đăng nhập
              </Link>
            </Button>
          }
        />
      </GuardState>
    );
  }

  if (isErrorForbidden || (course && user && !isOwner)) {
    return (
      <GuardState
        eyebrow="Không có quyền"
        title="Bạn không có quyền truy cập"
        description="Chỉ giảng viên sở hữu khóa học mới có thể mở khu vực này."
        icon={<ShieldAlert className="h-5 w-5" />}
      >
        <AppEmptyState
          icon={<ShieldAlert className="h-8 w-8" />}
          title="Không có quyền truy cập"
          description="Nếu bạn nghĩ đây là nhầm lẫn, hãy đăng nhập bằng đúng tài khoản giảng viên."
          tone="destructive"
          action={
            <Button variant="outline" asChild>
              <Link href="/instructor/courses">Về danh sách khóa học</Link>
            </Button>
          }
        />
      </GuardState>
    );
  }

  return <>{children}</>;
}

function getErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;
  const response = "response" in error ? error.response : undefined;
  if (!response || typeof response !== "object") return undefined;
  const status = "status" in response ? response.status : undefined;
  return typeof status === "number" ? status : undefined;
}

function GuardState({
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
