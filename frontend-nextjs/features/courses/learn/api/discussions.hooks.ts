import { useInfiniteQuery, useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { createKeyFactory } from "@/lib/queryKeys";
import { discussionApi } from "./discussions.api";
import { authStorageHelper } from "@/store/auth";
import type { DiscussionPostRecord, DiscussionListResponse } from "../types";

export const discussionKeys = createKeyFactory("discussions");

const PAGE_SIZE = 20;

export function useLessonDiscussionsQuery(lessonId: number) {
  return useInfiniteQuery<DiscussionListResponse>({
    queryKey: discussionKeys.custom("lesson", lessonId),
    queryFn: ({ pageParam }) =>
      discussionApi.listByLesson({
        lessonId,
        page: pageParam as number,
        limit: PAGE_SIZE,
      }),
    getNextPageParam: (lastPage) => {
      const loadedCount = lastPage.page * lastPage.limit;
      return loadedCount < lastPage.total ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 15 * 1000, // cache stale after 15s
  });
}

export function useCreateDiscussionMutation(lessonId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { content: string; parentId?: number | null }) =>
      discussionApi.createForLesson(lessonId, payload),
    onMutate: async (newPostPayload) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      const queryKey = discussionKeys.custom("lesson", lessonId);
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<InfiniteData<DiscussionListResponse>>(queryKey);

      // Construct the optimistic post
      const userSnapshot = (authStorageHelper as any).getUserSnapshot?.() ?? null;
      const author = userSnapshot
         ? {
             id: userSnapshot.id,
             name: `${userSnapshot.firstName ?? ""} ${userSnapshot.lastName ?? ""}`.trim() || userSnapshot.email,
             avatarUrl: userSnapshot.avatarUrl ?? null,
           }
         : { id: 0, name: "Bạn", avatarUrl: null };
      const now = new Date().toISOString();
      const tempId = -Date.now();

      const tempPost: DiscussionPostRecord = {
        id: tempId,
        lessonId,
        parentId: newPostPayload.parentId ?? null,
        content: newPostPayload.content,
        isBestAnswer: false,
        upvotes: 0,
        voted: false,
        createdAt: now,
        updatedAt: now,
        author,
        replies: [],
      };

      // Optimistically update to the new value
      queryClient.setQueryData<InfiniteData<DiscussionListResponse>>(queryKey, (old) => {
        if (!old) return old;

        const pages = [...old.pages];
        if (pages.length === 0) return old;

        if (!newPostPayload.parentId) {
          // If it's a root post, insert at the beginning of the first page
          pages[0] = {
            ...pages[0],
            data: [tempPost, ...pages[0].data],
            total: pages[0].total + 1,
          };
        } else {
          // If it's a reply, find the parent post and append to its replies.
          // LIMITATION: For simplicity, the optimistic reply is only added to the first page (pages[0]).
          // If the parent post is on page 2+, it won't show up immediately until refetched/invalidated.
          pages[0] = {
            ...pages[0],
            data: pages[0].data.map((root: DiscussionPostRecord) => {
              if (
                root.id === newPostPayload.parentId ||
                (root.replies && root.replies.some((r) => r.id === newPostPayload.parentId))
              ) {
                return {
                  ...root,
                  replies: [...(root.replies || []), tempPost],
                };
              }
              return root;
            }),
          };
        }

        return { ...old, pages };
      });

      return { previousData, tempId };
    },
    onError: (err, newPostPayload, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(
          discussionKeys.custom("lesson", lessonId),
          context.previousData,
        );
      }
    },
    onSuccess: (savedPost, newPostPayload, context) => {
      const queryKey = discussionKeys.custom("lesson", lessonId);
      // Replace the optimistic tempPost with the actual post from server
      queryClient.setQueryData<InfiniteData<DiscussionListResponse>>(queryKey, (old) => {
        if (!old) return old;

        const pages = old.pages.map((page) => {
          let updatedData = page.data;
          
          if (!newPostPayload.parentId) {
            // Replace in root posts
            updatedData = page.data.map((p: DiscussionPostRecord) =>
              p.id === context?.tempId ? { ...savedPost, replies: [] } : p,
            );
          } else {
            // Replace in replies
            const parentRootId = savedPost.parentRootId ?? newPostPayload.parentId;
            updatedData = page.data.map((root: DiscussionPostRecord) => {
              if (root.id === parentRootId) {
                return {
                  ...root,
                  replies: (root.replies || []).map((r: DiscussionPostRecord) =>
                    r.id === context?.tempId ? savedPost : r,
                  ),
                };
              }
              return root;
            });
          }

          return { ...page, data: updatedData };
        });

        return { ...old, pages };
      });
    },
    onSettled: () => {
      // Always refetch in background to ensure we are in sync
      queryClient.invalidateQueries({
        queryKey: discussionKeys.custom("lesson", lessonId),
      });
    },
  });
}

export function useToggleUpvoteMutation(lessonId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: number) => discussionApi.toggleUpvote(postId),
    onMutate: async (postId) => {
      const queryKey = discussionKeys.custom("lesson", lessonId);
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData<InfiniteData<DiscussionListResponse>>(queryKey);

      queryClient.setQueryData<InfiniteData<DiscussionListResponse>>(queryKey, (old) => {
        if (!old) return old;

        const pages = old.pages.map((page) => {
          const updatedData = page.data.map((root: DiscussionPostRecord) => {
            // Check if root post matches
            if (root.id === postId) {
              const wasVoted = Boolean(root.voted);
              return {
                ...root,
                voted: !wasVoted,
                upvotes: wasVoted ? Math.max(0, root.upvotes - 1) : root.upvotes + 1,
              };
            }

            // Check if replies match
            const hasMatchingReply = root.replies && root.replies.some((r) => r.id === postId);
            if (hasMatchingReply) {
              return {
                ...root,
                replies: (root.replies || []).map((r: DiscussionPostRecord) => {
                  if (r.id === postId) {
                    const wasVoted = Boolean(r.voted);
                    return {
                      ...r,
                      voted: !wasVoted,
                      upvotes: wasVoted ? Math.max(0, r.upvotes - 1) : r.upvotes + 1,
                    };
                  }
                  return r;
                }),
              };
            }

            return root;
          });

          return { ...page, data: updatedData };
        });

        return { ...old, pages };
      });

      return { previousData };
    },
    onError: (err, postId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          discussionKeys.custom("lesson", lessonId),
          context.previousData,
        );
      }
    },
    onSuccess: (result, postId) => {
      const queryKey = discussionKeys.custom("lesson", lessonId);
      queryClient.setQueryData<InfiniteData<DiscussionListResponse>>(queryKey, (old) => {
        if (!old) return old;

        const pages = old.pages.map((page) => {
          const updatedData = page.data.map((root: DiscussionPostRecord) => {
            if (root.id === postId) {
              return {
                ...root,
                upvotes: result.upvotes,
                voted: result.voted,
              };
            }

            const hasMatchingReply = root.replies && root.replies.some((r) => r.id === postId);
            if (hasMatchingReply) {
              return {
                ...root,
                replies: (root.replies || []).map((r: DiscussionPostRecord) =>
                  r.id === postId
                    ? { ...r, upvotes: result.upvotes, voted: result.voted }
                    : r,
                ),
              };
            }

            return root;
          });

          return { ...page, data: updatedData };
        });

        return { ...old, pages };
      });
    },
  });
}
