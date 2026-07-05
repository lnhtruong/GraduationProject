"use client";

import { User, CheckCircle, XCircle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LecturerRequestStatusBadge } from "../LecturerRequestStatusBadge";
import type { LecturerRequest } from "../../types/lecturer-request.types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

interface AdminLecturerRequestTableProps {
  requests: LecturerRequest[];
  isLoading: boolean;
  isFiltering: boolean;
  showActions?: boolean;
  approvingId: number | null;
  rejectingId: number | null;
  onApprove: (req: LecturerRequest) => void;
  onReject: (req: LecturerRequest) => void;
  onViewDetail: (req: LecturerRequest) => void;
}

export function AdminLecturerRequestTable({
  requests,
  isLoading,
  isFiltering,
  showActions,
  approvingId,
  rejectingId,
  onApprove,
  onReject,
  onViewDetail,
}: AdminLecturerRequestTableProps) {
  if (isLoading) {
    return (
      <div className="divide-y divide-border/50">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-7 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <User className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          {isFiltering ? "Không tìm thấy kết quả phù hợp." : "Không có yêu cầu nào."}
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/50">
      {requests.map((req) => {
        const user = req.requester;
        const fullName =
          [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
          user?.email ||
          `User #${req.userId}`;
        const initials = fullName.slice(0, 2).toUpperCase();
        const isActing = approvingId === req.id || rejectingId === req.id;

        return (
          <div
            key={req.id}
            className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors"
          >
            {/* Avatar */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary overflow-hidden">
              {user?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt={fullName} className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>

            {/* Name + email */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{fullName}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            </div>

            {/* Status */}
            <LecturerRequestStatusBadge status={req.status} />

            {/* Date */}
            <span className="hidden text-xs text-muted-foreground sm:block whitespace-nowrap">
              {formatDate(req.created_at)}
            </span>

            {/* Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                onClick={() => onViewDetail(req)}
              >
                <Eye className="h-3.5 w-3.5" />
                Xem
              </Button>

              {showActions && req.status === "pending" && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 px-2 text-xs text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/30"
                    disabled={isActing}
                    onClick={() => onApprove(req)}
                  >
                    {approvingId === req.id ? (
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <CheckCircle className="h-3.5 w-3.5" />
                    )}
                    Duyệt
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 px-2 text-xs text-destructive hover:bg-destructive/10"
                    disabled={isActing}
                    onClick={() => onReject(req)}
                  >
                    {rejectingId === req.id ? (
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5" />
                    )}
                    Từ chối
                  </Button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
