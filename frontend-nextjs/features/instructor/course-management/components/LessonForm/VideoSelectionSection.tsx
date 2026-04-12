"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import {
  formatDuration,
  getVideoCardTitle,
} from "../../utils/lesson-form.utils";

interface Video {
  id: number;
  thumbnail?: string | null;
  name?: string | null;
  duration?: number | null;
  type?: string;
}

interface Props {
  videosLoading: boolean;
  userVideos?: Video[] | null;
  selectedVideoId: number | null;
  onVideoSelect: (videoId: number) => void;
}

export function VideoSelectionSection({
  videosLoading,
  userVideos,
  selectedVideoId,
  onVideoSelect,
}: Props) {
  return (
    <div className="grid gap-3">
      <Label className="text-sm font-medium">Chọn video bài học</Label>

      {videosLoading ? (
        <div className="rounded-xl border border-dashed border-border/60 px-3 py-2 text-xs text-muted-foreground">
          Đang tải video highlight...
        </div>
      ) : userVideos?.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {userVideos.map((video) => {
            const isSelected = selectedVideoId === video.id;
            return (
              <button
                key={video.id}
                type="button"
                onClick={() => onVideoSelect(video.id)}
                className={`overflow-hidden rounded-xl border text-left transition ${
                  isSelected
                    ? "border-primary shadow-sm ring-1 ring-primary/40"
                    : "border-border/60 hover:border-primary/50"
                }`}
              >
                <div className="aspect-video bg-muted/30">
                  {video.thumbnail ? (
                    <Image
                      src={video.thumbnail}
                      alt={getVideoCardTitle(video.name, video.id)}
                      width={480}
                      height={270}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                      Không có thumbnail
                    </div>
                  )}
                </div>
                <div className="space-y-1 p-2">
                  <p className="line-clamp-2 text-xs font-medium">
                    {getVideoCardTitle(video.name, video.id)}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">
                      {formatDuration(video.duration)} • {video.type}
                    </span>
                    {isSelected ? (
                      <Badge variant="default" className="h-5 px-2 text-[10px]">
                        Đã chọn
                      </Badge>
                    ) : null}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : null}

      {!videosLoading && !(userVideos?.length ?? 0) ? (
        <p className="text-xs text-muted-foreground">
          Chưa có video highlight. Vui lòng upload ở{" "}
          <Link
            href="/upload"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            trang Upload
          </Link>
          .
        </p>
      ) : null}
    </div>
  );
}
