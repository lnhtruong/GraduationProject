"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Clock3, Maximize2, PlayCircle, X } from "lucide-react";
import { getVideoCardTitle } from "../../utils/lesson-form.utils";

interface Video {
  id: number;
  url?: string | null;
  duration?: number | null;
  created_at?: string;
  type?: string;
  thumbnail?: string | null;
  name?: string | null;
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
  const [previewVideoId, setPreviewVideoId] = useState<number | null>(null);

  const previewVideo = useMemo(
    () =>
      (userVideos ?? []).find((video) => video.id === previewVideoId) ?? null,
    [previewVideoId, userVideos],
  );

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-sm font-medium">Chọn video bài học</Label>
        {!!userVideos?.length ? (
          <Badge variant="outline" className="text-[11px] font-normal">
            {userVideos.length} video
          </Badge>
        ) : null}
      </div>

      {videosLoading ? (
        <div className="rounded-xl border border-dashed border-border/60 px-3 py-2 text-xs text-muted-foreground">
          Đang tải video highlight...
        </div>
      ) : userVideos?.length ? (
        <div className="space-y-3">
          <div className="max-h-[23rem] overflow-y-auto rounded-xl border border-border/60 bg-muted/10 p-2 pr-1">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4">
              {userVideos.map((video) => {
                const isSelected = selectedVideoId === video.id;
                const title = getVideoCardTitle(video.name, video.id);

                return (
                  <button
                    key={video.id}
                    type="button"
                    onClick={() => onVideoSelect(video.id)}
                    onDoubleClick={() => {
                      onVideoSelect(video.id);
                      setPreviewVideoId(video.id);
                    }}
                    className={`group overflow-hidden rounded-xl border text-left transition ${
                      isSelected
                        ? "border-primary shadow-sm ring-1 ring-primary/40"
                        : "border-border/60 bg-background hover:border-primary/40"
                    }`}
                    title="Double click để xem trước"
                  >
                    <div className="relative aspect-video overflow-hidden bg-muted/30">
                      {video.thumbnail ? (
                        <Image
                          src={video.thumbnail}
                          alt={title}
                          width={480}
                          height={270}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                          Không có thumbnail
                        </div>
                      )}

                      <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                        <PlayCircle className="h-7 w-7 text-white" />
                      </div>

                      <div className="absolute left-1.5 top-1.5 flex items-center gap-1">
                        {video.type ? (
                          <Badge
                            variant="secondary"
                            className="h-5 bg-black/65 px-1.5 text-[10px] text-white"
                          >
                            {video.type}
                          </Badge>
                        ) : null}
                        {isSelected ? (
                          <Badge className="h-5 px-1.5 text-[10px]">Đã chọn</Badge>
                        ) : null}
                      </div>
                    </div>

                    <div className="space-y-1 p-2">
                      <p className="line-clamp-2 text-xs font-medium">{title}</p>
                      <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Clock3 className="h-3 w-3" />
                          {formatDuration(video.duration)}
                        </span>
                        <span>{formatDate(video.created_at)}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground">
            Nhấn 1 lần để chọn video, double click để mở phần xem trước.
          </p>

          {previewVideo ? (
            <div className="overflow-hidden rounded-xl border border-border/60 bg-background shadow-sm">
              <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
                <p className="line-clamp-1 text-xs font-medium">
                  Xem trước: {getVideoCardTitle(previewVideo.name, previewVideo.id)}
                </p>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-[10px] font-normal">
                    {formatDuration(previewVideo.duration)}
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setPreviewVideoId(null)}
                    aria-label="Đóng xem trước"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {previewVideo.url ? (
                <div className="bg-black">
                  <video
                    className="block h-auto max-h-[24rem] w-full object-contain"
                    src={previewVideo.url}
                    poster={previewVideo.thumbnail ?? undefined}
                    controls
                    preload="metadata"
                    playsInline
                  >
                    Trình duyệt không hỗ trợ phát video.
                  </video>
                </div>
              ) : (
                <div className="flex min-h-32 items-center justify-center px-3 py-4 text-xs text-muted-foreground">
                  Video này chưa có URL để preview.
                </div>
              )}

              <div className="flex justify-end border-t border-border/60 px-3 py-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => onVideoSelect(previewVideo.id)}
                >
                  <Maximize2 className="mr-1.5 h-3.5 w-3.5" />
                  Dùng video này
                </Button>
              </div>
            </div>
          ) : null}
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

function formatDate(raw?: string): string {
  if (!raw) return "-";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("vi-VN");
}

function formatDuration(duration: number | null | undefined): string {
  if (duration === null || duration === undefined || !Number.isFinite(duration)) {
    return "00:00:00";
  }
  const total = Math.max(0, Math.floor(duration));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}
