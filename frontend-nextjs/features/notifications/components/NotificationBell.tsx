"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, User, Megaphone } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  notificationKeys,
  useBulkUpdateNotifications,
  useMarkNotificationRead,
  useNotificationsList,
  useUnreadNotifications,
} from "../api/notification.hooks";
import { subscribeToUserNotifications } from "../lib/notification-stream";
import { useAuthStore } from "@/store/auth";
import { LECTURER_REQUEST_KEYS } from "@/features/lecturer-requests/api/lecturer-requests.hooks";

function formatRelativeTime(isoTime: string): string {
  const diffMs = Date.now() - new Date(isoTime).getTime();
  if (!Number.isFinite(diffMs) || diffMs < 0) return "Vừa xong";

  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return "Vừa xong";
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} ngày trước`;
}

function readNumber(value: unknown): number | null {
  const numberValue = Number(value);
  return Number.isInteger(numberValue) && numberValue > 0 ? numberValue : null;
}

function getNotificationRedirectUrl(
  eventType: string,
  payload: Record<string, unknown> | null,
): string | null {
  const redirectUrl = payload?.redirectUrl;
  if (typeof redirectUrl === "string" && redirectUrl.startsWith("/")) {
    return redirectUrl;
  }

  const feedId = readNumber(payload?.feedId);
  if (feedId) return `/newsfeed?videoId=${feedId}`;

  const courseId = readNumber(payload?.courseId);
  const lessonId = readNumber(payload?.lessonId);
  if (courseId && lessonId) return `/courses/${courseId}/learn?lessonId=${lessonId}`;
  if (courseId) return `/courses/${courseId}`;

  const normalizedEventType = eventType.toLowerCase();
  if (
    normalizedEventType.includes("upload") ||
    normalizedEventType.includes("video.job") ||
    normalizedEventType.includes("image")
  ) {
    return "/library";
  }
  if (
    normalizedEventType.includes("lecturer_request") ||
    normalizedEventType.includes("follow")
  ) {
    return "/profile";
  }

  return null;
}

export function NotificationBell({ className }: { className?: string }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const userId = user?.id ?? null;

  const [open, setOpen] = useState(false);
  const isUpgradingRole = useRef(false);

  const notificationsQuery = useNotificationsList(userId, isAuthenticated, 5);
  const unreadQuery = useUnreadNotifications(userId, isAuthenticated, 20);
  const markReadMutation = useMarkNotificationRead();
  const bulkMutation = useBulkUpdateNotifications();

  const notifications = useMemo(() => {
    return notificationsQuery.data?.pages.flatMap((page) => page.data) ?? [];
  }, [notificationsQuery.data]);

  const visibleNotifications = useMemo(() => notifications, [notifications]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const t = e.currentTarget as HTMLElement;
    if (t.scrollTop + t.clientHeight >= t.scrollHeight - 120) {
      if (
        notificationsQuery.hasNextPage &&
        !notificationsQuery.isFetchingNextPage
      ) {
        void notificationsQuery.fetchNextPage();
      }
    }
  };

  function groupByDay(items: typeof notifications) {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const groups: Record<string, typeof notifications> = {
      Today: [],
      Yesterday: [],
      Earlier: [],
    };

    items.forEach((it) => {
      const d = new Date(it.created_at);
      if (
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate()
      ) {
        groups.Today.push(it);
      } else if (
        d.getFullYear() === yesterday.getFullYear() &&
        d.getMonth() === yesterday.getMonth() &&
        d.getDate() === yesterday.getDate()
      ) {
        groups.Yesterday.push(it);
      } else {
        groups.Earlier.push(it);
      }
    });

    return groups;
  }

  const unreadCount = unreadQuery.data?.data.length ?? 0;
  const hasUnread = unreadCount > 0;

  useEffect(() => {
    if (!userId || !isAuthenticated) return;

    return subscribeToUserNotifications({
      userId,
      onEvent: (eventName, payload) => {
        if (eventName === "notify:created") {
          void queryClient.invalidateQueries({
            queryKey: notificationKeys.root,
          });
          return;
        }

        if (eventName === "notify:lecturer-request") {
          const data = (payload as { data?: { approved?: boolean } } | null)?.data;
          const isApproved = data?.approved === true;

          void queryClient.invalidateQueries({ queryKey: LECTURER_REQUEST_KEYS.all });
          void queryClient.invalidateQueries({ queryKey: notificationKeys.root });

          if (isApproved) {
            if (!isUpgradingRole.current) {
              isUpgradingRole.current = true;

              const currentUser = useAuthStore.getState().user;
              if (currentUser) {
                useAuthStore.getState().setUser({ ...currentUser, role: 3 });
              }

              toast.success(
                "Chúc mừng! Bạn đã trở thành Giảng viên. Hãy bật Teacher Mode để bắt đầu.",
                { duration: 8000 },
              );

              isUpgradingRole.current = false;
            }
          } else {
            toast.info("Yêu cầu Giảng viên của bạn đã bị từ chối. Xem chi tiết trong hồ sơ.");
          }
          return;
        }

        const record = payload as Record<string, unknown> | null;
        if (record && typeof record === "object" && "notification" in record) {
          void queryClient.invalidateQueries({
            queryKey: notificationKeys.root,
          });
        }
      },
      onError: (error) => {
        console.debug("[NotificationBell] SSE disconnected:", error.message);
      },
    });
  }, [isAuthenticated, queryClient, userId]);

  const handleMarkAsRead = async (id: number) => {
    if (!userId) return;
    await markReadMutation.mutateAsync({ id, is_read: true });
  };

  const handleMarkAllAsRead = async () => {
    if (!userId) return;
    await bulkMutation.mutateAsync({ is_read: true, all: true });
  };

  const handleNotificationSelect = async (
    notificationId: number,
    isRead: boolean,
    redirectUrl: string | null,
  ) => {
    if (!isRead) {
      await handleMarkAsRead(notificationId);
    }
    setOpen(false);
    if (redirectUrl) {
      router.push(redirectUrl);
    }
  };

  if (!isAuthenticated || !userId) {
    return null;
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "relative h-9 w-9 rounded-full border border-border/70 bg-background/70",
            className,
          )}
          aria-label="Thông báo"
        >
          <Bell className="h-4 w-4" />
          {hasUnread ? (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-4.5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-semibold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-95 p-0"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
          <DropdownMenuLabel className="p-0 text-base font-semibold">
            Thông báo
          </DropdownMenuLabel>
          {unreadCount > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs font-medium text-primary hover:bg-transparent hover:text-primary/80"
              onClick={handleMarkAllAsRead}
              disabled={bulkMutation.isPending}
            >
              <CheckCheck className="mr-1 h-3.5 w-3.5" />
              Đánh dấu tất cả đã đọc
            </Button>
          ) : null}
        </div>

        <ScrollArea
          className="h-112.5"
          viewportProps={{ onScroll: handleScroll }}
        >
          <div className="flex flex-col">
            {notificationsQuery.isLoading ? (
              <div className="space-y-4 p-4">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={`skeleton-${i}`}
                    className="flex items-start gap-3 animate-pulse"
                  >
                    <div className="h-10 w-10 shrink-0 rounded-full bg-muted/50" />
                    <div className="min-w-0 flex-1 space-y-2 pt-1">
                      <div className="h-4 w-3/4 rounded-md bg-muted/50" />
                      <div className="h-3 w-1/2 rounded-md bg-muted/30" />
                    </div>
                  </div>
                ))}
              </div>
            ) : visibleNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-3 rounded-full bg-muted/30 p-4">
                  <CheckCheck className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  Bạn không có thông báo nào.
                </p>
              </div>
            ) : (
              (() => {
                const groups = groupByDay(visibleNotifications);
                return (
                  <div className="flex flex-col pb-2">
                    {(Object.keys(groups) as Array<keyof typeof groups>).map(
                      (g) => {
                        if (groups[g].length === 0) return null;

                        return (
                          <div key={g}>
                            <div className="sticky top-0 z-10 bg-background/95 px-4 py-2 text-xs font-semibold text-muted-foreground backdrop-blur-sm">
                              {g}
                            </div>

                            <div className="flex flex-col">
                              {groups[g].map((notification) => {
                                const isRead = notification.is_read;
                                const payload = (notification.payload ??
                                  null) as Record<string, unknown> | null;
                                const payloadUrl =
                                  typeof payload?.url === "string"
                                    ? payload.url
                                    : null;
                                const isComment = String(
                                  notification.event_type ?? "",
                                )
                                  .toLowerCase()
                                  .includes("comment");
                                const redirectUrl = getNotificationRedirectUrl(
                                  String(notification.event_type ?? ""),
                                  payload,
                                );
                                const actorRecord =
                                  payload &&
                                  typeof payload.actor === "object" &&
                                  payload.actor !== null
                                    ? (payload.actor as Record<string, unknown>)
                                    : null;
                                const actorAvatar =
                                  typeof actorRecord?.avatar === "string"
                                    ? actorRecord.avatar
                                    : typeof payload?.actorAvatar === "string"
                                      ? payload.actorAvatar
                                      : null;

                                return (
                                  <DropdownMenuItem
                                    key={notification.id}
                                    className={cn(
                                      "relative flex cursor-pointer items-start gap-4 rounded-none border-b border-border/60 p-4 outline-none transition-colors hover:bg-muted/40 last:border-0",
                                      !isRead
                                        ? "bg-primary/10"
                                        : "bg-transparent",
                                    )}
                                    onSelect={() => {
                                      void handleNotificationSelect(
                                        notification.id,
                                        isRead,
                                        redirectUrl,
                                      );
                                    }}
                                  >
                                    <div className="relative mt-0.5 shrink-0">
                                      {payloadUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                          src={String(payloadUrl)}
                                          alt="thumb"
                                          className={cn(
                                            "h-10 w-10 rounded-full border object-cover",
                                            isRead
                                              ? "border-border/50 bg-muted/50"
                                              : "border-primary/30 bg-primary/20 shadow-sm",
                                          )}
                                        />
                                      ) : actorAvatar ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                          src={String(actorAvatar)}
                                          alt="avatar"
                                          className={cn(
                                            "h-10 w-10 rounded-full border object-cover",
                                            isRead
                                              ? "border-border/50 bg-muted/50"
                                              : "border-primary/30 bg-primary/20 shadow-sm",
                                          )}
                                        />
                                      ) : (
                                        <div
                                          className={cn(
                                            "flex h-10 w-10 items-center justify-center rounded-full border",
                                            isRead
                                              ? "border-border/50 bg-muted/50 text-muted-foreground"
                                              : "border-primary/30 bg-primary/20 text-primary shadow-sm",
                                          )}
                                        >
                                          {isComment ? (
                                            <User className="h-4 w-4" />
                                          ) : (
                                            <Megaphone className="h-4 w-4" />
                                          )}
                                        </div>
                                      )}

                                      {!isRead ? (
                                        <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
                                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                                          <span className="relative inline-flex h-3 w-3 rounded-full border-2 border-background bg-primary" />
                                        </span>
                                      ) : null}
                                    </div>

                                    <div className="min-w-0 flex-1 space-y-1">
                                      <p
                                        className={cn(
                                          "line-clamp-2 text-sm leading-snug",
                                          isRead
                                            ? "font-medium text-foreground/80"
                                            : "font-semibold text-foreground",
                                        )}
                                      >
                                        {notification.title}
                                      </p>

                                      {notification.message ? (
                                        <p className="line-clamp-2 text-sm text-muted-foreground">
                                          {notification.message}
                                        </p>
                                      ) : null}

                                      <p className="pt-1 text-[11px] font-medium text-muted-foreground/70">
                                        {formatRelativeTime(
                                          notification.created_at,
                                        )}
                                      </p>
                                    </div>
                                  </DropdownMenuItem>
                                );
                              })}
                            </div>
                          </div>
                        );
                      },
                    )}

                    {notificationsQuery.isFetchingNextPage ? (
                      <div className="flex items-center justify-center p-4">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      </div>
                    ) : null}
                  </div>
                );
              })()
            )}
          </div>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
