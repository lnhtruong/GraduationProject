import { Button } from "@/components/ui/button";
import { Download, Edit, FileArchive, Loader2 } from "lucide-react";
import type { Clip } from "@/features/upload/types";

interface ResultsSectionProps {
  clips: Clip[];
  isVisible: boolean;
  onEditClip?: (clip: Clip) => void | Promise<void>;
}

export default function ResultsSection({
  clips,
  isVisible,
  onEditClip,
}: ResultsSectionProps) {
  if (!isVisible || clips.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-primary">
            Kết quả
          </p>
          <h3 className="text-xl font-semibold">
            {clips.length === 1
              ? "Highlight đã tạo"
              : `${clips.length} highlight để bạn chọn`}
          </h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Mở đoạn phù hợp trong Studio để thêm Mascot và hoàn thiện video.
        </p>
      </div>

      <div className="grid gap-4">
        {clips.map((clip, index) => (
          <ClipCard
            key={`${clip.url}-${index}`}
            clip={clip}
            index={index}
            onEditClip={onEditClip}
          />
        ))}
      </div>
    </div>
  );
}

interface ClipCardProps {
  clip: Clip;
  index: number;
  onEditClip?: (clip: Clip) => void | Promise<void>;
}

function ClipCard({
  clip,
  index,
  onEditClip,
}: ClipCardProps) {
  const isZip = clip.url.endsWith(".zip") || clip.name.endsWith(".zip");
  const isVideo =
    !isZip &&
    (clip.url.startsWith("blob:") || /\.(mp4|mov|avi|webm)$/i.test(clip.url));

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          {isZip ? (
            <FileArchive className="h-5 w-5 shrink-0 text-muted-foreground" />
          ) : (
            <span className="shrink-0 text-sm font-semibold text-muted-foreground">
              {index + 1}
            </span>
          )}
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              {clip.topicId ? (
                <span className="shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  Chủ đề {clip.topicId}
                </span>
              ) : null}
              <div className="truncate font-medium" title={clip.name}>
                {clip.name}
              </div>
            </div>
            {clip.description ? (
              <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {clip.description}
              </div>
            ) : null}
            {isZip ? (
              <div className="text-xs text-muted-foreground">
                Gói tải xuống gồm nhiều đoạn video.
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button variant="outline" size="sm" asChild>
            <a
              href={clip.url}
              download={clip.name}
              target="_blank"
              rel="noreferrer"
            >
              <Download className="mr-2 h-4 w-4" />
              Tải xuống
            </a>
          </Button>

          {isVideo ? (
            <Button
              variant="default"
              size="sm"
              disabled={!clip.videoId}
              onClick={() => {
                void onEditClip?.(clip);
              }}
            >
              {clip.videoId ? (
                <Edit className="mr-2 h-4 w-4" />
              ) : (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {clip.videoId ? "Mở trong Studio" : "Đang lưu"}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="p-4">
        {isZip ? (
          <div className="rounded-lg bg-muted/20 p-6 text-center text-sm text-muted-foreground">
            <FileArchive className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
            <p>Tải file zip và giải nén để xem các đoạn video.</p>
          </div>
        ) : isVideo ? (
          <div className="space-y-3">
            {clip.thumbnail ? (
              <div className="overflow-hidden rounded-lg border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={clip.thumbnail}
                  alt={clip.name}
                  className="aspect-video w-full object-cover"
                  loading="lazy"
                />
              </div>
            ) : (
              <video
                className="w-full rounded-lg border"
                controls
                src={clip.url}
                preload="metadata"
              >
                Trình duyệt của bạn không hỗ trợ phát video.
              </video>
            )}
            {clip.videoId ? (
              <div className="rounded-md border px-3 py-2 text-xs text-muted-foreground">
                Đã lưu vào thư viện video. Bạn có thể mở lại clip này trong Studio.
              </div>
            ) : null}
          </div>
        ) : (
          <div className="rounded-lg bg-muted/20 p-6 text-center text-sm text-muted-foreground">
            <p>File này chưa hỗ trợ xem trước. Vui lòng tải xuống để xem.</p>
          </div>
        )}
      </div>
    </div>
  );
}
