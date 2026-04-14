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
    <div className="mx-auto max-w-2xl space-y-4 rounded-2xl border border-border/60 bg-background p-5">
      <div className="grid gap-2">
        <Label>Tiêu đề bài tập</Label>
        <Input
          value={assignmentTitle}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder={`Bài tập: ${lessonTitle}`}
        />
      </div>

      <div className="rounded-xl border border-border/60 bg-muted/10 p-3 text-sm text-muted-foreground">
        Tạo activity loại bài tập cho bài học hiện tại.
      </div>
    </div>
  );
}
