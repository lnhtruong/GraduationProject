"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MessageCircleQuestion, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ManagementPageShell } from "@/features/instructor/course-management/components/ManagementPageShell";
import {
  useInstructorCourseById,
  useLessonsByCourseId,
} from "@/features/instructor/course-management/api/course-management.hooks";
import { useCourseDiscussions } from "../discussion.hooks";
import { QuestionCard } from "./QuestionCard";
import type { DiscussionStatus } from "../types";

interface Props {
  courseId: number;
}

const PAGE_LIMIT = 20;

export function CourseQAPage({ courseId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawLessonId = searchParams.get("lessonId");
  const rawStatus = searchParams.get("status");

  const lessonId = rawLessonId ? Number(rawLessonId) : undefined;
  const status: DiscussionStatus | undefined =
    rawStatus === "answered" || rawStatus === "unanswered" ? rawStatus : undefined;

  const [page, setPage] = useState(1);
  const prevFiltersRef = useRef({ lessonId, status });

  // Reset page when filters change
  useEffect(() => {
    const prev = prevFiltersRef.current;
    if (prev.lessonId !== lessonId || prev.status !== status) {
      setPage(1);
      prevFiltersRef.current = { lessonId, status };
    }
  }, [lessonId, status]);

  const { data: course } = useInstructorCourseById(courseId);
  const { data: lessonsRaw = [] } = useLessonsByCourseId(courseId);

  const { data, isLoading, isError } = useCourseDiscussions(courseId, {
    page,
    limit: PAGE_LIMIT,
    lessonId,
    status,
  });

  const questions = data?.data ?? [];
  const totalPages = data ? Math.ceil(data.total / PAGE_LIMIT) : 1;
  const totalQuestions = data?.total ?? 0;

  const setFilter = useCallback(
    (key: "lessonId" | "status", value: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const courseName = course?.name ?? "Khoá học";

  return (
    <ManagementPageShell
      title="Quản lý Q&A"
      description="Xem và trả lời câu hỏi của học viên trên từng bài học"
      breadcrumbs={[
        { label: "Khoá học", href: "/instructor/courses" },
        { label: courseName, href: `/instructor/courses/${courseId}` },
        { label: "Q&A" },
      ]}
    >
      <div className="divide-y divide-border/40">
        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3 p-4 sm:p-5">
          {/* Lesson filter */}
          <Select
            value={lessonId ? String(lessonId) : "all"}
            onValueChange={(val) =>
              setFilter("lessonId", val === "all" ? undefined : val)
            }
          >
            <SelectTrigger className="h-8 w-52 text-xs">
              <SelectValue placeholder="Tất cả bài học" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                Tất cả bài học
              </SelectItem>
              {lessonsRaw.map((lesson) => (
                <SelectItem key={lesson.id} value={String(lesson.id)} className="text-xs">
                  {lesson.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status filter */}
          <Select
            value={status ?? "all"}
            onValueChange={(val) =>
              setFilter("status", val === "all" ? undefined : val)
            }
          >
            <SelectTrigger className="h-8 w-44 text-xs">
              <SelectValue placeholder="Tất cả trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                Tất cả
              </SelectItem>
              <SelectItem value="unanswered" className="text-xs">
                Chưa có trả lời
              </SelectItem>
              <SelectItem value="answered" className="text-xs">
                Đã có trả lời
              </SelectItem>
            </SelectContent>
          </Select>

          {totalQuestions > 0 && (
            <span className="ml-auto text-xs text-muted-foreground">
              {totalQuestions} câu hỏi
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-destructive/40 bg-destructive/5">
              <AlertCircle className="h-8 w-8 text-destructive/60" />
              <p className="text-sm text-muted-foreground">Không thể tải câu hỏi</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
              >
                Thử lại
              </Button>
            </div>
          ) : questions.length === 0 ? (
            <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/60">
              <MessageCircleQuestion className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">
                {status === "unanswered"
                  ? "Không có câu hỏi nào chưa được trả lời"
                  : status === "answered"
                    ? "Không có câu hỏi nào đã được trả lời"
                    : lessonId
                      ? "Bài học này chưa có câu hỏi nào"
                      : "Khoá học chưa có câu hỏi nào"}
              </p>
              {status || lessonId ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    router.replace("?", { scroll: false });
                  }}
                >
                  Xoá bộ lọc
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="space-y-3">
              {questions.map((question) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  courseId={courseId}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-xs text-muted-foreground">
              Trang {page} / {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                disabled={page <= 1 || isLoading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                disabled={page >= totalPages || isLoading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Tiếp
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </ManagementPageShell>
  );
}
