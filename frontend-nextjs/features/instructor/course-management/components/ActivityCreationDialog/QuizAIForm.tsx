"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import type React from "react";
import { Sparkles, Languages, Trophy, Timer, Video, Shuffle, Play, Pause, RotateCcw, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { Quiz } from "@/features/quizzes/types";

export interface QuizAIFormValues {
  name: string;
  difficulty: "easy" | "medium" | "hard" | "mixed";
  numQuestions: number;
  language: string;
  startTime?: number;
  endTime?: number;
  shuffleQuestion: boolean;
  shuffleOption: boolean;
  passingScore: number;
  timeLimitMinutes: number;
  isInVideo: boolean;
}

interface Props {
  lessonTitle: string;
  hasVideo: boolean;
  isPending: boolean;
  onSubmit: (values: QuizAIFormValues) => void;
  onCancel: () => void;
  existingQuizzes?: Quiz[];
  videoDurationSeconds?: number;
  videoUrl?: string;
}

function parseTimestampToSeconds(ts: string | null | undefined): number | null {
  if (!ts) return null;
  const match = ts.trim().match(/^(\d{2}):(\d{2}):(\d{2})[.,](\d{3})$/);
  if (!match) return null;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const seconds = parseInt(match[3], 10);
  const milliseconds = parseInt(match[4], 10);
  return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
}

function formatSeconds(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  if (h > 0) {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function parseTimeToSeconds(input: string): number | null {
  const clean = input.trim();
  if (!clean) return null;

  if (/^\d+$/.test(clean)) {
    return parseInt(clean, 10);
  }

  const parts = clean.split(":");
  if (parts.length === 2) {
    const m = parseInt(parts[0], 10);
    const s = parseInt(parts[1], 10);
    if (!isNaN(m) && !isNaN(s)) {
      return m * 60 + s;
    }
  } else if (parts.length === 3) {
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const s = parseInt(parts[2], 10);
    if (!isNaN(h) && !isNaN(m) && !isNaN(s)) {
      return h * 3600 + m * 60 + s;
    }
  }
  return null;
}

interface TimeScopingSuggestion {
  type: "all" | "suggested" | "fully_covered";
  startTime: number;
  endTime: number;
}

function calculateSmartTimeScoping(
  quizzes: Quiz[] | undefined,
  duration: number
): TimeScopingSuggestion {
  if (!duration || duration <= 0) {
    return { type: "all", startTime: 0, endTime: 0 };
  }

  const occupiedSeconds: number[] = [];
  if (quizzes) {
    for (const quiz of quizzes) {
      if (quiz.isInVideo && quiz.questions) {
        for (const question of quiz.questions) {
          const sec = parseTimestampToSeconds(question.videoTimestamp);
          if (sec !== null && sec <= duration) {
            occupiedSeconds.push(sec);
          }
        }
      }
    }
  }

  if (occupiedSeconds.length === 0) {
    return { type: "all", startTime: 0, endTime: duration };
  }

  const blockedIntervals = occupiedSeconds.map((t) => ({
    start: Math.max(0, t - 60),
    end: Math.min(duration, t + 15),
  }));

  blockedIntervals.sort((a, b) => a.start - b.start);

  const mergedBlocked: { start: number; end: number }[] = [];
  if (blockedIntervals.length > 0) {
    let current = { ...blockedIntervals[0] };
    for (let i = 1; i < blockedIntervals.length; i++) {
      const next = blockedIntervals[i];
      if (next.start <= current.end) {
        current.end = Math.max(current.end, next.end);
      } else {
        mergedBlocked.push(current);
        current = { ...next };
      }
    }
    mergedBlocked.push(current);
  }

  const freeSegments: { start: number; end: number }[] = [];
  if (mergedBlocked.length === 0) {
    freeSegments.push({ start: 0, end: duration });
  } else {
    if (mergedBlocked[0].start > 0) {
      freeSegments.push({ start: 0, end: mergedBlocked[0].start });
    }
    for (let i = 0; i < mergedBlocked.length - 1; i++) {
      freeSegments.push({
        start: mergedBlocked[i].end,
        end: mergedBlocked[i + 1].start,
      });
    }
    if (mergedBlocked[mergedBlocked.length - 1].end < duration) {
      freeSegments.push({
        start: mergedBlocked[mergedBlocked.length - 1].end,
        end: duration,
      });
    }
  }

  const viableSegments = freeSegments.filter((seg) => seg.end - seg.start >= 30);

  if (viableSegments.length === 0) {
    return { type: "fully_covered", startTime: 0, endTime: duration };
  }

  let largest = viableSegments[0];
  for (let i = 1; i < viableSegments.length; i++) {
    if (viableSegments[i].end - viableSegments[i].start > largest.end - largest.start) {
      largest = viableSegments[i];
    }
  }

  return {
    type: "suggested",
    startTime: Math.floor(largest.start),
    endTime: Math.floor(largest.end),
  };
}

export function QuizAIForm({
  lessonTitle,
  hasVideo,
  isPending,
  onSubmit,
  onCancel,
  existingQuizzes,
  videoDurationSeconds,
  videoUrl,
}: Props) {
  const [name, setName] = useState(`AI Quiz - ${lessonTitle}`);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard" | "mixed">("mixed");
  const [numQuestions, setNumQuestions] = useState(10);
  const [language, setLanguage] = useState("vi");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [shuffleQuestion, setShuffleQuestion] = useState(false);
  const [shuffleOption, setShuffleOption] = useState(false);
  const [passingScore, setPassingScore] = useState(80);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(0);
  const [isInVideo, setIsInVideo] = useState(hasVideo);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [hasManuallyEdited, setHasManuallyEdited] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const safeDuration = Math.max(0, Number(videoDurationSeconds ?? 0));
  const [currentSeconds, setCurrentSeconds] = useState(0);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startSeconds, setStartSeconds] = useState(0);
  const [showSwipeIndicator, setShowSwipeIndicator] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<"forward" | "backward" | null>(null);

  const formatClock = (totalSeconds: number): string => {
    const safe = Math.max(0, totalSeconds);
    const totalMillis = Math.round(safe * 1000);
    const wholeSeconds = Math.floor(totalMillis / 1000);
    const hours = Math.floor(wholeSeconds / 3600);
    const minutes = Math.floor((wholeSeconds % 3600) / 60);
    const seconds = wholeSeconds % 60;
    const millis = totalMillis % 1000;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
  };

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch((err) => console.log("Play error:", err));
    }
  };

  // Video Drag-to-Seek Handlers (Gestures on Video Screen)
  const handleVideoMouseDown = (e: React.MouseEvent<HTMLVideoElement>) => {
    if (!videoRef.current || !safeDuration) return;
    setIsMouseDown(true);
    setStartX(e.clientX);
    setStartSeconds(videoRef.current.currentTime);
  };

  const handleVideoMouseMove = (e: React.MouseEvent<HTMLVideoElement>) => {
    if (!isMouseDown || !videoRef.current || !safeDuration) return;
    const diffX = e.clientX - startX;
    
    // 1px clientX equivalent to 0.15 seconds
    const seekDelta = diffX * 0.15;
    let nextSeconds = startSeconds + seekDelta;
    nextSeconds = Math.min(safeDuration, Math.max(0, nextSeconds));
    
    videoRef.current.currentTime = nextSeconds;
    setCurrentSeconds(nextSeconds);

    if (Math.abs(diffX) > 8) {
      setShowSwipeIndicator(true);
      setSwipeDirection(diffX > 0 ? "forward" : "backward");
    }
  };

  const handleVideoMouseUp = () => {
    setIsMouseDown(false);
    setShowSwipeIndicator(false);
    setSwipeDirection(null);
  };

  const handleVideoMouseLeave = () => {
    if (isMouseDown) {
      setIsMouseDown(false);
      setShowSwipeIndicator(false);
      setSwipeDirection(null);
    }
  };

  const handleSetStartFromCurrent = () => {
    if (videoRef.current) {
      setStartTime(formatSeconds(videoRef.current.currentTime));
      setHasManuallyEdited(true);
    }
  };

  const handleSetEndFromCurrent = () => {
    if (videoRef.current) {
      setEndTime(formatSeconds(videoRef.current.currentTime));
      setHasManuallyEdited(true);
    }
  };
  const suggestion = useMemo(() => {
    return calculateSmartTimeScoping(existingQuizzes, videoDurationSeconds || 0);
  }, [existingQuizzes, videoDurationSeconds]);

  useEffect(() => {
    if (suggestion && !hasManuallyEdited) {
      if (suggestion.type === "suggested") {
        setStartTime(formatSeconds(suggestion.startTime));
        setEndTime(formatSeconds(suggestion.endTime));
        if (videoRef.current) {
          videoRef.current.currentTime = suggestion.startTime;
          setCurrentSeconds(suggestion.startTime);
        }
      } else {
        setStartTime("");
        setEndTime("");
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
          setCurrentSeconds(0);
        }
      }
    }
  }, [suggestion, hasManuallyEdited]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: QuizAIFormValues = {
      name,
      difficulty,
      numQuestions,
      language,
      shuffleQuestion,
      shuffleOption,
      passingScore,
      timeLimitMinutes,
      isInVideo,
    };
    if (startTime.trim()) {
      const parsedStart = parseTimeToSeconds(startTime);
      if (parsedStart !== null) {
        payload.startTime = parsedStart;
      }
    }
    if (endTime.trim()) {
      const parsedEnd = parseTimeToSeconds(endTime);
      if (parsedEnd !== null) {
        payload.endTime = parsedEnd;
      }
    }
    onSubmit(payload);
  };

  return (
    <form id="quiz-ai-form" onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-200">
      {/* Card 1: Core settings & Advanced Options */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm space-y-5">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2 pb-3 border-b border-border/40">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </span>
          Cấu hình cơ bản
        </h3>
        
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Name */}
          <div className="grid gap-1.5 sm:col-span-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              Tiêu đề Quiz AI
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tiêu đề quiz..."
              required
              className="h-10 border-border focus-visible:ring-1 focus-visible:ring-primary/30 rounded-xl"
            />
          </div>

          {/* Num Questions */}
          <div className="grid gap-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              Số lượng câu hỏi
            </Label>
            <Select value={String(numQuestions)} onValueChange={(v) => setNumQuestions(Number(v))}>
              <SelectTrigger className="h-10 bg-background border-border rounded-xl">
                <SelectValue placeholder="Chọn số lượng..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 câu</SelectItem>
                <SelectItem value="10">10 câu</SelectItem>
                <SelectItem value="15">15 câu</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quiz Mode (isInVideo) */}
          <div className="grid gap-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Video className="h-3.5 w-3.5 text-muted-foreground/70" />
              Hình thức Quiz
            </Label>
            <Select
              value={isInVideo ? "in_video" : "after_lesson"}
              onValueChange={(v) => setIsInVideo(v === "in_video")}
              disabled={!hasVideo}
            >
              <SelectTrigger className="h-10 bg-background border-border rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="after_lesson">Làm sau bài học (Post-lesson)</SelectItem>
                {hasVideo && <SelectItem value="in_video">Pop-up trong video (In-video)</SelectItem>}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Advanced options section */}
        <div className="border-t border-border/40 pt-4 mt-2">
          <label
            htmlFor="show-advanced-toggle"
            className="w-full flex items-center justify-between py-2 px-3 hover:bg-muted/30 rounded-xl transition-all duration-200 text-left cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                <Shuffle className="h-4 w-4" />
              </span>
              <span className="text-sm font-bold text-foreground">Tùy chọn nâng cao</span>
            </div>
            <Switch
              id="show-advanced-toggle"
              checked={showAdvanced}
              onCheckedChange={setShowAdvanced}
            />
          </label>
          
          {showAdvanced && (
            <div className="mt-4 px-3 space-y-5 animate-in fade-in duration-200">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Difficulty */}
                <div className="grid gap-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Độ khó
                  </Label>
                  <Select value={difficulty} onValueChange={(v: "easy" | "medium" | "hard" | "mixed") => setDifficulty(v)}>
                    <SelectTrigger className="h-10 bg-background border-border rounded-xl">
                      <SelectValue placeholder="Chọn độ khó..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mixed">Hỗn hợp (Mixed)</SelectItem>
                      <SelectItem value="easy">Dễ (Easy)</SelectItem>
                      <SelectItem value="medium">Trung bình (Medium)</SelectItem>
                      <SelectItem value="hard">Khó (Hard)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Language */}
                <div className="grid gap-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Languages className="h-3.5 w-3.5 text-muted-foreground/70" />
                    Ngôn ngữ
                  </Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="h-10 bg-background border-border rounded-xl">
                      <SelectValue placeholder="Chọn ngôn ngữ..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vi">Tiếng Việt</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Passing Score */}
                <div className="grid gap-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Trophy className="h-3.5 w-3.5 text-muted-foreground/70" />
                    Điểm đạt (%)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={passingScore}
                    onChange={(e) => setPassingScore(Number(e.target.value))}
                    className="h-10 border-border rounded-xl"
                  />
                </div>

                {/* Time Limit */}
                <div className="grid gap-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Timer className="h-3.5 w-3.5 text-muted-foreground/70" />
                    Thời gian làm bài (Phút)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={timeLimitMinutes}
                    onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                    placeholder="0 (Không giới hạn)"
                    className="h-10 border-border rounded-xl"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 pt-4 border-t border-border/20">
                <div className="flex items-center justify-between rounded-xl border border-border/50 p-3 bg-muted/10 hover:bg-muted/20 transition-colors">
                  <Label htmlFor="shuffle-q-ai" className="text-sm font-semibold cursor-pointer">Xáo trộn câu hỏi</Label>
                  <Switch id="shuffle-q-ai" checked={shuffleQuestion} onCheckedChange={setShuffleQuestion} />
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border/50 p-3 bg-muted/10 hover:bg-muted/20 transition-colors">
                  <Label htmlFor="shuffle-o-ai" className="text-sm font-semibold cursor-pointer">Xáo trộn đáp án</Label>
                  <Switch id="shuffle-o-ai" checked={shuffleOption} onCheckedChange={setShuffleOption} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Card 2: Timeline scoping & Large Video Player */}
      {hasVideo && (
        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2 pb-3 border-b border-border/40">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/10 text-sky-500">
              <Video className="h-4 w-4" />
            </span>
            Phạm vi Video (Tùy chọn)
          </h3>
          <p className="text-xs text-muted-foreground leading-normal">
            Giới hạn khoảng thời gian trong video để AI tập trung sinh câu hỏi. Bỏ trống để phân tích toàn bộ video.
          </p>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">Bắt đầu từ</Label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Ví dụ: 01:00 hoặc 60"
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value);
                    setHasManuallyEdited(true);
                  }}
                  className={cn(
                    "h-10 border-border bg-background rounded-xl",
                    videoUrl && "pr-9"
                  )}
                />
                {videoUrl && (
                  <button
                    type="button"
                    onClick={handleSetStartFromCurrent}
                    title="Lấy mốc thời gian hiện tại từ video"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  >
                    <Timer className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">Kết thúc tại</Label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Ví dụ: 05:00 hoặc 300"
                  value={endTime}
                  onChange={(e) => {
                    setEndTime(e.target.value);
                    setHasManuallyEdited(true);
                  }}
                  className={cn(
                    "h-10 border-border bg-background rounded-xl",
                    videoUrl && "pr-9"
                  )}
                />
                {videoUrl && (
                  <button
                    type="button"
                    onClick={handleSetEndFromCurrent}
                    title="Lấy mốc thời gian hiện tại từ video"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  >
                    <Timer className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Smart Recommendation Banner */}
          {videoDurationSeconds !== undefined && videoDurationSeconds > 0 && (
            <div className={cn(
              "rounded-xl p-3 border text-xs flex flex-col gap-1.5 transition-all duration-200 mt-2",
              suggestion.type === "all" && "bg-emerald-500/5 border-emerald-500/20 text-emerald-700 dark:text-emerald-300",
              suggestion.type === "suggested" && "bg-sky-500/5 border-sky-500/20 text-sky-700 dark:text-sky-300",
              suggestion.type === "fully_covered" && "bg-amber-500/5 border-amber-500/20 text-amber-700 dark:text-amber-300"
            )}>
              {suggestion.type === "all" && (
                <div className="font-medium flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 animate-pulse text-amber-500 shrink-0" />
                  <span>Tự động đề xuất toàn bộ thời lượng video.</span>
                </div>
              )}
              {suggestion.type === "suggested" && (
                <div className="flex flex-col gap-1.5">
                  <div className="font-medium flex items-start gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>
                      Gợi ý vùng chưa có quiz:{" "}
                      <strong className="underline">
                        {formatSeconds(suggestion.startTime)} - {formatSeconds(suggestion.endTime)}
                      </strong>{" "}
                      (tránh trùng ngữ cảnh).
                    </span>
                  </div>
                  {hasManuallyEdited && (
                    <button
                      type="button"
                      onClick={() => {
                        setStartTime(formatSeconds(suggestion.startTime));
                        setEndTime(formatSeconds(suggestion.endTime));
                        setHasManuallyEdited(false);
                        if (videoRef.current) {
                          videoRef.current.currentTime = suggestion.startTime;
                          setCurrentSeconds(suggestion.startTime);
                        }
                      }}
                      className="text-primary hover:underline font-bold text-left w-fit flex items-center gap-1 mt-0.5"
                    >
                      Sử dụng gợi ý này
                    </button>
                  )}
                </div>
              )}
              {suggestion.type === "fully_covered" && (
                <div className="font-medium flex items-start gap-1.5">
                  <span className="shrink-0 mt-0.5">⚠️</span>
                  <span>
                    Video đã được bao phủ bởi các quiz hiện tại. Bạn vẫn có thể sinh thêm bằng cách nhập khoảng thời gian thủ công.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Large video player preview */}
          {videoUrl && (
            <div className="relative group overflow-hidden rounded-xl border border-border bg-black shadow-lg mt-4">
              {/* Main Video Element */}
              <video
                ref={videoRef}
                className="mx-auto block h-auto max-h-[300px] w-full object-contain cursor-pointer select-none"
                src={videoUrl}
                preload="metadata"
                playsInline
                onClick={togglePlay}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onLoadedMetadata={(event) => {
                  if (suggestion && !hasManuallyEdited) {
                    event.currentTarget.currentTime = suggestion.startTime;
                    setCurrentSeconds(suggestion.startTime);
                  }
                }}
                onTimeUpdate={(event) => {
                  if (!isMouseDown) {
                    setCurrentSeconds(event.currentTarget.currentTime);
                  }
                }}
                onMouseDown={handleVideoMouseDown}
                onMouseMove={handleVideoMouseMove}
                onMouseUp={handleVideoMouseUp}
                onMouseLeave={handleVideoMouseLeave}
              />

              {/* Large Play Overlay on Pause */}
              {!isPlaying && !isMouseDown && (
                <div 
                  className="absolute inset-0 flex items-center justify-center bg-black/40 transition-all cursor-pointer"
                  onClick={togglePlay}
                >
                  <div className="p-4 rounded-full bg-background/95 text-foreground shadow-lg hover:scale-105 transition-transform duration-200">
                    <Play className="h-6 w-6 fill-foreground text-foreground" />
                  </div>
                </div>
              )}

              {/* Swipe/Drag gesture feedback Indicator */}
              {showSwipeIndicator && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white text-xs font-bold px-3 py-2 rounded-full flex items-center gap-1.5 shadow-md select-none pointer-events-none z-10 border border-white/10 animate-pulse">
                  {swipeDirection === "forward" ? (
                    <RotateCw className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <RotateCcw className="h-3.5 w-3.5 text-primary" />
                  )}
                  <span>Tua tới: {formatClock(currentSeconds)}</span>
                </div>
              )}

              {/* Custom Bottom Controller Bar */}
              <div className="absolute bottom-0 inset-x-0 bg-linear-to-t from-black/95 via-black/70 to-transparent p-3 pt-8 flex flex-col gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200 z-10">
                
                {/* Custom Progress Bar / Slider */}
                <div className="relative h-1.5 w-full bg-white/20 rounded-full cursor-pointer group/timeline">
                  {/* Progress fill */}
                  <div 
                    className="absolute h-full bg-primary rounded-full"
                    style={{ width: `${(currentSeconds / (safeDuration || 1)) * 100}%` }}
                  />
                  {/* Overlay Range Input for smooth slider handling */}
                  <input
                    type="range"
                    min={0}
                    max={safeDuration || 0}
                    step={0.1}
                    value={currentSeconds}
                    onChange={(event) => {
                      const nextValue = Number(event.target.value || 0);
                      setCurrentSeconds(nextValue);
                      if (videoRef.current) {
                        videoRef.current.currentTime = nextValue;
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                  />
                  {/* Thumb Indicator */}
                  <div 
                    className="absolute h-3.5 w-3.5 rounded-full bg-primary border-2 border-white -top-[4px] -translate-x-1/2 opacity-0 group-hover/timeline:opacity-100 transition-opacity duration-150 shadow-md pointer-events-none"
                    style={{ left: `${(currentSeconds / (safeDuration || 1)) * 100}%` }}
                  />
                </div>

                {/* Sub Controls Row */}
                <div className="flex items-center justify-between text-white text-xs font-semibold select-none">
                  <div className="flex items-center gap-3">
                    <button 
                      type="button" 
                      onClick={togglePlay} 
                      className="hover:text-primary transition-colors focus:outline-none p-1"
                    >
                      {isPlaying ? (
                        <Pause className="h-4 w-4 fill-white text-white" />
                      ) : (
                        <Play className="h-4 w-4 fill-white text-white" />
                      )}
                    </button>
                    <span className="font-mono text-[11px] tracking-wide text-zinc-200">
                      {formatClock(currentSeconds)} / {formatClock(safeDuration)}
                    </span>
                  </div>
                  <div>
                    <span className="bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-md text-[10px] font-bold">
                      Khoảng chạy: {startTime || "00:00"} - {endTime || formatSeconds(safeDuration)}
                    </span>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      )}
    </form>
  );
}
