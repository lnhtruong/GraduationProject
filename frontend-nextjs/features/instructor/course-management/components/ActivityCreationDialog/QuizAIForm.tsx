"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export interface QuizAIFormValues {
  name: string;
  difficulty: "easy" | "medium" | "hard" | "mixed";
  numQuestions: number;
  language: string;
  startTime?: string;
  endTime?: string;
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
}

export function QuizAIForm({ lessonTitle, hasVideo, isPending, onSubmit }: Props) {
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
    if (startTime.trim()) payload.startTime = startTime.trim();
    if (endTime.trim()) payload.endTime = endTime.trim();
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {/* Name */}
        <div className="grid gap-2 md:col-span-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Tiêu đề Quiz AI
          </Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nhập tiêu đề quiz..."
            required
            className="h-10 border-border focus-visible:ring-1 focus-visible:ring-primary/30"
          />
        </div>

        {/* Difficulty */}
        <div className="grid gap-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Độ khó</Label>
          <Select value={difficulty} onValueChange={(v: any) => setDifficulty(v)}>
            <SelectTrigger className="h-10 bg-background border-border">
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

        {/* Num Questions */}
        <div className="grid gap-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Số lượng câu hỏi</Label>
          <Select value={String(numQuestions)} onValueChange={(v) => setNumQuestions(Number(v))}>
            <SelectTrigger className="h-10 bg-background border-border">
              <SelectValue placeholder="Chọn số lượng..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 câu</SelectItem>
              <SelectItem value="10">10 câu</SelectItem>
              <SelectItem value="15">15 câu</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Language */}
        <div className="grid gap-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ngôn ngữ</Label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="h-10 bg-background border-border">
              <SelectValue placeholder="Chọn ngôn ngữ..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vi">Tiếng Việt</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Passing Score */}
        <div className="grid gap-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Điểm đạt (%)</Label>
          <Input
            type="number"
            min={0}
            max={100}
            value={passingScore}
            onChange={(e) => setPassingScore(Number(e.target.value))}
            className="h-10 border-border"
          />
        </div>

        {/* Time Limit */}
        <div className="grid gap-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Thời gian làm bài (Phút)</Label>
          <Input
            type="number"
            min={0}
            value={timeLimitMinutes}
            onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
            placeholder="0 (Không giới hạn)"
            className="h-10 border-border"
          />
        </div>

        {/* Quiz Mode (isInVideo) */}
        <div className="grid gap-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Hình thức Quiz</Label>
          <Select
            value={isInVideo ? "in_video" : "after_lesson"}
            onValueChange={(v) => setIsInVideo(v === "in_video")}
            disabled={!hasVideo}
          >
            <SelectTrigger className="h-10 bg-background border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="after_lesson">Làm sau bài học (Post-lesson)</SelectItem>
              {hasVideo && <SelectItem value="in_video">Pop-up trong video (In-video)</SelectItem>}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Scoping details (Optional) */}
      <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-bold uppercase tracking-wider text-foreground">Giới hạn khoảng thời gian video (Tùy chọn)</Label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label className="text-xs text-muted-foreground">Bắt đầu từ (giây)</Label>
            <Input
              type="number"
              min={0}
              placeholder="Ví dụ: 60"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="h-10 border-border bg-background"
            />
          </div>
          <div className="grid gap-2">
            <Label className="text-xs text-muted-foreground">Kết thúc tại (giây)</Label>
            <Input
              type="number"
              min={0}
              placeholder="Ví dụ: 300"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="h-10 border-border bg-background"
            />
          </div>
        </div>
      </div>

      {/* Shuffling options */}
      <div className="flex flex-wrap gap-6 border-t border-border/40 pt-4">
        <div className="flex items-center gap-2">
          <Switch id="shuffle-q-ai" checked={shuffleQuestion} onCheckedChange={setShuffleQuestion} />
          <Label htmlFor="shuffle-q-ai" className="text-sm font-medium cursor-pointer">Xáo trộn câu hỏi</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="shuffle-o-ai" checked={shuffleOption} onCheckedChange={setShuffleOption} />
          <Label htmlFor="shuffle-o-ai" className="text-sm font-medium cursor-pointer">Xáo trộn đáp án</Label>
        </div>
      </div>
    </form>
  );
}
