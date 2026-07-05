"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useInstructorCourseById } from "@/features/instructor/course-management/api/course-management.hooks";
import { PageLoader } from "@/components/PageLoader";

interface CourseOwnerGuardProps {
  courseId: number;
  children: React.ReactNode;
}

export function CourseOwnerGuard({ courseId, children }: CourseOwnerGuardProps) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const {
    data: course,
    isLoading: courseLoading,
    error,
  } = useInstructorCourseById(courseId);

  const isErrorForbidden = error && (error as any).response?.status === 403;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/signin?returnUrl=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!authLoading && !courseLoading) {
      if (isErrorForbidden) {
        router.push("/unauthorized");
        return;
      }

      if (course && user) {
        // Enforce ownership: only the owner/creator lecturer can view/edit
        const isOwner = course.userId === user.id;
        if (!isOwner) {
          router.push("/unauthorized");
        }
      }
    }
  }, [
    isAuthenticated,
    authLoading,
    courseLoading,
    course,
    user,
    isErrorForbidden,
    router,
  ]);

  if (authLoading || courseLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <PageLoader />;
  }

  if (isErrorForbidden) {
    return <PageLoader />;
  }

  if (course && user && course.userId !== user.id) {
    return <PageLoader />;
  }

  return <>{children}</>;
}
