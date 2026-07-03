"use client";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { QuickActions } from "./QuickActions";
import { RecentCourses } from "./RecentCourses";
import { RecentQA } from "./RecentQA";
import { useInstructorCourses, usePendingPublishCount } from "../../api/dashboard.hooks";
import { useInstructorDiscussions } from "../../qa/discussion.hooks";
import type { InstructorCourse, RecentQAItem } from "../../types";
import type { Course } from "@/features/courses/types";

function mapCourseToInstructor(c: Course): InstructorCourse {
  return {
    id: c.id,
    name: c.name,
    description: c.description,
    thumbnailUrl: (c as unknown as { thumbnailUrl?: string }).thumbnailUrl,
    status: c.status as InstructorCourse["status"],
    lessonCount: 0,
    studentCount: 0,
    updatedAt: c.updated_at ?? c.created_at ?? new Date().toISOString(),
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

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const courses: InstructorCourse[] = rawCourses.map(mapCourseToInstructor);

  const unansweredQA = unansweredData?.total ?? 0;
  const recentQAItems: RecentQAItem[] = (unansweredData?.data ?? []).map((q) => ({
    id: q.id,
    authorName: q.author.name,
    courseName: q.courseName ?? "Khoá học",
    content: q.content,
    createdAt: q.createdAt,
    needsReply: true,
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="mb-1 text-sm text-muted-foreground">
          {today} · Teacher Mode
        </p>
        <h1 className="text-2xl font-bold">
          Welcome back,{" "}
          <span className="text-primary">
            {user?.firstName ?? "Instructor"}!
          </span>{" "}
          👋
        </h1>
        {(unansweredQA > 0 || pendingPublish > 0) && (
          <p className="mt-1 text-sm text-muted-foreground">
            You have{" "}
            {unansweredQA > 0 && (
              <a
                href="/instructor/qa"
                className="font-medium text-primary underline"
              >
                {unansweredQA} unanswered question
                {unansweredQA > 1 ? "s" : ""}
              </a>
            )}
            {unansweredQA > 0 && pendingPublish > 0 && " and "}
            {pendingPublish > 0 && (
              <a
                href="/instructor/courses"
                className="font-medium text-primary underline"
              >
                {pendingPublish} course
                {pendingPublish > 1 ? "s" : ""} ready to publish
              </a>
            )}
            .
          </p>
        )}
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Recent grid */}
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
