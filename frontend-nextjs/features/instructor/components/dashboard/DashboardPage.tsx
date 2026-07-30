"use client";

import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { usePendingPublishCount, useInstructorCourses } from "../../api/dashboard.hooks";
import { useInstructorDiscussions } from "../../qa/discussion.hooks";
import type { Course } from "@/features/courses/types";
import type { InstructorCourse, RecentQAItem } from "../../types";
import { QuickActions } from "./QuickActions";
import { RecentCourses } from "./RecentCourses";
import { RecentQA } from "./RecentQA";

function getCourseCount(course: Course, keys: string[]): number {
  for (const key of keys) {
    const value = (course as unknown as Record<string, unknown>)[key];
    const count = typeof value === "number" ? value : Number(value);
    if (Number.isFinite(count) && count >= 0) {
      return count;
    }
  }
  return 0;
}

function mapCourseToInstructor(course: Course): InstructorCourse {
  return {
    id: course.id,
    name: course.name,
    description: course.description,
    thumbnailUrl: (course as unknown as { thumbnailUrl?: string }).thumbnailUrl,
    status: course.status as InstructorCourse["status"],
    lessonCount: Array.isArray(course.lessons)
      ? course.lessons.length
      : getCourseCount(course, ["totalLessons", "lessonCount", "lessonsCount", "lessons_count"]),
    studentCount: getCourseCount(course, ["totalStudents", "studentCount", "studentsCount", "enrolled_count"]),
    updatedAt: course.updated_at ?? course.created_at ?? new Date().toISOString(),
  };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: rawCourses = [], isLoading: isCoursesLoading } = useInstructorCourses();
  const { data: unansweredData, isLoading: isUnansweredLoading } = useInstructorDiscussions({
    status: "unanswered",
    limit: 5,
  });
  const pendingPublish = usePendingPublishCount();

  const isLoading = isCoursesLoading || isUnansweredLoading;
  const today = new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const courses: InstructorCourse[] = rawCourses.map(mapCourseToInstructor);
  const unansweredQA = unansweredData?.total ?? 0;
  const recentQAItems: RecentQAItem[] = (unansweredData?.data ?? []).map((question) => ({
    id: question.id,
    authorName: question.author.name,
    courseName: question.courseName ?? "Khóa học",
    content: question.content,
    createdAt: question.createdAt,
    needsReply: true,
  }));

  return (
    <div className="space-y-8">
      <div>
        <p className="mb-1 text-sm text-muted-foreground">
          {today} · Chế độ giảng viên
        </p>
        <h1 className="text-2xl font-bold">
          Chào mừng trở lại,{" "}
          <span className="text-primary">{user?.firstName ?? "giảng viên"}</span>
        </h1>
        {(unansweredQA > 0 || pendingPublish > 0) && (
          <p className="mt-1 text-sm text-muted-foreground">
            Bạn có{" "}
            {unansweredQA > 0 && (
              <Link href="/instructor/qa" className="font-medium text-primary underline">
                {unansweredQA} câu hỏi chưa phản hồi
              </Link>
            )}
            {unansweredQA > 0 && pendingPublish > 0 && " và "}
            {pendingPublish > 0 && (
              <Link href="/instructor/courses" className="font-medium text-primary underline">
                {pendingPublish} khóa học sẵn sàng xuất bản
              </Link>
            )}
            .
          </p>
        )}
      </div>

      <QuickActions />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-56 rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <RecentCourses courses={courses} />
          <RecentQA items={recentQAItems} />
        </div>
      )}
    </div>
  );
}
