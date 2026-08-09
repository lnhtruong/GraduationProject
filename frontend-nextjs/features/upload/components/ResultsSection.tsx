import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Edit3, FileArchive, RotateCcw } from "lucide-react";
import type { Clip } from "@/features/upload/types";

interface ResultsSectionProps {
  clips: Clip[];
  isVisible: boolean;
  onEditClip?: (clip: Clip) => void | Promise<void>;
  onStartNew?: () => void;
  onRefineCriteria?: () => void;
}

function cleanFileName(value?: string | null): string {
  const raw = (value ?? "").trim();
  if (!raw) return "Highlight";

  const withoutQuery = raw.split("?")[0];
  const fileName = withoutQuery.split("/").pop() ?? withoutQuery;
  const withoutExt = fileName.replace(/\.(mp4|mov|avi|webm|mkv|zip)$/i, "");
  const cleaned = withoutExt
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "")
    .replace(/[_-]?highlight$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned || "Highlight";
}

function isGenericHighlightName(value: string): boolean {
  return value === "Highlight" || /^highlight\s*\d*$/i.test(value);
}

function getClipTitle(clip: Clip, index: number, isSingle: boolean): string {
  if (clip.topicId) return `Highlight ${clip.topicId}`;

  const cleaned = cleanFileName(clip.name);
  if (!isGenericHighlightName(cleaned)) return cleaned;

  return isSingle ? "Highlight đã tạo" : `Highlight ${index + 1}`;
}

function getClipMeta(clip: Clip, title: string): string | null {
  const description = clip.description?.trim();
  if (description && cleanFileName(description) !== title) return description;

  const cleanedName = cleanFileName(clip.name);
  if (!isGenericHighlightName(cleanedName) && cleanedName !== title) return cleanedName;

  return null;
}

export default function ResultsSection({
  clips,
  isVisible,
  onEditClip,
  onStartNew,
  onRefineCriteria,
}: ResultsSectionProps) {
  if (!isVisible || clips.length === 0) return null;

  const isSingle = clips.length === 1;

  return (
    <section className="space-y-3" aria-label="Kết quả highlight">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-xl font-semibold">
          {isSingle ? "Highlight đã tạo" : `${clips.length} highlight đã tạo`}
        </h3>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          {onRefineCriteria ? (
            <Button
              type="button"
              size="sm"
              className="w-full gap-2 sm:w-auto"
              onClick={onRefineCriteria}
            >
              <RotateCcw className="h-4 w-4" />
              Chỉnh tiêu chí và tạo lại
            </Button>
          ) : null}
          {onStartNew ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full gap-2 sm:w-auto"
              onClick={onStartNew}
            >
              <RotateCcw className="h-4 w-4" />
              Chọn nguồn khác
            </Button>
          ) : null}
        </div>
      </div>

      <div className={cn("grid gap-4", !isSingle && "lg:grid-cols-2")}>
        {clips.map((clip, index) => (
          <ClipCard
            key={`${clip.url}-${index}`}
            clip={clip}
            index={index}
            isSingle={isSingle}
            compact={!isSingle}
            onEditClip={onEditClip}
          />
        ))}
      </div>
    </section>
  );
}

interface ClipCardProps {
  clip: Clip;
  index: number;
  isSingle: boolean;
  compact?: boolean;
  onEditClip?: (clip: Clip) => void | Promise<void>;
}

function ClipCard({
  clip,
  index,
  isSingle,
  compact = false,
  onEditClip,
}: ClipCardProps) {
  const isZip = clip.url.endsWith(".zip") || clip.name.endsWith(".zip");
  const isVideo =
    !isZip &&
    (clip.url.startsWith("blob:") || /\.(mp4|mov|avi|webm)$/i.test(clip.url));
  const title = getClipTitle(clip, index, isSingle);
  const meta = getClipMeta(clip, title);
  const showCardTitle = !isSingle || Boolean(meta);

  return (
    <article className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-start sm:justify-between">
        {showCardTitle ? (
          <div className="flex min-w-0 gap-3">
            {!isSingle ? (
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                {index + 1}
              </span>
            ) : null}
            <div className="min-w-0">
              {!isSingle ? (
                <h4 className="truncate font-semibold" title={title}>
                  {title}
                </h4>
              ) : null}
              {meta ? (
                <p className={cn("line-clamp-2 text-sm text-muted-foreground", !isSingle && "mt-1")}>
                  {meta}
                </p>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="hidden sm:block" aria-hidden="true" />
        )}

        {isVideo ? (
          <Button
            type="button"
            size="sm"
            className="w-full gap-2 sm:w-auto"
            onClick={() => {
              void onEditClip?.(clip);
            }}
          >
            <Edit3 className="h-4 w-4" />
            Mở Studio
          </Button>
        ) : null}
      </div>

      <div className="p-4">
        {isZip ? (
          <div className="rounded-lg bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            <FileArchive className="mx-auto mb-3 h-10 w-10" />
            Kết quả này chưa hỗ trợ xem nhanh trong trình duyệt.
          </div>
        ) : isVideo ? (
          <video
            className={cn(
              "w-full rounded-lg border bg-black",
              compact ? "aspect-video" : "max-h-[520px]",
            )}
            controls
            src={clip.url}
            preload="metadata"
          >
            Trình duyệt của bạn không hỗ trợ phát video.
          </video>
        ) : (
          <div className="rounded-lg bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            File này chưa hỗ trợ xem nhanh trong trình duyệt.
          </div>
        )}
      </div>
    </article>
  );
}
