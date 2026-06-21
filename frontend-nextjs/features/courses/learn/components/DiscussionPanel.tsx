"use client";

import { useEffect, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Loader2, MessageCircleMore, RefreshCw, ThumbsUp } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useLessonDiscussionsQuery,
  useCreateDiscussionMutation,
  useToggleUpvoteMutation,
} from "../api/discussions.hooks";
import { QuestionForm } from "./QuestionForm";
import { ReplyBox } from "./ReplyBox";
import { useAuthState } from "@/features/auth/hooks/useAuth";
import type { DiscussionPostRecord } from "../types";

interface Props {
  lessonId: number;
  lessonTitle: string;
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function formatRelativeTime(value: string) {
  return formatDistanceToNow(new Date(value), {
    addSuffix: true,
    locale: vi,
  }).replace(/^khoảng\s+/, "");
}

function DiscussionSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="rounded-3xl border border-border/60 bg-background/80 p-4 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <Skeleton className="h-11 w-11 rounded-full" />
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[92%]" />
              <Skeleton className="h-4 w-[72%]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DiscussionItem({
  post,
  isReply = false,
  onReplyClick,
  onUpvote,
  canInteract,
  voted,
}: {
  post: DiscussionPostRecord;
  isReply?: boolean;
  onReplyClick?: (postId: number) => void;
  onUpvote?: (postId: number) => void;
  canInteract?: boolean;
  voted?: boolean;
}) {
  return (
    <div
      className={
        isReply
          ? "rounded-2xl border border-emerald-100 bg-emerald-50/60 dark:border-emerald-950/40 dark:bg-emerald-950/20 p-4 shadow-[0_8px_24px_rgba(16,185,129,0.08)]"
          : "rounded-3xl border border-border/60 bg-background/95 p-4 shadow-[0_12px_32px_rgba(15,23,42,0.06)]"
      }
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-11 w-11 border border-border/60 bg-background">
          <AvatarImage
            src={post.author.avatarUrl ?? undefined}
            alt={post.author.name}
          />
          <AvatarFallback className="bg-muted text-sm font-semibold text-foreground">
            {getInitials(post.author.name)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-foreground">
              {post.author.name}
            </p>
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(post.createdAt)}
            </span>
            <button
              type="button"
              title={canInteract ? "Thích" : "Đăng nhập để tương tác"}
              onClick={() => onUpvote?.(post.id)}
              disabled={!canInteract}
              aria-pressed={Boolean(voted)}
              className={`inline-flex items-center gap-1 rounded-full border border-border/60 px-2 py-0.5 text-xs transition-colors ${
                voted
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
            >
              <ThumbsUp
                className={`h-3.5 w-3.5 ${voted ? "fill-current" : ""}`}
              />
              <span>{voted ? "Đã thích" : "Thích"}</span>
              {post.upvotes}
            </button>
          </div>

          {post.isBestAnswer ? (
            <Badge className="inline-flex w-fit rounded-full border-0 bg-emerald-600 px-3 py-1 text-[11px] font-semibold text-white shadow-sm hover:bg-emerald-600">
              ✅ Câu trả lời tốt nhất
            </Badge>
          ) : null}

          <p className="whitespace-pre-wrap text-sm leading-6 text-foreground/90">
            {post.content}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div />
        <div className="flex items-center gap-3">
          <button
            type="button"
            title={canInteract ? "Trả lời" : "Đăng nhập để tương tác"}
            onClick={() => onReplyClick?.(post.id)}
            disabled={!canInteract}
            className="text-sm text-muted-foreground"
          >
            Trả lời
          </button>
        </div>
      </div>

      {post.replies.length ? (
        <div className="mt-4 space-y-3 border-l-2 border-dashed border-emerald-200/80 dark:border-emerald-900/40 pl-4 sm:pl-5">
          {post.replies.map((reply) => (
            <DiscussionItem
              key={reply.id}
              post={reply}
              isReply
              onReplyClick={onReplyClick}
              onUpvote={onUpvote}
              canInteract={canInteract}
              voted={reply.voted}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function DiscussionPanel({ lessonId, lessonTitle }: Props) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const {
    data,
    isLoading: isInitialLoading,
    isFetchingNextPage: isLoadingMore,
    error: queryError,
    hasNextPage: hasMore,
    fetchNextPage: loadMore,
  } = useLessonDiscussionsQuery(lessonId);

  const createPostMutation = useCreateDiscussionMutation(lessonId);
  const toggleUpvoteMutation = useToggleUpvoteMutation(lessonId);

  const threads = data?.pages.flatMap((page) => page.data) ?? [];
  const total = data?.pages[0]?.total ?? 0;
  const error = queryError instanceof Error ? queryError.message : queryError ? String(queryError) : null;

  const { isAuthenticated } = useAuthState();
  const [openReplyFor, setOpenReplyFor] = useState<number | null>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        if (isInitialLoading || isLoadingMore || !hasMore) return;
        loadMore();
      },
      {
        root: null,
        rootMargin: "180px 0px",
        threshold: 0.01,
      },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isInitialLoading, isLoadingMore, loadMore]);

  const questionCountLabel = new Intl.NumberFormat("vi-VN").format(total);
  const showSkeleton = isInitialLoading && !threads.length;

  const handleCreateQuestion = async (content: string) => {
    await createPostMutation.mutateAsync({ content });
  };

  const handleReply = async (parentId: number, content: string) => {
    await createPostMutation.mutateAsync({ content, parentId });
    setOpenReplyFor(null);
  };

  const handleToggleUpvote = async (postId: number) => {
    try {
      await toggleUpvoteMutation.mutateAsync(postId);
    } catch {
      // error handled optimistically/react-query
    }
  };

  return (
    <Card id="discussion-panel-section" className="overflow-hidden border-border/60 bg-card/95 shadow-[0_16px_50px_rgba(15,23,42,0.08)]">
      <CardContent className="space-y-5 p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <MessageCircleMore className="h-4 w-4 text-primary" />
              <span>Hỏi &amp; Đáp — {lessonTitle}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {isInitialLoading && !threads.length
                ? "Đang tải câu hỏi của bài học này..."
                : `${questionCountLabel} câu hỏi hiện có`}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <QuestionForm onSubmit={handleCreateQuestion} />

          {showSkeleton ? (
            <DiscussionSkeleton />
          ) : error ? (
            <div className="rounded-3xl border border-dashed border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
              <div className="flex items-start gap-3">
                <RefreshCw className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="space-y-2">
                  <p className="font-semibold">Không tải được câu hỏi</p>
                  <p className="text-destructive/80">{error}</p>
                </div>
              </div>
            </div>
          ) : threads.length ? (
            <div className="space-y-4">
              {threads.map((post: DiscussionPostRecord) => (
                <div key={post.id}>
                  <DiscussionItem
                    post={post}
                    onReplyClick={(id) =>
                      setOpenReplyFor((cur) => (cur === id ? null : id))
                    }
                    onUpvote={handleToggleUpvote}
                    canInteract={isAuthenticated}
                    voted={post.voted}
                  />

                  {openReplyFor === post.id ? (
                    <div className="mt-3 pl-4 sm:pl-5">
                      <ReplyBox
                        onSubmit={(c) => handleReply(post.id, c)}
                        onCancel={() => setOpenReplyFor(null)}
                      />
                    </div>
                  ) : null}
                </div>
              ))}

              {isLoadingMore ? (
                <div className="flex items-center justify-center gap-2 rounded-2xl border border-border/60 bg-muted/20 px-4 py-4 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  Đang tải thêm câu hỏi...
                </div>
              ) : null}

              <div ref={sentinelRef} className="h-1 w-full" aria-hidden />
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-border/60 bg-muted/20 p-6 text-sm text-muted-foreground">
              Chưa có câu hỏi nào. Hãy là người đầu tiên hỏi!
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
