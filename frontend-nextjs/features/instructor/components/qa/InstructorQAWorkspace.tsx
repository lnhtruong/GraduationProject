"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen } from "lucide-react";
import { useInstructorDiscussions } from "../../qa/discussion.hooks";
import { useInstructorCourses } from "@/features/instructor/course-management/api/course-management.hooks";
import { QAWorkspaceShell } from "../../qa/components/QAWorkspaceShell";
import type { DiscussionStatus, DiscussionSort } from "../../qa/types";

const PAGE_LIMIT = 10;

export default function InstructorQAWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawStatus = searchParams.get("status");
  const status: DiscussionStatus | undefined =
    rawStatus === "answered" || rawStatus === "unanswered" ? rawStatus : undefined;

  const rawCourseId = searchParams.get("courseId");
  const courseId = rawCourseId ? Number(rawCourseId) : undefined;

  const rawSort = searchParams.get("sort");
  const sort: DiscussionSort =
    rawSort === "upvotes" || rawSort === "active" ? rawSort : "newest";

  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const prevStatusRef = useRef(status);
  const prevCourseIdRef = useRef(courseId);
  const prevSortRef = useRef(sort);

  const { data: coursesData } = useInstructorCourses({}, true);
  const courses = coursesData ?? [];

  useEffect(() => {
    if (
      prevStatusRef.current !== status ||
      prevCourseIdRef.current !== courseId ||
      prevSortRef.current !== sort
    ) {
      prevStatusRef.current = status;
      prevCourseIdRef.current = courseId;
      prevSortRef.current = sort;
      const timer = window.setTimeout(() => setPage(1), 0);
      return () => window.clearTimeout(timer);
    }
  }, [status, courseId, sort]);

  const { data, isLoading, isError, refetch } = useInstructorDiscussions({
    page,
    limit: PAGE_LIMIT,
    status,
    courseId,
    sort,
  });

  const questions = data?.data ?? [];
  const totalQuestions = data?.total ?? 0;
  const totalPages = data ? Math.ceil(data.total / PAGE_LIMIT) : 1;
  const totalCount = data?.totalCount ?? totalQuestions;
  const unansweredCount = data?.unansweredTotal ?? (status === "unanswered" ? totalQuestions : 0);
  const answeredCount = data?.answeredTotal ?? (status === "answered" ? totalQuestions : 0);

  const filteredQuestions = useMemo(() => {
    let result = [...questions];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.content.toLowerCase().includes(q) ||
          item.author.name.toLowerCase().includes(q) ||
          item.lessonTitle.toLowerCase().includes(q) ||
          (item.courseName && item.courseName.toLowerCase().includes(q)),
      );
    }
    if (sort === "upvotes") {
      result.sort((a, b) => (b.upvotes ?? 0) - (a.upvotes ?? 0));
    } else if (sort === "active") {
      result.sort((a, b) => (b.replyCount ?? 0) - (a.replyCount ?? 0));
    } else {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return result;
  }, [questions, searchQuery, sort]);

  const setFilter = useCallback(
    (key: "status" | "courseId" | "sort", value: string | undefined) => {
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
      title="Quản lý Hỏi đáp & Thảo luận"
      description="Theo dõi, giải đáp thắc mắc và hỗ trợ học viên trên tất cả các khóa học của bạn trong một workspace gọn và dễ quản lý."
      totalCount={totalCount}
      unansweredCount={unansweredCount}
      answeredCount={answeredCount}
      status={status}
      onStatusChange={(s) => setFilter("status", s)}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      secondaryFilter={{
        icon: BookOpen,
        sheetLabel: "Khóa học",
        placeholder: "Tất cả khóa học",
        desktopWidth: "w-[190px]",
        value: courseId ? String(courseId) : "all",
        onChange: (val) => setFilter("courseId", val === "all" ? undefined : val),
        options: [
          { value: "all", label: "Tất cả khóa học", bold: true },
          ...courses.map((c) => ({ value: String(c.id), label: c.name })),
        ],
      }}
      sort={sort}
      onSortChange={(val) => setFilter("sort", val === "newest" ? undefined : val)}
      isLoading={isLoading}
      isError={isError}
      onRefetch={refetch}
      questions={filteredQuestions}
      hasActiveFilters={!!(status || courseId || searchQuery)}
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
