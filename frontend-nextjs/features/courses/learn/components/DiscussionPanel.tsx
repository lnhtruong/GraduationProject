"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { Loader2, MessageCircleMore, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
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

function formatDateTime(value: string) {
  try {
    return format(new Date(value), "HH:mm 'ngày' dd/MM/yyyy");
  } catch (_) {
    return value;
  }
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
  openReplyFor,
  onReplySubmit,
  onReplyCancel,
}: {
  post: DiscussionPostRecord;
  isReply?: boolean;
  onReplyClick?: (postId: number) => void;
  onUpvote?: (postId: number) => void;
  canInteract?: boolean;
  voted?: boolean;
  openReplyFor?: number | null;
  onReplySubmit?: (parentId: number, content: string) => Promise<void>;
  onReplyCancel?: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="flex flex-col space-y-3">
      {/* Main post layout */}
      <div className="flex items-start gap-3">
        {/* Indentation indicator for replies */}
        {isReply && (
          <div className="flex h-10 w-3 sm:w-4 shrink-0 items-center justify-end text-primary/80">
            <span className="text-xs sm:text-sm font-semibold select-none">⤾</span>
          </div>
        )}

        <Avatar className={`${isReply ? "h-8 w-8" : "h-9 w-9 sm:h-10 w-10"} border border-border/80 bg-background shrink-0 mt-1 shadow-sm`}>
          <AvatarImage
            src={post.author.avatarUrl ?? undefined}
            alt={post.author.name}
          />
          <AvatarFallback className={`bg-muted ${isReply ? "text-[10px]" : "text-xs"} font-semibold text-foreground`}>
            {getInitials(post.author.name)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Chat-like text bubble */}
          <div className="relative w-fit max-w-[98%] sm:max-w-[85%] rounded-2xl bg-muted/65 dark:bg-muted/15 px-3 py-2 sm:px-4 sm:py-2.5 shadow-[0_2px_8px_rgba(15,23,42,0.02)] border border-border/30">
            <div className="text-xs font-bold text-foreground mb-1 select-none">
              {post.author.name}
            </div>
            
            {post.isBestAnswer && (
              <Badge className="mb-1 rounded-full border-0 bg-success px-2 py-0.5 text-[10px] font-bold text-success-foreground shadow-sm">
                Best Answer
              </Badge>
            )}

            <p className="whitespace-pre-wrap text-sm leading-6 text-foreground/90 font-medium">
              {post.content}
            </p>

            {/* Floating Thumb Badge */}
            {post.upvotes > 0 && (
              <div className="absolute -bottom-2.5 -right-1.5 sm:-right-3 flex items-center gap-1 rounded-full border border-border bg-card px-1.5 py-0.5 text-[10px] font-bold text-primary shadow-md">
                <span>👍</span>
                <span>{post.upvotes}</span>
              </div>
            )}
          </div>

          {/* Comment actions bar */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pl-2 text-xs font-semibold">
            <button
              type="button"
              onClick={() => onUpvote?.(post.id)}
              disabled={!canInteract}
              className={`cursor-pointer transition-colors ${
                voted
                  ? "text-primary font-bold"
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              {voted ? "Đã thích" : "Thích"}
            </button>
            
            <button
              type="button"
              onClick={() => onReplyClick?.(post.id)}
              disabled={!canInteract}
              className="text-muted-foreground hover:text-primary cursor-pointer transition-colors"
            >
              Trả lời
            </button>

            <span className="text-muted-foreground font-normal">
              {formatDateTime(post.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Reply editor inline */}
      {openReplyFor === post.id ? (
        <div className="pl-11 sm:pl-16 relative">
          {/* Nested reply pointer */}
          <div className="absolute left-4.5 sm:left-6 top-3 text-primary/80 font-semibold select-none">
            ⤾
          </div>
          <ReplyBox
            onSubmit={async (c) => {
              if (onReplySubmit) {
                await onReplySubmit(post.id, c);
                setIsExpanded(true);
              }
            }}
            onCancel={onReplyCancel}
            placeholder={`Trả lời ${post.author.name}`}
          />
        </div>
      ) : null}

      {/* Recursive nested replies */}
      {post.replies && post.replies.length > 0 ? (
        <div className="space-y-4 border-l-2 border-dashed border-border/30 dark:border-border/10 pl-3 sm:pl-6 ml-3 sm:ml-6 mt-1">
          {(isExpanded ? post.replies : post.replies.slice(0, 1)).map((reply) => (
            <DiscussionItem
              key={reply.id}
              post={reply}
              isReply
              onReplyClick={onReplyClick}
              onUpvote={onUpvote}
              canInteract={canInteract}
              voted={reply.voted}
              openReplyFor={openReplyFor}
              onReplySubmit={onReplySubmit}
              onReplyCancel={onReplyCancel}
            />
          ))}

          {post.replies.length > 1 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="ml-6 mt-1 text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1 cursor-pointer transition-colors"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  Thu gọn phản hồi
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  Xem thêm {post.replies.length - 1} phản hồi
                </>
              )}
            </button>
          )}
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
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-4">
          <div className="flex items-start gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-inner mt-0.5">
              <MessageCircleMore className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground">Hỏi &amp; Đáp</h3>
              <p className="text-xs text-muted-foreground">
                {isInitialLoading && !threads.length
                  ? "Đang tải câu hỏi của bài học này..."
                  : "Đặt câu hỏi hoặc chia sẻ ý kiến của bạn về bài học này."}
              </p>
            </div>
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
                    openReplyFor={openReplyFor}
                    onReplySubmit={handleReply}
                    onReplyCancel={() => setOpenReplyFor(null)}
                  />
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
