import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../../components/ui/card";
import type { AfterLessonQuizQuestion } from "../utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AfterLessonQuizScore {
  correct: number;
  total: number;
  percent: number;
}

interface Props {
  questions: AfterLessonQuizQuestion[];
  answers: Record<string, number>;
  submitted: boolean;
  score: AfterLessonQuizScore | null;
  passed: boolean;
  nextLessonTitle?: string;
  hasNextLesson: boolean;
  nextLessonCountdown: number | null;
  onSelectAnswer: (questionId: string, optionIndex: number) => void;
  onSubmit: () => void;
  onAdvanceToNextLesson: () => void;
}

export function AfterLessonQuizCard({
  questions,
  answers,
  submitted,
  score,
  passed,
  nextLessonTitle,
  hasNextLesson,
  nextLessonCountdown,
  onSelectAnswer,
  onSubmit,
  onAdvanceToNextLesson,
}: Props) {
  return (
    <Card className="overflow-hidden border-border/70 bg-card/90">
      <CardHeader className="border-b bg-muted/20 pb-4">
        <CardTitle className="text-lg">Quiz sau khi học xong bài học</CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-5">
        {questions.length ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4 text-sm text-primary">
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="h-4 w-4" />
                Đã mở quiz sau bài học
              </div>
              <p className="mt-1 text-xs text-primary/90">
                Đây là phần kiểm tra nhanh để chốt kiến thức của bài học hiện
                tại.
              </p>
            </div>

            <div className="grid gap-3">
              {questions.map((question, questionIndex) => (
                <div
                  key={question.id}
                  className="rounded-3xl border border-border/60 bg-card p-4 shadow-sm"
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <Badge variant="outline" className="rounded-full">
                      Câu {questionIndex + 1}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Quiz sau bài học
                    </span>
                  </div>
                  <p className="text-sm font-medium leading-6 text-foreground">
                    {question.question}
                  </p>
                  <div className="mt-3 grid gap-2">
                    {question.options.map((option, optionIndex) => {
                      const isSelected = answers[question.id] === optionIndex;
                      const isCorrectOption =
                        question.answerIndex === optionIndex;
                      const optionClass = submitted
                        ? isCorrectOption
                          ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/10"
                          : isSelected
                            ? "border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/10"
                            : "border-border/60 bg-card text-foreground hover:border-primary/30 hover:bg-muted/60"
                        : isSelected
                          ? "border-primary bg-primary/10 text-primary hover:bg-primary/10"
                          : "border-border/60 bg-card text-foreground hover:border-primary/30 hover:bg-muted/60";

                      return (
                        <button
                          key={`${question.id}-${optionIndex}`}
                          disabled={submitted}
                          className={cn(
                            "flex min-w-0 w-full items-center gap-3 rounded-2xl border-2 p-3 text-left text-sm transition-all duration-200",
                            optionClass,
                            submitted ? "cursor-not-allowed opacity-80" : "cursor-pointer"
                          )}
                          onClick={() =>
                            onSelectAnswer(question.id, optionIndex)
                          }
                        >
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-black/5 text-[10px] font-semibold text-current">
                            {String.fromCharCode(65 + optionIndex)}
                          </span>
                          <span className="flex-1 min-w-0 break-words font-medium">
                            {option}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={onSubmit}
                >
                  Nộp quiz sau bài học
                </Button>
                {score ? (
                  <div className="rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm">
                    Bạn đúng{" "}
                    <span className="font-semibold">
                      {score.correct}/{score.total}
                    </span>{" "}
                    câu ({score.percent}%).
                  </div>
                ) : null}
              </div>

              {score && passed ? (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative overflow-hidden rounded-3xl border border-primary/30 bg-primary/5 p-4 shadow-sm"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.15),transparent_32%),radial-gradient(circle_at_bottom_left,hsl(var(--accent)/0.12),transparent_24%)]" />
                  <div className="relative space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-primary">
                          Hoàn thành rất tốt
                        </p>
                        <p className="mt-1 text-xs text-primary/90">
                          Confetti đã nổ. Màn hình sẽ tự chuyển sau{" "}
                          {nextLessonCountdown ?? 5}s.
                        </p>
                      </div>
                      {nextLessonCountdown !== null ? (
                        <span className="rounded-full border border-primary/30 bg-card/90 px-3 py-2 text-xs font-medium text-primary">
                          Tự động sau {nextLessonCountdown}s
                        </span>
                      ) : null}
                    </div>

                    <div className="rounded-2xl border border-primary/30 bg-card/80 p-3 text-sm text-foreground">
                      <p className="text-xs uppercase tracking-[0.16em] text-primary/90">
                        Bài tiếp theo
                      </p>
                      <p className="mt-1 font-semibold">
                        {nextLessonTitle ?? "Đây là bài cuối của khóa"}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={onAdvanceToNextLesson}
                      >
                        {hasNextLesson
                          ? "Học bài tiếp theo ngay"
                          : "Ôn lại bài đầu tiên"}
                      </Button>
                      <span className="text-xs text-primary/90">
                        {hasNextLesson
                          ? "Đi tiếp để giữ mạch học liên tục."
                          : "Bạn đã đi đến cuối lộ trình của khóa học."}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
            Bài học này chưa có quiz sau bài học từ API.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
