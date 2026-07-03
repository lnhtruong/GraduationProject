import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { discussionApi, type CourseDiscussionParams } from "./discussion.api";
import type { LessonDiscussionsResponse } from "./types";

const discussionKeys = {
  course: (courseId: number, params: CourseDiscussionParams) =>
    ["discussion", "course", courseId, params] as const,
  courseRoot: (courseId: number) => ["discussion", "course", courseId] as const,
  lesson: (lessonId: number) => ["discussion", "lesson", lessonId] as const,
  instructor: (params: CourseDiscussionParams) =>
    ["discussion", "instructor", params] as const,
  instructorRoot: () => ["discussion", "instructor"] as const,
};

export function useCourseDiscussions(
  courseId: number,
  params: CourseDiscussionParams,
) {
  return useQuery({
    queryKey: discussionKeys.course(courseId, params),
    queryFn: () => discussionApi.listByCourse(courseId, params),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

export function useLessonDiscussions(lessonId: number, enabled: boolean) {
  return useQuery({
    queryKey: discussionKeys.lesson(lessonId),
    queryFn: () => discussionApi.listByLesson(lessonId),
    enabled,
    staleTime: 30_000,
  });
}

export function useCreateReply(lessonId: number, courseId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ content, parentId }: { content: string; parentId: number }) =>
      discussionApi.createReply(lessonId, content, parentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: discussionKeys.lesson(lessonId) });
      qc.invalidateQueries({ queryKey: discussionKeys.courseRoot(courseId) });
      qc.invalidateQueries({ queryKey: discussionKeys.instructorRoot() });
    },
    onError: () => {
      toast.error("Không thể gửi trả lời. Vui lòng thử lại.");
    },
  });
}

export function useToggleBestAnswer(lessonId: number, courseId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postId: number) => discussionApi.toggleBestAnswer(postId),

    onMutate: async (postId: number) => {
      const key = discussionKeys.lesson(lessonId);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<LessonDiscussionsResponse>(key);

      if (prev) {
        // Determine current state of target reply
        let targetParentId: number | null = null;
        let currentIsBest = false;
        for (const root of prev.data) {
          const reply = root.replies.find((r) => r.id === postId);
          if (reply) {
            targetParentId = reply.parentId;
            currentIsBest = reply.isBestAnswer;
            break;
          }
        }
        const willMarkAsBest = !currentIsBest;

        qc.setQueryData<LessonDiscussionsResponse>(key, (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((root) => ({
              ...root,
              replies: root.replies.map((reply) => {
                if (reply.id === postId) {
                  return { ...reply, isBestAnswer: willMarkAsBest };
                }
                // Unmark siblings in same thread when marking a new best
                if (willMarkAsBest && reply.parentId === targetParentId) {
                  return { ...reply, isBestAnswer: false };
                }
                return reply;
              }),
            })),
          };
        });
      }

      return { prev };
    },

    onError: (_err, _postId, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(discussionKeys.lesson(lessonId), ctx.prev);
      }
      toast.error("Không thể đánh dấu Best Answer. Vui lòng thử lại.");
    },

    onSettled: () => {
      // Only invalidate the lesson query — isBestAnswer only affects the
      // expanded reply view. replyCount and hasInstructorReply are unchanged.
      qc.invalidateQueries({ queryKey: discussionKeys.lesson(lessonId) });
    },
  });
}

export function useInstructorDiscussions(params: CourseDiscussionParams) {
  return useQuery({
    queryKey: discussionKeys.instructor(params),
    queryFn: () => discussionApi.listForInstructor(params),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}
