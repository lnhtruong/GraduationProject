"use client";

import { useState } from "react";
import { BookOpen, HelpCircle, CheckCircle, BarChart2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { StatsCard } from "../analytics/StatsCard";
import { QuizRow } from "./QuizRow";
import { MOCK_QA_STATS, MOCK_QUIZZES } from "../../mock-data";
import type { QuizSummary } from "../../types";

// TODO: Swap sang real API khi backend sẵn sàng:
//   const { data: stats } = useQAStats();
//   const { data: quizzes } = useQuizzes();
//   const deleteQuiz = useDeleteQuiz();

export default function QAPage() {
  const stats = MOCK_QA_STATS;
  // TODO: replace useState + MOCK với useQuery khi có API
  const [quizzes, setQuizzes] = useState<QuizSummary[]>(MOCK_QUIZZES);

  const statsCards = [
    {
      label: "Tổng quiz",
      value: String(stats.totalQuizzes),
      changePercent: 0,
      icon: BookOpen,
    },
    {
      label: "Tổng câu hỏi",
      value: String(stats.totalQuestions),
      changePercent: 0,
      icon: HelpCircle,
    },
    {
      label: "Lượt hoàn thành",
      value: String(stats.totalCompletions),
      changePercent: 0,
      icon: CheckCircle,
    },
    {
      label: "Điểm trung bình",
      value: `${stats.avgScore}%`,
      changePercent: 0,
      icon: BarChart2,
    },
  ];

  function handleDelete(id: number) {
    setQuizzes((prev) => prev.filter((q) => q.id !== id));
    toast.success("Đã xóa quiz");
    // TODO: gọi DELETE /quizzes/:id khi có API
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
        {/* TODO: Link to quiz creation page when available */}
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
      {quizzes.length === 0 ? (
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
            <QuizRow key={quiz.id} quiz={quiz} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
