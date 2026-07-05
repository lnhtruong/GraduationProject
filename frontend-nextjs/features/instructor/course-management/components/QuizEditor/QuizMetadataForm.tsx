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
}: Props) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="grid gap-1.5">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tiêu đề quiz</Label>
          <Input
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            className="h-10 border-border focus-visible:ring-1 focus-visible:ring-primary/30 rounded-xl"
            placeholder="Nhập tiêu đề cho bài kiểm tra..."
          />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Điểm đạt (%)</Label>
          <Input
            type="number"
            value={passingScore}
            onChange={(event) =>
              onPassingScoreChange(Number(event.target.value || 0))
            }
            className="h-10 border-border focus-visible:ring-1 focus-visible:ring-primary/30 rounded-xl"
            placeholder="80"
          />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mô tả</Label>
        <Textarea
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          className="min-h-20 resize-y border-border focus-visible:ring-1 focus-visible:ring-primary/30 rounded-xl"
          placeholder="Nhập hướng dẫn làm bài hoặc thông tin tổng quan..."
        />
      </div>
    </div>
  );
}
