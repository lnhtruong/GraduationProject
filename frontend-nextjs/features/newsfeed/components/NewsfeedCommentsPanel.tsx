"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, MessageCircleReply, SendHorizonal } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";
import {
  useCreateNewsfeedComment,
  useNewsfeedCommentDetail,
  useNewsfeedComments,
  syncNewsfeedCommentCount,
} from "../api/newsfeed.hooks";
import type { NewsfeedCommentItem, NewsfeedItem } from "../types";
import { NewsfeedAuthDialog, type NewsfeedAuthAction } from "./NewsfeedAuthDialog";

type CommentSortOrder = "newest" | "oldest";

const COMMENT_MIN_HEIGHT = 40;
const COMMENT_MAX_HEIGHT = 120;

function getCommentAuthorName(
  comment: {
    commenter?: { firstName?: string; lastName?: string };
  },
  fallbackName: string,
) {
  const firstName = comment.commenter?.firstName?.trim();
  const lastName = comment.commenter?.lastName?.trim();
  const fullName = `${firstName ?? ""} ${lastName ?? ""}`.trim();
  return fullName || fallbackName;
}

function getInitials(name: string) {
  const parts = name.trim().split(" ").filter(Boolean);
  if (!parts.length) {
    return "KH";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] ?? "K"}${parts[parts.length - 1][0] ?? "H"}`.toUpperCase();
}

function formatCommentDate(value: string) {
  if (!value) {
    return "Vừa xong";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Vừa xong";
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTargetDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayDiff = Math.round((startOfToday.getTime() - startOfTargetDay.getTime()) / 86400000);

  if (dayDiff === 0) {
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (dayDiff === 1) {
    return "1 ngày trước";
  }

  if (dayDiff === 2) {
    return "2 ngày trước";
  }

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

function sortCommentsByOrder(comments: NewsfeedCommentItem[], sortOrder: CommentSortOrder) {
  const sorted = [...comments].sort((left, right) => left.id - right.id);
  return sortOrder === "newest" ? sorted.reverse() : sorted;
}

function autosizeTextarea(textarea: HTMLTextAreaElement | null) {
  if (!textarea) {
    return;
  }

  textarea.style.height = "auto";
  const nextHeight = Math.min(textarea.scrollHeight, COMMENT_MAX_HEIGHT);
  textarea.style.height = `${Math.max(nextHeight, COMMENT_MIN_HEIGHT)}px`;
  textarea.style.overflowY = textarea.scrollHeight > COMMENT_MAX_HEIGHT ? "auto" : "hidden";
}

function CommentThread({
  feedId,
  comment,
  replyTargetId,
  onStartReply,
  onCancelReply,
  onSubmitReply,
  isSubmitting,
  isAuthenticated,
  onAuthRequired,
  sortOrder,
  targetCommentId,
  targetParentCommentId,
}: {
  feedId: number;
  comment: NewsfeedCommentItem;
  replyTargetId: number | null;
  onStartReply: (comment: NewsfeedCommentItem) => void;
  onCancelReply: () => void;
  onSubmitReply: (originCmt: number, content: string) => Promise<void>;
  isSubmitting: boolean;
  isAuthenticated: boolean;
  onAuthRequired: () => void;
  sortOrder: CommentSortOrder;
  targetCommentId?: number | null;
  targetParentCommentId?: number | null;
}) {
  const [replyContent, setReplyContent] = useState("");
  const [showReplies, setShowReplies] = useState(false);
  const replyTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const commentRef = useRef<HTMLDivElement | null>(null);

  const isReplying = replyTargetId === comment.id;
  const isTargetComment = targetCommentId === comment.id;
  const shouldOpenTargetReplies = targetParentCommentId === comment.id;
  const repliesOpen = showReplies || shouldOpenTargetReplies;
  const repliesQuery = useNewsfeedCommentDetail(feedId, comment.id, repliesOpen);
  const replies = useMemo(
    () => sortCommentsByOrder(repliesQuery.data?.pages.flatMap((page) => page.items) ?? [], sortOrder),
    [repliesQuery.data?.pages, sortOrder],
  );
  const replyCount = comment.total_nested_cmt ?? replies.length;
  const canSubmitReply =
    isAuthenticated &&
    replyContent.trim().length > 0 &&
    replyContent.trim().length <= 1000 &&
    !isSubmitting;

  const handleSubmitReply = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isAuthenticated) {
      onAuthRequired();
      return;
    }

    if (!isReplying || !canSubmitReply) {
      return;
    }

    await onSubmitReply(comment.id, replyContent.trim());
    setReplyContent("");
    onCancelReply();
  };

  useEffect(() => {
    autosizeTextarea(replyTextareaRef.current);
  }, [replyContent, isReplying]);

useEffect(() => {
    if (!isTargetComment) {
      return;
    }
    const timer = window.setTimeout(() => {
      commentRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
    return () => window.clearTimeout(timer);
  }, [isTargetComment]);

  useEffect(() => {
    if (!targetCommentId || !repliesOpen) {
      return;
    }
    const timer = window.setTimeout(() => {
      document.getElementById(`newsfeed-comment-${targetCommentId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
    return () => window.clearTimeout(timer);
  }, [repliesOpen, targetCommentId]);

  return (
    <div
      id={`newsfeed-comment-${comment.id}`}
      ref={commentRef}
      className={cn(
        "space-y-3 border-b border-border/40 py-4 last:border-b-0",
        isTargetComment && "rounded-lg bg-primary/8 px-2 ring-1 ring-primary/30",
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8 border border-border/60 bg-background">
          <AvatarFallback className="text-[11px] font-semibold">
            {getInitials(getCommentAuthorName(comment, "Người dùng"))}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <p className="truncate font-semibold text-foreground">
              {getCommentAuthorName(comment, "Người dùng")}
            </p>
            {comment.is_owner ? (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                Bạn
              </span>
            ) : null}
            <span className="text-xs text-muted-foreground">
              {formatCommentDate(comment.created_at)}
            </span>
          </div>

          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-foreground/90">
            {comment.content}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <button
              type="button"
              className="inline-flex items-center gap-1 transition hover:text-foreground"
              onClick={() => {
                if (!isAuthenticated) {
                  onAuthRequired();
                  return;
                }
                if (isReplying) {
                  onCancelReply();
                  setReplyContent("");
                  return;
                }
                onStartReply(comment);
              }}
            >
              <MessageCircleReply className="h-3.5 w-3.5" />
              {isReplying ? "Hủy" : "Phản hồi"}
            </button>
            {replyCount > 0 ? (
              <button
                type="button"
                className="transition hover:text-foreground"
                onClick={() => setShowReplies((current) => !current)}
                disabled={repliesQuery.isFetching}
              >
                {repliesOpen ? "Ẩn phản hồi" : `${replyCount} phản hồi`}
              </button>
            ) : null}
          </div>

          {isReplying ? (
            <form onSubmit={(event) => void handleSubmitReply(event)} className="mt-3 flex items-end gap-3">
              <Textarea
                ref={replyTextareaRef}
                value={replyContent}
                onChange={(event) => setReplyContent(event.target.value)}
                onInput={(event) => autosizeTextarea(event.currentTarget)}
                placeholder={`Trả lời ${getCommentAuthorName(comment, "Người dùng")}...`}
                maxLength={1000}
                rows={1}
                className="min-h-10 max-h-[120px] flex-1 resize-none overflow-y-auto border-0 border-b border-border/70 bg-transparent px-0 py-2 text-sm shadow-none focus-visible:ring-0"
              />
              <Button
                type="submit"
                disabled={!canSubmitReply}
                className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizonal className="h-4 w-4" />}
              </Button>
            </form>
          ) : null}

          {repliesOpen ? (
            <div className="mt-3 space-y-3 border-l border-border/40 pl-4">
              {replies.map((reply) => {
                const replyAuthorName = getCommentAuthorName(reply, "Người dùng");
                return (
                  <div
                    id={`newsfeed-comment-${reply.id}`}
                    key={reply.id}
                    className={cn(
                      "flex items-start gap-3 rounded-lg",
                      targetCommentId === reply.id && "bg-primary/8 px-2 py-1 ring-1 ring-primary/30",
                    )}
                  >
                    <Avatar className="h-7 w-7 border border-border/60 bg-background">
                      <AvatarFallback className="text-[10px] font-semibold">
                        {getInitials(replyAuthorName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <p className="truncate font-medium text-foreground/95">{replyAuthorName}</p>
                        {reply.is_owner ? (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">Bạn</span>
                        ) : null}
                        <span className="text-xs text-muted-foreground">{formatCommentDate(reply.created_at)}</span>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-foreground/90">{reply.content}</p>
                    </div>
                  </div>
                );
              })}
              {repliesQuery.isFetching ? <p className="text-xs text-muted-foreground">Đang tải phản hồi...</p> : null}
              {!repliesQuery.isFetching && replies.length === 0 ? <p className="text-xs text-muted-foreground">Chưa có phản hồi.</p> : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

interface NewsfeedCommentsPanelProps {
  video: NewsfeedItem | null;
  viewerName: string;
  sortOrder: CommentSortOrder;
  targetCommentId?: number | null;
  targetParentCommentId?: number | null;
  onCommentCountChange?: (count: number) => void;
}

export function NewsfeedCommentsPanel({
  video,
  sortOrder,
  targetCommentId,
  targetParentCommentId,
  onCommentCountChange,
}: NewsfeedCommentsPanelProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [replyTargetId, setReplyTargetId] = useState<number | null>(null);
  const [authDialogAction, setAuthDialogAction] = useState<NewsfeedAuthAction | null>(null);
  const commentTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const feedId = video?.feedId ?? null;
  const commentsQuery = useNewsfeedComments(feedId, Boolean(feedId));
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = commentsQuery;
  const createCommentMutation = useCreateNewsfeedComment();

  const requireAuth = () => {
    setAuthDialogAction("comment");
  };

  const comments = useMemo(
    () => sortCommentsByOrder(commentsQuery.data?.pages.flatMap((page) => page.items) ?? [], sortOrder),
    [commentsQuery.data?.pages, sortOrder],
  );
  const targetThreadId = targetParentCommentId ?? targetCommentId ?? null;
  const loadedCommentCount = useMemo(
    () =>
      comments.reduce(
        (total, comment) =>
          total + 1 + Math.max(0, Number(comment.total_nested_cmt ?? 0)),
        0,
      ),
    [comments],
  );

  const canSubmit =
    isAuthenticated &&
    Boolean(feedId) &&
    content.trim().length > 0 &&
    content.trim().length <= 1000 &&
    !createCommentMutation.isPending;

  const submitComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isAuthenticated) {
      requireAuth();
      return;
    }

    if (!feedId || !canSubmit) {
      return;
    }

    const trimmed = content.trim();
    await createCommentMutation.mutateAsync({ feedId, content: trimmed });
    setContent("");
  };

  useEffect(() => {
    autosizeTextarea(commentTextareaRef.current);
  }, [content]);

  useEffect(() => {
    if (!feedId || loadedCommentCount <= 0) {
      return;
    }

    onCommentCountChange?.(loadedCommentCount);
    syncNewsfeedCommentCount(queryClient, feedId, loadedCommentCount);
  }, [feedId, loadedCommentCount, onCommentCountChange, queryClient]);

  useEffect(() => {
    if (!targetThreadId || !hasNextPage || isFetchingNextPage) {
      return;
    }
    if (comments.some((comment) => comment.id === targetThreadId)) {
      return;
    }

    void fetchNextPage();
  }, [comments, fetchNextPage, hasNextPage, isFetchingNextPage, targetThreadId]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ScrollArea className="min-h-0 flex-1 px-5 py-4 pb-6">
        <div className="pb-4 pt-1">
          {comments.map((comment) => (
            <CommentThread
              key={comment.id}
              feedId={feedId ?? 0}
              comment={comment}
              replyTargetId={replyTargetId}
              onStartReply={(target) => setReplyTargetId(target.id)}
              onCancelReply={() => setReplyTargetId(null)}
              onSubmitReply={async (originCmt, replyContent) => {
                if (!feedId) {
                  return;
                }
                await createCommentMutation.mutateAsync({
                  feedId,
                  content: replyContent,
                  originCmt,
                });
              }}
              isSubmitting={createCommentMutation.isPending}
              isAuthenticated={isAuthenticated}
              onAuthRequired={requireAuth}
              sortOrder={sortOrder}
              targetCommentId={targetCommentId}
              targetParentCommentId={targetParentCommentId}
            />
          ))}

          {commentsQuery.isLoading ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Đang tải bình luận...
            </div>
          ) : null}

          {!commentsQuery.isLoading && comments.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Chưa có bình luận nào.
            </div>
          ) : null}

          {commentsQuery.hasNextPage ? (
            <Button
              variant="outline"
              onClick={() => {
                void fetchNextPage();
              }}
              disabled={commentsQuery.isFetchingNextPage}
              className="w-full"
            >
              {commentsQuery.isFetchingNextPage ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tải thêm
                </>
              ) : (
                "Tải thêm"
              )}
            </Button>
          ) : null}
        </div>
      </ScrollArea>

      <form
        onSubmit={(event) => void submitComment(event)}
        className="shrink-0 border-t border-border/60 px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
      >
        <div className="space-y-2">
          <Textarea
            ref={commentTextareaRef}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            onFocus={() => {
              if (!isAuthenticated) {
                requireAuth();
              }
            }}
            onInput={(event) => autosizeTextarea(event.currentTarget)}
            placeholder={isAuthenticated ? "Viết bình luận..." : "Đăng nhập để bình luận..."}
            maxLength={1000}
            rows={1}
            className="min-h-10 max-h-[120px] resize-none overflow-y-auto border-border/70 bg-background/80"
          />
          <div className="flex items-end justify-between gap-3 text-xs text-muted-foreground">
            <span>{content.trim().length}/1000</span>
            <Button
              type="submit"
              disabled={!canSubmit}
              className="shrink-0 gap-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {createCommentMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SendHorizonal className="h-4 w-4" />
              )}
              Gửi
            </Button>
          </div>
        </div>
      </form>
      <NewsfeedAuthDialog
        open={Boolean(authDialogAction)}
        onOpenChange={(open) => {
          if (!open) {
            setAuthDialogAction(null);
          }
        }}
        action={authDialogAction ?? undefined}
      />
    </div>
  );
}
