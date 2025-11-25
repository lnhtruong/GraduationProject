"use client";

import { Loader2 } from "lucide-react";

interface ProcessingStatusProps {
  status: string | null;
  jobId: string | null;
  isDownloading: boolean;
}

export default function ProcessingStatus({
  status,
  jobId,
}: ProcessingStatusProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        <p>Đang xử lý video... ({status})</p>
      </div>
      {jobId && (
        <p className="text-xs text-muted-foreground">Job ID: {jobId}</p>
      )}
    </div>
  );
}
