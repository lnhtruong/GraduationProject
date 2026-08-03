import { BookOpen, Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { QuizSummary } from "../../types";

interface Props {
  quiz: QuizSummary;
  onDelete: (id: number) => void;
}

export function QuizRow({ quiz, onDelete }: Props) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border/60 bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm">
      {/* Icon */}
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <BookOpen className="h-5 w-5 text-primary" />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{quiz.name}</p>
        <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
          {quiz.courseName}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>{quiz.questionCount} câu hỏi</span>
          <span className="text-border">·</span>
          <span>{quiz.completions} lượt hoàn thành</span>
          <span className="text-border">·</span>
          <span className="font-medium text-emerald-600 dark:text-emerald-400">
            Điểm trung bình: {quiz.avgScore}%
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-shrink-0 items-center gap-1">
        {/* TODO: Link to quiz detail page when available */}
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
          <Eye className="h-3.5 w-3.5" />
          Xem
        </Button>
        {/* TODO: Link to quiz edit page when available */}
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
          <Pencil className="h-3.5 w-3.5" />
          Sửa
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          onClick={() => onDelete(quiz.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
