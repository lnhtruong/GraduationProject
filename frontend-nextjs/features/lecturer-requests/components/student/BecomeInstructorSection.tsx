"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GraduationCap, Clock, XCircle } from "lucide-react";
import { LecturerRequestStatusBadge } from "../LecturerRequestStatusBadge";
import { LecturerRequestForm } from "./LecturerRequestForm";
import { LecturerRequestHistory } from "./LecturerRequestHistory";
import { useMyLecturerRequests } from "../../api/lecturer-requests.hooks";
import type { LecturerRequest } from "../../types/lecturer-request.types";
import { EvidenceImageGallery } from "@/features/image/components/EvidenceImageGallery";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function BecomeInstructorSection() {
  const [formOpen, setFormOpen] = useState(false);

  const { data, isLoading } = useMyLecturerRequests(
    { page: 1, limit: 1 },
    true,
  );

  const latestRequest = data?.items[0] ?? null;
  const isPending = latestRequest?.status === "pending";
  const isRejected = latestRequest?.status === "rejected";
  const isApproved = latestRequest?.status === "approved";
  const hasNoRequest = !isLoading && (!latestRequest || isApproved);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            Trở thành Giảng viên
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
          ) : isPending ? (
            <PendingState request={latestRequest} />
          ) : isRejected ? (
            <RejectedState
              request={latestRequest}
              onResubmit={() => setFormOpen(true)}
            />
          ) : hasNoRequest ? (
            <NoRequestState onOpen={() => setFormOpen(true)} />
          ) : null}

          {!isLoading && (data?.pagination?.totalItems ?? 0) > 1 && (
            <LecturerRequestHistory />
          )}
        </CardContent>
      </Card>

      <LecturerRequestForm open={formOpen} onClose={() => setFormOpen(false)} />
    </>
  );
}

function NoRequestState({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Trở thành giảng viên để tạo và chia sẻ khoá học của bạn với hàng nghìn
        học viên trên nền tảng.
      </p>
      <Button onClick={onOpen} className="gap-2">
        <GraduationCap className="h-4 w-4" />
        Đăng ký trở thành Giảng viên
      </Button>
    </div>
  );
}

function PendingState({ request }: { request: LecturerRequest }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <LecturerRequestStatusBadge status="pending" />
        <span className="text-xs text-muted-foreground">
          Gửi lúc {formatDate(request.created_at)}
        </span>
      </div>
      <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
        <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <AlertDescription className="text-sm text-amber-700 dark:text-amber-300">
          Yêu cầu của bạn đang được xem xét. Chúng tôi sẽ thông báo kết quả qua
          hệ thống thông báo.
        </AlertDescription>
      </Alert>
      <TeachingTopics request={request} />
      {request.confirm && (
        <div className="rounded-lg bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          <p className="line-clamp-3">{request.confirm}</p>
        </div>
      )}
      <EvidenceImages request={request} />
    </div>
  );
}

function RejectedState({
  request,
  onResubmit,
}: {
  request: LecturerRequest;
  onResubmit: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <LecturerRequestStatusBadge status="rejected" />
        {request.reviewedAt && (
          <span className="text-xs text-muted-foreground">
            {formatDate(request.reviewedAt ?? "")}
          </span>
        )}
      </div>
      {request.reviewNote && (
        <Alert className="border-destructive/30 bg-destructive/5">
          <XCircle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-sm text-destructive">
            {request.reviewNote}
          </AlertDescription>
        </Alert>
      )}
      <TeachingTopics request={request} />
      <EvidenceImages request={request} />
      <Button onClick={onResubmit} variant="outline" className="gap-2">
        <GraduationCap className="h-4 w-4" />
        Gửi lại yêu cầu
      </Button>
    </div>
  );
}

function TeachingTopics({ request }: { request: LecturerRequest }) {
  if (!request.teachingTopics) return null;

  return (
    <div className="rounded-lg bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
      <p className="mb-1 text-xs font-medium text-foreground">Lĩnh vực muốn giảng dạy</p>
      <p>{request.teachingTopics}</p>
    </div>
  );
}

function EvidenceImages({ request }: { request: LecturerRequest }) {
  if (!request.evidenceImages?.length) return null;

  return (
    <div>
      <p className="mb-1.5 text-xs text-muted-foreground">
        Ảnh minh chứng ({request.evidenceImages.length})
      </p>
      <EvidenceImageGallery images={request.evidenceImages} className="grid grid-cols-3 gap-2 sm:grid-cols-5" />
    </div>
  );
}
