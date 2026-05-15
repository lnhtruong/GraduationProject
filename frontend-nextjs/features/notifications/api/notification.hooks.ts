import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { createKeyFactory } from "@/lib/queryKeys";
import { notificationApi } from "./notification.api";
import type {
  BulkUpdateNotificationsPayload,
  PatchNotificationPayload,
} from "../types";

export const notificationKeys = createKeyFactory("notifications");

export function useNotificationsList(
  userId: number | null | undefined,
  enabled = true,
  limit = 10,
  isRead?: boolean,
) {
  return useInfiniteQuery({
    queryKey: notificationKeys.custom("list", userId, limit, isRead ?? "all"),
    queryFn: ({ pageParam }) =>
      notificationApi.getNotifications({
        cursor: typeof pageParam === "number" ? pageParam : undefined,
        limit,
        is_read: isRead,
      }),
    enabled: enabled && Boolean(userId),
    staleTime: 15_000,
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
  });
}

export function useUnreadNotifications(
  userId: number | null | undefined,
  enabled = true,
  limit = 20,
) {
  return useQuery({
    queryKey: notificationKeys.custom("unread", userId, limit),
    queryFn: () => notificationApi.getNotifications({ limit, is_read: false }),
    enabled: enabled && Boolean(userId),
    staleTime: 15_000,
  });
}

export function useNotificationDetail(
  notificationId: number | null,
  enabled = true,
) {
  return useQuery({
    queryKey: notificationKeys.custom("detail", notificationId),
    queryFn: () => {
      if (!notificationId) {
        return Promise.reject(new Error("Missing notification id"));
      }

      return notificationApi.getNotificationById(notificationId);
    },
    enabled: enabled && notificationId !== null,
    staleTime: 15_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: notificationKeys.custom("mark-read"),
    mutationFn: async ({ id, is_read }: { id: number; is_read: boolean }) =>
      notificationApi.updateNotification(id, { is_read }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.root });
    },
  });
}

export function useMarkNotificationUnread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: notificationKeys.custom("mark-unread"),
    mutationFn: async (id: number) =>
      notificationApi.updateNotification(id, { is_read: false }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.root });
    },
  });
}

export function useBulkUpdateNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: notificationKeys.custom("bulk-update"),
    mutationFn: (payload: BulkUpdateNotificationsPayload) =>
      notificationApi.bulkUpdateNotifications(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.root });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const bulkMutation = useBulkUpdateNotifications();

  return useMutation({
    mutationKey: notificationKeys.custom("mark-all-read"),
    mutationFn: async () =>
      bulkMutation.mutateAsync({ is_read: true, all: true }),
  });
}
