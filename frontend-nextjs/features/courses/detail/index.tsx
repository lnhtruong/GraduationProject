// Swap sang real API
// Khi backend sẵn sàng, chỉ cần:
// Thay getCourseById() trong detail/index.tsx bằng useCourseById(id) (TanStack Query)
// Thay useState(null) enrollment bằng useCourseEnrollment(courseId)
// Thay handleEnroll bằng mutation useEnrollCourse()
// Xóa mock-data.ts khi không còn cần nữa

"use client";

import { useState } from "react";
import { CourseHeroSection } from "./components/CourseHeroSection";
import { CourseStickySidebar } from "./components/CourseStickySidebar";
import { WhatYouLearnSection } from "./components/WhatYouLearnSection";
import { CourseContentAccordion } from "./components/CourseContentAccordion";
import { InstructorSection } from "./components/InstructorSection";
import { ReviewsSection } from "./components/ReviewsSection";
import { getCourseById, MOCK_ENROLLMENT } from "../mock-data";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth";
import { useEnrollmentCheck } from "../api/enrollment.api";
import type { Enrollment } from "../types";



// ---------------------------------------------------------------------------
// Inline minor sections
// ---------------------------------------------------------------------------

function RequirementsSection({ items }: { items: string[] }) {
  return (
    <section>
      <h2 className="mb-4 text-xl font-bold">Yêu cầu</h2>
      <ul className="space-y-2.5">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-foreground">
            <span className="mt-0.5 shrink-0 text-base font-bold text-primary">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function DescriptionSection({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <section>
      <h2 className="mb-4 text-xl font-bold">Mô tả khoá học</h2>
      <div className="relative">
        <p
          className={`whitespace-pre-line text-sm leading-relaxed text-muted-foreground ${
            expanded ? "" : "line-clamp-5"
          }`}
        >
          {text}
        </p>
        {!expanded && (
          <div className="pointer-events-none absolute bottom-0 h-12 w-full bg-gradient-to-t from-background to-transparent" />
        )}
      </div>
      <button
        onClick={() => setExpanded((e) => !e)}
        className="mt-2 text-sm font-medium text-primary transition-colors hover:text-primary/80"
      >
        {expanded ? "Thu gọn ▲" : "Xem thêm ▼"}
      </button>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Main feature component
// ---------------------------------------------------------------------------

interface Props {
  courseId: number;
}

export default function CourseDetail({ courseId }: Props) {
  const course = getCourseById(courseId);

  const { user } = useAuthStore();
  const { data: enrollmentData } = useEnrollmentCheck(courseId, user?.id);

  // Auth & enrollment state — swap with real hooks when backend is ready
  const [isAuthenticated] = useState(true);
  const [mockEnrollment, setMockEnrollment] = useState<Enrollment | null>(null);
  // Prefer real enrollment data from API; fall back to mock state for demo toggle
  const enrollment: Enrollment | null = enrollmentData ?? mockEnrollment;

  if (!course) {
    return (
      <div className="container mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-4 py-20 text-center">
        <div className="space-y-3">
          <h1 className="text-2xl font-bold">Không tìm thấy khoá học</h1>
          <p className="text-muted-foreground">
            Khoá học này không tồn tại hoặc đã bị xoá.
          </p>
        </div>
      </div>
    );
  }

  const isEnrolled = enrollment !== null;

  const handleEnroll = () => {
    if (course.price === 0 || true /* mock: always succeed */) {
      setMockEnrollment(MOCK_ENROLLMENT);
    }
  };

  const handleUnenroll = () => setMockEnrollment(null);

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero ────────────────────────────────────────── */}
      <CourseHeroSection course={course} isEnrolled={isEnrolled} />

      {/* ── Body ────────────────────────────────────────── */}
      <div className="container mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex gap-8">

          {/* ── Left content column ─────────────────────── */}
          <div className="min-w-0 flex-1 space-y-10 py-8">

            {/* Mobile: sidebar inline before main content */}
            <div className="lg:hidden">
              <CourseStickySidebar
                course={course}
                enrollment={enrollment}
                isAuthenticated={isAuthenticated}
                onEnroll={handleEnroll}
              />
            </div>

            <WhatYouLearnSection items={course.whatYouLearn} />

            <CourseContentAccordion
              lessons={course.lessons}
              isEnrolled={isEnrolled}
            />

            <RequirementsSection items={course.requirements} />

            <DescriptionSection text={course.description} />

            <InstructorSection instructor={course.instructor} />

            <ReviewsSection
              courseId={courseId}
              isEnrolled={isEnrolled}
              currentUserId={user?.id}
            />
          </div>

          {/* ── Right sticky sidebar (desktop only) ─────── */}
          {/* Negative top margin overlaps the hero section visually */}
          <div className="hidden w-80 shrink-0 lg:block lg:-mt-52">
            <div className="sticky top-24">
              <CourseStickySidebar
                course={course}
                enrollment={enrollment}
                isAuthenticated={isAuthenticated}
                onEnroll={handleEnroll}
              />
            </div>
          </div>

        </div>
      </div>

      {/* ── Mobile bottom CTA bar ───────────────────────── */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-border/60 bg-background/95 px-4 py-3 backdrop-blur-sm lg:hidden">
        {enrollment ? (
          <>
            <span className="text-sm font-medium text-primary">{enrollment.progress}% hoàn thành</span>
            <Button size="lg" variant="outline" className="flex-1 border-primary/40 text-primary" asChild>
              <a href={`/courses/${course.id}/learn`}>Tiếp tục học</a>
            </Button>
          </>
        ) : (
          <>
            {course.price > 0 && (
              <span className="text-base font-bold text-foreground">
                {course.price.toLocaleString("vi-VN")}đ
              </span>
            )}
            <Button
              size="lg"
              className="flex-1 shadow-md shadow-primary/20"
              onClick={handleEnroll}
            >
              {course.price === 0 ? "Đăng ký miễn phí" : "Đăng ký ngay"}
            </Button>
          </>
        )}
      </div>

      {/* ── Dev toggle: enrolled ↔ not enrolled ─────────── */}
      <div className="fixed bottom-24 right-4 z-50 lg:bottom-6">
        <Button
          size="sm"
          variant="secondary"
          className="rounded-full border border-border shadow-md text-xs opacity-70 hover:opacity-100"
          onClick={isEnrolled ? handleUnenroll : handleEnroll}
        >
          {isEnrolled ? "Demo: Huỷ đăng ký" : "Demo: Đăng ký"}
        </Button>
      </div>
    </div>
  );
}
