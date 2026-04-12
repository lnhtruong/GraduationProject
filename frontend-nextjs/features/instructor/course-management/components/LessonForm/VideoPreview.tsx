"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  videoUrl?: string | null;
  videoLoading: boolean;
}

export function VideoPreview({ videoUrl, videoLoading }: Props) {
  return (
    <Card className="overflow-hidden border-0 bg-background shadow-md">
      <CardContent className="p-0">
        <div className="flex aspect-video w-full items-center justify-center bg-black">
          {videoLoading ? (
            <div className="text-xs text-muted-foreground">
              Đang tải video...
            </div>
          ) : videoUrl ? (
            <video controls className="h-full w-full" src={videoUrl}>
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="text-center text-muted-foreground">
              <p className="mb-2 text-sm">Chưa chọn video cho bài học này.</p>
              <Link
                href="/upload"
                className="text-xs font-medium text-primary underline-offset-2 hover:underline"
              >
                Hãy upload video trước
              </Link>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
