import { useCallback, useEffect, useRef, useState } from "react";
import { discussionApi } from "../api/discussions.api";
import { authStorageHelper } from "@/store/auth";
import type { DiscussionPostRecord } from "../types";

interface UseLessonDiscussionsResult {
  threads: DiscussionPostRecord[];
  total: number;
  isInitialLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  refetch: () => void;
}

const PAGE_SIZE = 20;

export function useLessonDiscussions(
  lessonId: number,
): UseLessonDiscussionsResult & {
  createPost: (
    content: string,
    parentId?: number | null,
  ) => Promise<DiscussionPostRecord>;
  toggleUpvote: (postId: number) => Promise<boolean>;
  isVoted: (postId: number) => boolean;
} {
  const [threads, setThreads] = useState<DiscussionPostRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    requestIdRef.current += 1;
    abortRef.current?.abort();

    setThreads([]);
    setTotal(0);
    setPage(1);
    setError(null);
    setIsInitialLoading(true);
    setIsLoadingMore(false);
  }, [lessonId]);

  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;
    const requestId = requestIdRef.current;
    const isFirstPage = page === 1;

    if (isFirstPage) {
      setIsInitialLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    const loadDiscussions = async () => {
      try {
        const data = await discussionApi.listByLesson({
          lessonId,
          page,
          limit: PAGE_SIZE,
        });

        if (controller.signal.aborted || requestId !== requestIdRef.current) {
          return;
        }

        setTotal(data.total);
        setThreads((current) =>
          isFirstPage ? data.data : [...current, ...data.data],
        );
      } catch (fetchError) {
        if (controller.signal.aborted || requestId !== requestIdRef.current) {
          return;
        }

        console.error(
          "[useLessonDiscussions] failed to fetch discussions",
          fetchError,
        );
        setError("Không tải được danh sách câu hỏi. Vui lòng thử lại.");
      } finally {
        if (controller.signal.aborted || requestId !== requestIdRef.current) {
          return;
        }

        setIsInitialLoading(false);
        setIsLoadingMore(false);
      }
    };

    void loadDiscussions();

    return () => controller.abort();
  }, [lessonId, page]);

  const hasMore = threads.length < total;

  const loadMore = useCallback(() => {
    if (hasMore && !isInitialLoading && !isLoadingMore) {
      setPage((current) => current + 1);
    }
  }, [hasMore, isInitialLoading, isLoadingMore]);

  const refetch = useCallback(() => {
    requestIdRef.current += 1;
    abortRef.current?.abort();
    setThreads([]);
    setTotal(0);
    setPage(1);
    setError(null);
    setIsInitialLoading(true);
    setIsLoadingMore(false);
  }, []);

  // local optimistic tracking for upvotes
  const upvotedRef = useRef<Set<number>>(new Set());

  const createPost = useCallback(
    async (content: string, parentId?: number | null) => {
      const tempId = -Date.now();
      const userSnapshot =
        (authStorageHelper as any).getUserSnapshot?.() ?? null;
      const author = userSnapshot
        ? {
            id: userSnapshot.id,
            name:
              `${userSnapshot.firstName ?? ""} ${userSnapshot.lastName ?? ""}`.trim() ||
              userSnapshot.email,
            avatarUrl: userSnapshot.avatarUrl ?? null,
          }
        : { id: 0, name: "Bạn", avatarUrl: null };
      const now = new Date().toISOString();

      if (!parentId) {
        const tempPost: DiscussionPostRecord = {
          id: tempId,
          lessonId,
          parentId: null,
          content,
          isBestAnswer: false,
          upvotes: 0,
          createdAt: now,
          updatedAt: now,
          author,
          replies: [],
        };
        setThreads((prev) => [tempPost, ...prev]);
        try {
          const res = await discussionApi.createForLesson(lessonId, {
            content,
            parentId,
          });
          const created: DiscussionPostRecord = {
            id: res.id,
            lessonId: res.lessonId,
            parentId: res.parentId,
            content: res.content,
            isBestAnswer: res.isBestAnswer,
            upvotes: res.upvotes,
            createdAt: res.createdAt,
            updatedAt: res.updatedAt,
            author: res.author,
            replies: [],
          };
          setThreads((prev) => [
            created,
            ...prev.filter((p) => p.id !== tempId),
          ]);
          setTotal((t) => t + 1);
          return created;
        } catch (err) {
          setThreads((prev) => prev.filter((p) => p.id !== tempId));
          setError("Không gửi được câu hỏi. Vui lòng thử lại.");
          throw err;
        }
      }

      // reply optimistic
      const tempReplyId = -Date.now() - 1;
      const tempReply: DiscussionPostRecord = {
        id: tempReplyId,
        lessonId,
        parentId,
        content,
        isBestAnswer: false,
        upvotes: 0,
        createdAt: now,
        updatedAt: now,
        author,
        replies: [],
      };

      setThreads((prev) =>
        prev.map((root) => {
          if (
            root.id === parentId ||
            root.replies.some((r) => r.id === parentId)
          ) {
            return { ...root, replies: [...root.replies, tempReply] };
          }
          return root;
        }),
      );

      try {
        const res = await discussionApi.createForLesson(lessonId, {
          content,
          parentId,
        });
        const createdReply: DiscussionPostRecord = {
          id: res.id,
          lessonId: res.lessonId,
          parentId: res.parentId,
          content: res.content,
          isBestAnswer: res.isBestAnswer,
          upvotes: res.upvotes,
          createdAt: res.createdAt,
          updatedAt: res.updatedAt,
          author: res.author,
          replies: [],
        };
        const rootId =
          (res as any).parentRootId ?? createdReply.parentId ?? null;
        setThreads((prev) =>
          prev.map((root) => {
            if (root.id === rootId) {
              return {
                ...root,
                replies: [
                  ...root.replies.filter((r) => r.id !== tempReplyId),
                  createdReply,
                ],
              };
            }
            return root;
          }),
        );
        return createdReply;
      } catch (err) {
        setThreads((prev) =>
          prev.map((root) => ({
            ...root,
            replies: root.replies.filter((r) => r.id !== tempReplyId),
          })),
        );
        setError("Không gửi được trả lời. Vui lòng thử lại.");
        throw err;
      }
    },
    [lessonId],
  );

  const toggleUpvote = useCallback(async (postId: number) => {
    let prevUpvotes = 0;
    const wasVoted = upvotedRef.current.has(postId);

    setThreads((prev) =>
      prev.map((root) => {
        if (root.id === postId) {
          prevUpvotes = root.upvotes;
          return {
            ...root,
            upvotes: wasVoted
              ? Math.max(0, root.upvotes - 1)
              : root.upvotes + 1,
          };
        }
        return {
          ...root,
          replies: root.replies.map((r) => {
            if (r.id === postId) {
              prevUpvotes = r.upvotes;
              return {
                ...r,
                upvotes: wasVoted ? Math.max(0, r.upvotes - 1) : r.upvotes + 1,
              };
            }
            return r;
          }),
        };
      }),
    );

    if (wasVoted) upvotedRef.current.delete(postId);
    else upvotedRef.current.add(postId);

    try {
      const res = await discussionApi.toggleUpvote(postId);
      setThreads((prev) =>
        prev.map((root) => {
          if (root.id === postId) return { ...root, upvotes: res.upvotes };
          return {
            ...root,
            replies: root.replies.map((r) =>
              r.id === postId ? { ...r, upvotes: res.upvotes } : r,
            ),
          };
        }),
      );
      if (res.voted) upvotedRef.current.add(postId);
      else upvotedRef.current.delete(postId);
      return res.voted;
    } catch (err) {
      // rollback
      setThreads((prev) =>
        prev.map((root) => {
          if (root.id === postId) return { ...root, upvotes: prevUpvotes };
          return {
            ...root,
            replies: root.replies.map((r) =>
              r.id === postId ? { ...r, upvotes: prevUpvotes } : r,
            ),
          };
        }),
      );
      if (!wasVoted) upvotedRef.current.delete(postId);
      else upvotedRef.current.add(postId);
      setError("Không cập nhật upvote. Vui lòng thử lại.");
      throw err;
    }
  }, []);

  const isVoted = useCallback(
    (postId: number) => upvotedRef.current.has(postId),
    [],
  );

  return {
    threads,
    total,
    isInitialLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
    refetch,
    createPost,
    toggleUpvote,
    isVoted,
  };
}
