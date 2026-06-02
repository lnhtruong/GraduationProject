"use client";

import { useEffect, useMemo, useRef } from "react";
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
  quizTimestamp: string;
  onTimestampChange: (timestamp: string) => void;
  canUseInVideoQuiz: boolean;
  lessonVideoUrl?: string;
  lessonVideoDuration?: number;
}

function toTimestamp(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const totalMillis = Math.round(safe * 1000);
  const wholeSeconds = Math.floor(totalMillis / 1000);
  const hours = Math.floor(wholeSeconds / 3600);
  const minutes = Math.floor((wholeSeconds % 3600) / 60);
  const seconds = wholeSeconds % 60;
  const millis = totalMillis % 1000;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
}

function timestampToSeconds(timestamp: string): number {
  const [base = "00:00:00", decimal = "0"] = timestamp.split(".");
  const [h = "0", m = "0", s = "0"] = base.split(":");
  const millis = Number(decimal.slice(0, 3).padEnd(3, "0"));
  return Number(h) * 3600 + Number(m) * 60 + Number(s) + millis / 1000;
}

function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const totalMillis = Math.round(safe * 1000);
  const wholeSeconds = Math.floor(totalMillis / 1000);
  const hours = Math.floor(wholeSeconds / 3600);
  const minutes = Math.floor((wholeSeconds % 3600) / 60);
  const seconds = wholeSeconds % 60;
  const millis = totalMillis % 1000;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
}

export function QuizModeSection({
  quizMode,
  onQuizModeChange,
  quizTimestamp,
  onTimestampChange,
  canUseInVideoQuiz,
  lessonVideoUrl,
  lessonVideoDuration,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const safeDuration = Math.max(0, Number(lessonVideoDuration ?? 0));

  useEffect(() => {
    if (!canUseInVideoQuiz && quizMode === "in_video") {
      onQuizModeChange("outside_video");
    }
  }, [canUseInVideoQuiz, onQuizModeChange, quizMode]);

  const syncFromVideoTime = (currentTime: number) => {
    onTimestampChange(toTimestamp(currentTime));
  };

  const selectedSeconds = useMemo(() => {
    if (!safeDuration) {
      return 0;
    }
    const raw = timestampToSeconds(quizTimestamp);
    return Math.min(safeDuration, Math.max(0, raw));
  }, [quizTimestamp, safeDuration]);

  useEffect(() => {
    const element = videoRef.current;
    if (!element || safeDuration === 0) {
      return;
    }

    const diff = Math.abs(element.currentTime - selectedSeconds);
    if (diff > 0.05) {
      element.currentTime = selectedSeconds;
    }
  }, [selectedSeconds, safeDuration]);

  return (
    <div className="grid gap-4 rounded-2xl border border-border/60 bg-muted/15 p-4">
      {/* Quiz Mode Selector */}
      <div className="grid gap-2">
        <Label>Vị trí quiz</Label>
        <p className="text-xs text-muted-foreground">
          Chọn &quot;Ngoài video&quot; nếu bạn muốn tạo quiz ngay. Chọn
          &quot;Trong video&quot; chỉ khi video đã có thời lượng để lấy mốc.
        </p>
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
            {canUseInVideoQuiz ? (
              <SelectItem value="in_video">Trong video</SelectItem>
            ) : null}
          </SelectContent>
        </Select>
      </div>

      {/* Timeline selector for in-video mode */}
      {quizMode === "in_video" ? (
        <div className="grid gap-3 rounded-xl border border-border/60 bg-background/70 p-3">
          <Label>Chọn mốc quiz trên timeline video</Label>

          {lessonVideoUrl ? (
            <div className="overflow-hidden rounded-lg border border-border/60 bg-black">
              <video
                ref={videoRef}
                className="h-auto max-h-56 w-full object-contain"
                src={lessonVideoUrl}
                controls
                preload="metadata"
                playsInline
                onSeeked={(event) => {
                  syncFromVideoTime(event.currentTarget.currentTime);
                }}
                onPause={(event) => {
                  syncFromVideoTime(event.currentTarget.currentTime);
                }}
              >
                Trình duyệt không hỗ trợ phát video.
              </video>
            </div>
          ) : null}

          <div className="space-y-2">
            <input
              type="range"
              min={0}
              max={safeDuration || 0}
              step={0.001}
              value={selectedSeconds}
              disabled={!canUseInVideoQuiz || safeDuration === 0}
              onChange={(event) => {
                const nextValue = Number(event.target.value || 0);
                onTimestampChange(toTimestamp(nextValue));
              }}
              className="w-full"
            />

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Mốc chọn: {quizTimestamp}</span>
              <span>
                {formatClock(selectedSeconds)} / {formatClock(safeDuration)}
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
