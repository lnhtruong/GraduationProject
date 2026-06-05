"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  MessageSquarePlus,
  ThumbsUp,
  Send,
  Loader2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  useLessonDiscussions,
  useCreateReply,
  useToggleBestAnswer,
} from "../discussion.hooks";
import type { QuestionItem, DiscussionReply } from "../types";

interface Props {
  question: QuestionItem;
  courseId: number;
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [showReplyBox, setShowReplyBox] = useState(false);

  const { data: lessonData, isLoading: isRepliesLoading } = useLessonDiscussions(
    question.lessonId,
    isExpanded,
  );

  // Find the specific question's replies from the lesson data
  const thread = lessonData?.data.find((root) => root.id === question.id);
  const replies: DiscussionReply[] = thread?.replies ?? [];

  const createReply = useCreateReply(question.lessonId, courseId);
  const toggleBestAnswer = useToggleBestAnswer(question.lessonId, courseId);

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

  return (
    <div className="rounded-xl border border-border/60 bg-card transition-all hover:border-border">
      {/* Question header */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <Avatar className="mt-0.5 h-8 w-8 shrink-0">
            {question.author.avatarUrl && (
              <AvatarImage src={question.author.avatarUrl} alt={question.author.name} />
            )}
            <AvatarFallback className="bg-primary/10 text-[11px] font-semibold text-primary">
              {getInitials(question.author.name)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold">{question.author.name}</span>
              <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">
                {question.lessonTitle}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {relativeTime(question.createdAt)}
              </span>
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-foreground">
              {question.content}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {question.upvotes > 0 && (
                <span className="flex items-center gap-1">
                  <ThumbsUp className="h-3 w-3" />
                  {question.upvotes}
                </span>
              )}
              <span className="flex items-center gap-1">
                <MessageSquarePlus className="h-3 w-3" />
                {question.replyCount} trả lời
              </span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 gap-1.5 text-xs text-muted-foreground"
            onClick={() => setIsExpanded((v) => !v)}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" />
                Thu gọn
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" />
                Xem trả lời
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Expanded: replies + reply form */}
      {isExpanded && (
        <div className="border-t border-border/60 bg-muted/20 px-4 py-3 sm:px-5">
          {isRepliesLoading ? (
            <div className="space-y-3 py-2">
              {[1, 2].map((i) => (
                <div key={i} className="flex animate-pulse gap-3">
                  <div className="h-7 w-7 shrink-0 rounded-full bg-muted/50" />
                  <div className="flex-1 space-y-1.5 pt-1">
                    <div className="h-3 w-24 rounded bg-muted/50" />
                    <div className="h-3 w-full rounded bg-muted/50" />
                  </div>
                </div>
              ))}
            </div>
          ) : replies.length === 0 ? (
            <p className="py-2 text-xs text-muted-foreground italic">
              Chưa có trả lời nào. Hãy là người đầu tiên trả lời!
            </p>
          ) : (
            <div className="space-y-3">
              {replies.map((reply) => (
                <ReplyCard
                  key={reply.id}
                  reply={reply}
                  onToggleBestAnswer={() => toggleBestAnswer.mutate(reply.id)}
                  isBestAnswerPending={toggleBestAnswer.isPending}
                />
              ))}
            </div>
          )}

          {/* Reply form */}
          <div className="mt-3 border-t border-border/40 pt-3">
            {showReplyBox ? (
              <div className="space-y-2">
                <Textarea
                  placeholder="Nhập câu trả lời của bạn..."
                  className="h-24 resize-none text-sm"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  disabled={createReply.isPending}
                />
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
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
                    className="gap-1.5"
                    disabled={!replyText.trim() || createReply.isPending}
                    onClick={handleReply}
                  >
                    {createReply.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    Gửi trả lời
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => setShowReplyBox(true)}
              >
                <MessageSquarePlus className="h-3.5 w-3.5" />
                Trả lời
              </Button>
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
}

function ReplyCard({ reply, onToggleBestAnswer, isBestAnswerPending }: ReplyCardProps) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-lg p-3 transition-colors",
        reply.isBestAnswer
          ? "border border-emerald-200 bg-emerald-50/60 dark:border-emerald-800/40 dark:bg-emerald-900/20"
          : "bg-background/60",
      )}
    >
      <Avatar className="mt-0.5 h-7 w-7 shrink-0">
        {reply.author.avatarUrl && (
          <AvatarImage src={reply.author.avatarUrl} alt={reply.author.name} />
        )}
        <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
          {getInitials(reply.author.name)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold">{reply.author.name}</span>
          {reply.isBestAnswer && (
            <span className="flex items-center gap-0.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
              <CheckCircle2 className="h-2.5 w-2.5" />
              Best Answer
            </span>
          )}
          <span className="text-[10px] text-muted-foreground">
            {relativeTime(reply.createdAt)}
          </span>
          {reply.upvotes > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <ThumbsUp className="h-2.5 w-2.5" />
              {reply.upvotes}
            </span>
          )}
        </div>
        <p className="text-xs leading-relaxed text-foreground/90">{reply.content}</p>

        <button
          onClick={onToggleBestAnswer}
          disabled={isBestAnswerPending}
          className={cn(
            "flex items-center gap-1 text-[10px] font-medium transition-colors disabled:opacity-50",
            reply.isBestAnswer
              ? "text-emerald-600 hover:text-destructive dark:text-emerald-400"
              : "text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400",
          )}
        >
          <CheckCircle2 className="h-2.5 w-2.5" />
          {reply.isBestAnswer ? "Bỏ đánh dấu" : "Đánh dấu Best Answer"}
        </button>
      </div>
    </div>
  );
}
