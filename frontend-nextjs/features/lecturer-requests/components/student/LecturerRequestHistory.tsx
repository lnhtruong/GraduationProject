"use client";

import { LecturerRequestStatusBadge } from "../LecturerRequestStatusBadge";
import { useMyLecturerRequests } from "../../api/lecturer-requests.hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { EvidenceImageGallery } from "@/features/image/components/EvidenceImageGallery";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function LecturerRequestHistory() {
  const { data, isLoading } = useMyLecturerRequests({ page: 1, limit: 10 });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  const requests = data?.items ?? [];
  if (requests.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Lịch sử yêu cầu
      </p>
      <div className="divide-y divide-border rounded-lg border">
        {requests.map((req) => (
          <div key={req.id} className="flex items-start justify-between gap-3 px-4 py-3">
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <LecturerRequestStatusBadge status={req.status} />
                <span className="text-xs text-muted-foreground">
                  {formatDate(req.created_at)}
                </span>
              </div>
              {req.teachingTopics && (
                <p className="line-clamp-1 text-sm font-medium text-foreground">
                  {req.teachingTopics}
                </p>
              )}
              {req.confirm && (
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {req.confirm}
                </p>
              )}
              {req.evidenceImages && req.evidenceImages.length > 0 && (
                <div className="pt-1">
                  <p className="mb-1.5 text-xs text-muted-foreground">
                    Ảnh minh chứng ({req.evidenceImages.length})
                  </p>
                  <EvidenceImageGallery images={req.evidenceImages} className="grid grid-cols-3 gap-2 sm:grid-cols-5" />
                </div>
              )}
              {req.reviewNote && (
                <p className="text-sm text-destructive">
                  Phản hồi: {req.reviewNote}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
