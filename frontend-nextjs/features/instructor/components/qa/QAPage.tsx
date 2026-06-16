"use client";

import { BookOpen, HelpCircle, CheckCircle, BarChart2, Plus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { StatsCard } from "../analytics/StatsCard";
import { QuizRow } from "./QuizRow";
import { useInstructorQuizzes, useDeleteQuiz } from "../../api/quiz.hooks";
import type { QuizApiItem } from "../../api/quiz.api";
import type { QuizSummary } from "../../types";

function mapQuizApiToSummary(q: QuizApiItem): QuizSummary {
  return {
    id: q.id,
    name: q.name,
    // courseName và completions/avgScore chưa có trong API — backend cần bổ sung
    courseName: "—",
    questionCount: q.questions?.length ?? 0,
    completions: 0,
    avgScore: 0,
  };
}

function QuizListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-[76px] rounded-xl" />
      ))}
    </div>
  );
}

export default function QAPage() {
  const { data: rawQuizzes = [], isLoading, isError } = useInstructorQuizzes();
  const { mutate: deleteQuiz, isPending: isDeleting } = useDeleteQuiz();

  const quizzes: QuizSummary[] = rawQuizzes.map(mapQuizApiToSummary);

  const statsCards = [
    {
      label: "Tổng quiz",
      value: String(quizzes.length),
      changePercent: 0,
      icon: BookOpen,
    },
    {
      label: "Tổng câu hỏi",
      value: String(quizzes.reduce((sum, q) => sum + q.questionCount, 0)),
      changePercent: 0,
      icon: HelpCircle,
    },
    {
      // completions/avgScore chờ API aggregate từ backend
      label: "Lượt hoàn thành",
      value: "—",
      changePercent: 0,
      icon: CheckCircle,
    },
    {
      label: "Điểm trung bình",
      value: "—",
      changePercent: 0,
      icon: BarChart2,
    },
  ];

  function handleDelete(id: number) {
    deleteQuiz(id, {
      onSuccess: () => toast.success("Đã xóa quiz"),
      onError: () => toast.error("Xóa quiz thất bại"),
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Quiz</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tạo và quản lý bài kiểm tra cho học viên của bạn
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Tạo quiz mới
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statsCards.map((card) => (
          <StatsCard key={card.label} {...card} />
        ))}
      </div>

      {/* Quiz list */}
      {isLoading ? (
        <QuizListSkeleton />
      ) : isError ? (
        <div className="flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-destructive/40 bg-destructive/5">
          <AlertCircle className="h-8 w-8 text-destructive/60" />
          <p className="text-sm text-muted-foreground">Không thể tải danh sách quiz</p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Thử lại
          </Button>
        </div>
      ) : quizzes.length === 0 ? (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/60 bg-card">
          <BookOpen className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Chưa có quiz nào</p>
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Tạo quiz đầu tiên
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {quizzes.map((quiz) => (
            <QuizRow
              key={quiz.id}
              quiz={quiz}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
