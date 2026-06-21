"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  assignmentTitle: string;
  onTitleChange: (title: string) => void;
  lessonTitle: string;
}

export function AssignmentForm({
  assignmentTitle,
  onTitleChange,
  lessonTitle,
}: Props) {
  return (
    <div className="mx-auto max-w-2xl space-y-5 rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
      <div className="grid gap-1.5">
        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          Tiêu đề bài tập
        </Label>
        <Input
          value={assignmentTitle}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder={`Bài tập: ${lessonTitle}`}
          className="h-10 border-border focus-visible:ring-1 focus-visible:ring-primary/30 rounded-xl"
        />
      </div>

      <div className="rounded-xl border border-border/50 bg-muted/20 p-4 text-xs leading-relaxed text-muted-foreground">
        Tạo hoạt động loại bài tập cho bài học hiện tại. Hệ thống sẽ tạo một biểu mẫu nộp bài để học viên gửi bài làm của mình.
      </div>
    </div>
  );
}
