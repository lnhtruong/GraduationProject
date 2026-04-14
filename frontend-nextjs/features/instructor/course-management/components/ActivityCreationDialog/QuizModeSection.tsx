"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  quizMode: "in_video" | "outside_video";
  onQuizModeChange: (mode: "in_video" | "outside_video") => void;
  timestampOptions: string[];
  quizTimestamp: string;
  onTimestampChange: (timestamp: string) => void;
  canUseInVideoQuiz: boolean;
}

export function QuizModeSection({
  quizMode,
  onQuizModeChange,
  timestampOptions,
  quizTimestamp,
  onTimestampChange,
  canUseInVideoQuiz,
}: Props) {
  return (
    <div className="grid gap-4 rounded-2xl border border-border/60 bg-muted/15 p-4 md:grid-cols-2">
      {/* Quiz Mode Selector */}
      <div className="grid gap-2">
        <Label>Vị trí quiz</Label>
        <Select
          value={quizMode}
          onValueChange={(value: "in_video" | "outside_video") =>
            onQuizModeChange(value)
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="outside_video">Ngoài video</SelectItem>
            <SelectItem value="in_video">Trong video</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Timestamp Selector or Info */}
      {quizMode === "in_video" ? (
        <div className="grid gap-2">
          <Label>Mốc thời gian mặc định (theo video)</Label>
          <Select
            value={quizTimestamp}
            onValueChange={onTimestampChange}
            disabled={!canUseInVideoQuiz}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  canUseInVideoQuiz
                    ? "Chọn mốc thời gian"
                    : "Bài học chưa có video hợp lệ"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {timestampOptions.map((timestamp) => (
                <SelectItem key={timestamp} value={timestamp}>
                  {timestamp}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border/60 bg-background/60 px-3 py-2 text-xs text-muted-foreground">
          Quiz ngoài video sẽ không cần chọn timestamp.
        </div>
      )}
    </div>
  );
}
