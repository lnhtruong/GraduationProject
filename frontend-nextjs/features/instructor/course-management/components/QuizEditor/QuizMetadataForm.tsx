"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  title: string;
  onTitleChange: (title: string) => void;
  passingScore: number;
  onPassingScoreChange: (score: number) => void;
  description: string;
  onDescriptionChange: (description: string) => void;
  isInVideo: boolean;
  onIsInVideoChange: (isInVideo: boolean) => void;
  totalQuestions: number;
}

export function QuizMetadataForm({
  title,
  onTitleChange,
  passingScore,
  onPassingScoreChange,
  description,
  onDescriptionChange,
  isInVideo,
  onIsInVideoChange,
  totalQuestions,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="grid gap-2">
          <Label className="text-sm font-medium">Tiêu đề quiz</Label>
          <Input
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label className="text-sm font-medium">Điểm đạt</Label>
          <Input
            type="number"
            value={passingScore}
            onChange={(event) =>
              onPassingScoreChange(Number(event.target.value || 0))
            }
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label className="text-sm font-medium">Mô tả</Label>
        <Textarea
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          className="min-h-20"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={isInVideo}
          onChange={(event) => onIsInVideoChange(event.target.checked)}
        />
        Quiz gắn mốc theo video
      </label>

      <div className="rounded-lg border border-dashed border-border/70 bg-background px-3 py-2 text-xs text-muted-foreground">
        Tổng câu hỏi: {totalQuestions}
      </div>
    </div>
  );
}
