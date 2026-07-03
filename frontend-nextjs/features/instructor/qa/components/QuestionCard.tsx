"use client";

import { useState } from "react";

import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  ThumbsUp,
  Send,
  Loader2,
  Clock,
  CornerDownRight,
  Award,
  MessageCircle,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  useLessonDiscussions,
  useCreateReply,
  useToggleBestAnswer,
} from "../discussion.hooks";
import type { QuestionItem, DiscussionReply } from "../types";

interface Props {
  question: QuestionItem;
  courseId?: number;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

function relativeTime(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: vi });
  } catch {
    return "";
  }
}

export function QuestionCard({ question, courseId }: Props) {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [showReplyBox, setShowReplyBox] = useState(false);

  const { data: lessonData, isLoading: isRepliesLoading } = useLessonDiscussions(
    question.lessonId,
    isExpanded,
  );

  const thread = lessonData?.data.find((root) => root.id === question.id);
  const replies: DiscussionReply[] = thread?.replies ?? [];

  const resolvedCourseId = courseId ?? question.courseId ?? 0;
  const createReply = useCreateReply(question.lessonId, resolvedCourseId);
  const toggleBestAnswer = useToggleBestAnswer(question.lessonId, resolvedCourseId);

  const isUnanswered = question.hasInstructorReply !== undefined
    ? !question.hasInstructorReply
    : question.replyCount === 0;

  const handleReply = () => {
    const text = replyText.trim();
    if (!text) return;
    createReply.mutate(
      { content: text, parentId: question.id },
      {
        onSuccess: () => {
          setReplyText("");
          setShowReplyBox(false);
        },
      },
    );
  };

  const userInitials = user
    ? `${user.firstName?.charAt(0) || ""}${user.lastName?.charAt(0) || ""}`.toUpperCase() || "GV"
    : "GV";

  return (
    <div className="relative rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-card p-4 transition-all hover:shadow-3xs">
      {/* Course/Lesson Context Path */}
      <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground/80 mb-3 pb-2 border-b border-zinc-100 dark:border-zinc-800/40">
        <div className="flex items-center gap-1 min-w-0 flex-1">
          {!courseId && question.courseName && (
            <>
              <span className="font-medium text-zinc-600 dark:text-zinc-400 truncate max-w-[100px] sm:max-w-[160px]">
                {question.courseName}
              </span>
              <span className="text-zinc-300 dark:text-zinc-700 shrink-0">/</span>
            </>
          )}
          <span className="truncate max-w-[140px] sm:max-w-[200px] text-zinc-500 dark:text-zinc-400">
            {question.lessonTitle}
          </span>
        </div>

        {/* Status badge */}
        <div className="shrink-0">
          {isUnanswered ? (
            <span className="inline-flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="hidden sm:inline">Chờ phản hồi</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="hidden sm:inline">Đã giải đáp</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Grid: Avatar on Left, Content on Right */}
      <div className="flex items-start gap-3.5">
        <Avatar className="h-9 w-9 shrink-0 ring-1 ring-border/50">
          {question.author.avatarUrl && (
            <AvatarImage src={question.author.avatarUrl} alt={question.author.name} />
          )}
          <AvatarFallback className="bg-zinc-100 text-xs font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            {getInitials(question.author.name)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          {/* Author Name and Date */}
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              {question.author.name}
            </span>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" />
              {relativeTime(question.createdAt)}
            </span>
          </div>

          {/* Question Content */}
          <p className="mt-1.5 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap break-words font-normal">
            {question.content}
          </p>

          {/* Action Footer */}
          <div className="mt-4 flex items-center gap-3 text-[11px] text-muted-foreground/80 border-t border-zinc-100 dark:border-zinc-800/40 pt-2.5">
            <button className="flex items-center gap-1 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">
              <ThumbsUp className="h-3.5 w-3.5 shrink-0" />
              <span>{question.upvotes || 0}</span>
            </button>

            <button
              onClick={() => setIsExpanded((v) => !v)}
              className="flex items-center gap-1 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
            >
              <MessageCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{replies.length || question.replyCount || 0}</span>
              <span className="hidden sm:inline"> phản hồi</span>
              {isExpanded ? (
                <ChevronUp className="h-3 w-3 shrink-0" />
              ) : (
                <ChevronDown className="h-3 w-3 shrink-0" />
              )}
            </button>

            <button
              onClick={() => {
                setIsExpanded(true);
                setShowReplyBox(true);
              }}
              className="ml-auto font-medium text-primary hover:underline transition-colors"
            >
              Trả lời
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Thread: Replies + Quick Reply Box */}
      {isExpanded && (
        <div className="mt-4 rounded-xl border border-zinc-100 bg-zinc-50/[0.4] p-3 sm:p-4 dark:bg-zinc-900/[0.2] dark:border-zinc-800/60">
          {replies.length > 0 && (
            <>
              <div className="mb-3 flex items-center justify-between border-b border-zinc-200/60 dark:border-zinc-800/40 pb-2">
                <h4 className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  <CornerDownRight className="h-3.5 w-3.5 text-primary shrink-0" />
                  Luồng thảo luận ({replies.length})
                </h4>
              </div>

              {isRepliesLoading ? (
                <div className="space-y-3 py-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex animate-pulse gap-3">
                      <div className="h-7 w-7 shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                      <div className="flex-1 space-y-1.5 pt-1">
                        <div className="h-3 w-28 rounded bg-zinc-200 dark:bg-zinc-800" />
                        <div className="h-3.5 w-full rounded bg-zinc-200 dark:bg-zinc-800" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="relative ml-1 space-y-3 border-l-[1.5px] border-zinc-200 dark:border-zinc-800 pl-3 sm:ml-3 sm:pl-4 mb-4">
                  {replies.map((reply) => (
                    <ReplyCard
                      key={reply.id}
                      reply={reply}
                      onToggleBestAnswer={() => toggleBestAnswer.mutate(reply.id)}
                      isBestAnswerPending={toggleBestAnswer.isPending}
                      currentUserId={user?.id}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Quick Reply Editor */}
          <div className={cn("pt-1", replies.length > 0 && "border-t border-zinc-200/60 dark:border-zinc-800/40 pt-3")}>
            {showReplyBox ? (
              <div className="flex items-start gap-2.5">
                <Avatar className="h-7 w-7 shrink-0 ring-1 ring-border/40 mt-1 hidden sm:block">
                  {user?.avatarUrl && (
                    <AvatarImage src={user.avatarUrl} alt={user.firstName || "Giảng viên"} />
                  )}
                  <AvatarFallback className="bg-zinc-100 text-[10px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="rounded-lg border border-zinc-250 bg-background focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/15 overflow-hidden transition-all dark:bg-background/95 dark:border-zinc-800">
                    <Textarea
                      placeholder="Nhập phản hồi..."
                      className="min-h-[64px] w-full resize-none border-0 bg-transparent px-3 py-2 text-xs sm:text-sm focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60 dark:text-foreground"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      disabled={createReply.isPending}
                    />
                    <div className="flex items-center justify-end gap-2 bg-zinc-50/50 border-t border-zinc-100 px-3 py-1.5 dark:bg-zinc-900/30 dark:border-zinc-800/60">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setShowReplyBox(false);
                          setReplyText("");
                        }}
                        disabled={createReply.isPending}
                      >
                        Huỷ
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 gap-1.5 rounded-md px-3 text-xs font-semibold"
                        disabled={!replyText.trim() || createReply.isPending}
                        onClick={handleReply}
                      >
                        {createReply.isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Send className="h-3 w-3" />
                        )}
                        Gửi
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="flex items-center gap-2.5 rounded-lg border border-zinc-200/80 bg-background/50 px-3 py-2 cursor-pointer hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950/20 dark:hover:border-zinc-700 transition-all"
                onClick={() => setShowReplyBox(true)}
              >
                <Avatar className="h-6 w-6 shrink-0 ring-1 ring-border/30">
                  {user?.avatarUrl && (
                    <AvatarImage src={user.avatarUrl} alt={user.firstName || "Giảng viên"} />
                  )}
                  <AvatarFallback className="bg-zinc-100 text-[9px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">Viết phản hồi...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface ReplyCardProps {
  reply: DiscussionReply;
  onToggleBestAnswer: () => void;
  isBestAnswerPending: boolean;
  currentUserId?: number;
}

function ReplyCard({ reply, onToggleBestAnswer, isBestAnswerPending, currentUserId }: ReplyCardProps) {
  const isInstructor = currentUserId && reply.author.id === currentUserId;
  return (
    <div
      className={cn(
        "relative rounded-lg border p-3 transition-all duration-200 shadow-3xs",
        reply.isBestAnswer
          ? "border-emerald-500/30 bg-emerald-500/[0.02] dark:bg-emerald-500/[0.04]"
          : "border-zinc-100 bg-background dark:border-zinc-850 dark:bg-zinc-950/20",
      )}
    >
      <div className="flex items-start gap-2.5">
        <Avatar className="h-7 w-7 shrink-0 ring-1 ring-border/30 shadow-3xs">
          {reply.author.avatarUrl && (
            <AvatarImage src={reply.author.avatarUrl} alt={reply.author.name} />
          )}
          <AvatarFallback className="bg-zinc-100 text-[10px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            {getInitials(reply.author.name)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-100">
                {reply.author.name}
              </span>
              {isInstructor && (
                <span className="rounded-sm bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-600 dark:bg-emerald-500/25 dark:text-emerald-400">
                  Giảng viên
                </span>
              )}
              {reply.isBestAnswer && (
                <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                  <Award className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                  Câu trả lời hay nhất
                </span>
              )}
              <span className="text-[10px] text-muted-foreground">
                • {relativeTime(reply.createdAt)}
              </span>
            </div>

            {reply.upvotes > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                <ThumbsUp className="h-2.5 w-2.5 text-primary" />
                {reply.upvotes}
              </span>
            )}
          </div>

          <p className="mt-1 text-xs sm:text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap font-normal break-words">
            {reply.content}
          </p>

          <div className="mt-2.5 flex items-center justify-end border-t border-zinc-100 dark:border-zinc-800/40 pt-1.5">
            <button
              onClick={onToggleBestAnswer}
              disabled={isBestAnswerPending}
              className={cn(
                "inline-flex items-center gap-1 text-[10px] font-semibold transition-all disabled:opacity-50 hover:underline",
                reply.isBestAnswer
                  ? "text-rose-500 dark:text-rose-400"
                  : "text-emerald-600 dark:text-emerald-400",
              )}
            >
              <CheckCircle2 className="h-3 w-3 shrink-0" />
              {reply.isBestAnswer ? "Hủy Best Answer" : "Đánh dấu Best Answer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
