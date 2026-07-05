"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Video } from "lucide-react";
import {
  useInstructorCourseById,
} from "@/features/instructor/course-management/api/course-management.hooks";
import { useCourseDiscussions } from "../discussion.hooks";
import { QAWorkspaceShell } from "./QAWorkspaceShell";
import type { DiscussionStatus, DiscussionSort } from "../types";

interface Props {
  courseId: number;
}

const PAGE_LIMIT = 15;

export function CourseQAWorkspace({ courseId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawLessonId = searchParams.get("lessonId");
  const rawStatus = searchParams.get("status");
  const rawSort = searchParams.get("sort");

  const lessonId = rawLessonId ? Number(rawLessonId) : undefined;
  const status: DiscussionStatus | undefined =
    rawStatus === "answered" || rawStatus === "unanswered" ? rawStatus : undefined;
  const sort: DiscussionSort =
    rawSort === "upvotes" || rawSort === "active" ? rawSort : "newest";

  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const prevFiltersRef = useRef({ lessonId, status, sort });

  useEffect(() => {
    const prev = prevFiltersRef.current;
    if (prev.lessonId !== lessonId || prev.status !== status || prev.sort !== sort) {
      setPage(1);
      prevFiltersRef.current = { lessonId, status, sort };
    }
  }, [lessonId, status, sort]);

  const { data: course } = useInstructorCourseById(courseId);
  const lessonsRaw = course?.lessons ?? [];
  const courseName = course?.name ?? "Khóa học";

  const { data, isLoading, isError, refetch } = useCourseDiscussions(courseId, {
    page,
    limit: PAGE_LIMIT,
    lessonId,
    status,
    sort,
  });

  const questions = data?.data ?? [];
  const totalPages = data ? Math.ceil(data.total / PAGE_LIMIT) : 1;
  const totalQuestions = data?.total ?? 0;
  const totalCount = data?.totalCount ?? totalQuestions;
  const unansweredCount = data?.unansweredTotal ?? (status === "unanswered" ? totalQuestions : 0);
  const answeredCount = data?.answeredTotal ?? (status === "answered" ? totalQuestions : 0);

  const filteredQuestions = useMemo(() => {
    if (!searchQuery.trim()) return questions;
    const q = searchQuery.toLowerCase();
    return questions.filter(
      (item) =>
        item.content.toLowerCase().includes(q) ||
        item.author.name.toLowerCase().includes(q) ||
        item.lessonTitle.toLowerCase().includes(q),
    );
  }, [questions, searchQuery]);

  const setFilter = useCallback(
    (key: "lessonId" | "status" | "sort", value: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      params.delete("page");
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  return (
    <QAWorkspaceShell
      title="Hỏi đáp & Thảo luận"
      description={`Theo dõi và giải đáp thắc mắc của học viên trong khóa học "${courseName}"`}
      breadcrumbs={[
        { label: "Khóa học", href: "/instructor/courses" },
        { label: courseName, href: `/instructor/courses/${courseId}` },
        { label: "Q&A" },
      ]}
      totalCount={totalCount}
      unansweredCount={unansweredCount}
      answeredCount={answeredCount}
      status={status}
      onStatusChange={(s) => setFilter("status", s)}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      secondaryFilter={{
        icon: Video,
        sheetLabel: "Bài học",
        placeholder: "Tất cả bài học",
        desktopWidth: "w-[200px]",
        value: lessonId ? String(lessonId) : "all",
        onChange: (val) => setFilter("lessonId", val === "all" ? undefined : val),
        options: [
          { value: "all", label: "Tất cả bài học trong khóa", bold: true },
          ...lessonsRaw.map((l) => ({ value: String(l.id), label: l.title })),
        ],
      }}
      sort={sort}
      onSortChange={(val) => setFilter("sort", val === "newest" ? undefined : val)}
      isLoading={isLoading}
      isError={isError}
      onRefetch={refetch}
      questions={filteredQuestions}
      questionCourseId={courseId}
      hasActiveFilters={!!(status || lessonId || searchQuery)}
      onClearFilters={() => {
        setSearchQuery("");
        router.replace("?", { scroll: false });
      }}
      page={page}
      totalPages={totalPages}
      totalQuestions={totalQuestions}
      onPageChange={setPage}
    />
  );
}
