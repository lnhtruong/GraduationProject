"use client";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { QuickActions } from "./QuickActions";
import { RecentCourses } from "./RecentCourses";
import { RecentQA } from "./RecentQA";
import {
  MOCK_INSTRUCTOR_COURSES,
  MOCK_DASHBOARD_STATS,
  MOCK_RECENT_QA,
} from "../../mock-data";

// TODO: Swap với real API hooks khi backend sẵn sàng:
//   const { data: courses } = useInstructorCourses();
//   const { data: stats } = useDashboardStats();
//   const { data: qa } = useRecentQA();

export default function DashboardPage() {
  const { user } = useAuth();

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const stats = MOCK_DASHBOARD_STATS;
  const courses = MOCK_INSTRUCTOR_COURSES;
  const qaItems = MOCK_RECENT_QA;

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
        {(stats.unansweredQA > 0 || stats.pendingPublish > 0) && (
          <p className="mt-1 text-sm text-muted-foreground">
            You have{" "}
            {stats.unansweredQA > 0 && (
              <a
                href="/instructor/qa"
                className="font-medium text-primary underline"
              >
                {stats.unansweredQA} unanswered question
                {stats.unansweredQA > 1 ? "s" : ""}
              </a>
            )}
            {stats.unansweredQA > 0 && stats.pendingPublish > 0 && " and "}
            {stats.pendingPublish > 0 && (
              <a
                href="/instructor/courses"
                className="font-medium text-primary underline"
              >
                {stats.pendingPublish} course
                {stats.pendingPublish > 1 ? "s" : ""} ready to publish
              </a>
            )}
            .
          </p>
        )}
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Recent grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentCourses courses={courses} />
        <RecentQA items={qaItems} />
      </div>
    </div>
  );
}
