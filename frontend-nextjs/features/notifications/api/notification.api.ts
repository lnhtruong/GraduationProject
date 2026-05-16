import { apiClient } from "@/lib/http";
import { authStorageHelper } from "@/store/auth";
import type {
  BulkUpdateNotificationsPayload,
  NotificationItem,
  NotificationListResponse,
  PatchNotificationPayload,
} from "../types";

// Authorization header (Bearer token) is attached by `apiClient` interceptor.
// Do not send `x-user-id` from client — API Gateway derives user from token.

function buildQueryString(
  params: Record<string, string | number | boolean | undefined>,
) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined) return;
    searchParams.set(key, String(value));
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export const notificationApi = {
  async getNotifications(params?: {
    cursor?: number;
    limit?: number;
    is_read?: boolean;
  }): Promise<NotificationListResponse> {
    const { data } = await apiClient.get<NotificationListResponse>(
      `/media/notifications${buildQueryString({
        cursor: params?.cursor,
        limit: params?.limit,
        is_read: params?.is_read,
      })}`,
    );

    return data;
  },

  async getNotificationById(id: number): Promise<NotificationItem> {
    const { data } = await apiClient.get<NotificationItem>(
      `/media/notifications/${id}`,
    );

    return data;
  },

  async updateNotification(
    id: number,
    payload: PatchNotificationPayload,
  ): Promise<NotificationItem> {
    const { data } = await apiClient.patch<NotificationItem>(
      `/media/notifications/${id}`,
      payload,
    );

    return data;
  },

  async bulkUpdateNotifications(
    payload: BulkUpdateNotificationsPayload,
  ): Promise<{ updated: number }> {
    const { data } = await apiClient.put<{ updated: number }>(
      "/media/notifications/bulk",
      payload,
    );

    return data;
  },
};
