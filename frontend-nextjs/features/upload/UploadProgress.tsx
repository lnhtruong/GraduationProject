"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, X } from "lucide-react";

interface UploadProgressProps {
  progress: number;
  status: string;
  jobId?: string | null;
  isDownloading?: boolean;
  clipsCount?: number;
  onViewResults?: () => void;
  onStartNew?: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
}

export default function UploadProgress({
  progress,
  status,
  jobId,
  isDownloading = false,
  clipsCount = 0,
  onViewResults,
  onStartNew,
  onCancel,
  showCancel = false,
}: UploadProgressProps) {
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="font-medium">Processing Video</span>
          </div>
          {showCancel && onCancel && (
            <Button variant="outline" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{status}</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>
      </CardContent>
    </Card>
  );
}
