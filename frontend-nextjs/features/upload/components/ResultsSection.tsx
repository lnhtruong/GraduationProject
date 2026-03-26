import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Download, Edit, FileArchive } from "lucide-react";
import type { Clip } from "@/features/upload/types";

// ============================================================================
// TYPES
// ============================================================================

interface ResultsSectionProps {
  clips: Clip[];
  isVisible: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function ResultsSection({
  clips,
  isVisible,
}: ResultsSectionProps) {
  if (!isVisible || clips.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Kết quả ({clips.length} {clips.length === 1 ? "file" : "files"})
        </h3>
      </div>

      <div className="grid gap-4">
        {clips.map((clip, index) => (
          <ClipCard key={index} clip={clip} index={index} />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// CLIP CARD COMPONENT
// ============================================================================

interface ClipCardProps {
  clip: Clip;
  index: number;
}

function ClipCard({ clip, index }: ClipCardProps) {
  const isZip = clip.url.endsWith(".zip") || clip.name.endsWith(".zip");
  const isVideo =
    !isZip &&
    (clip.url.startsWith("blob:") || /\.(mp4|mov|avi|webm)$/i.test(clip.url));
  const editorParams = new URLSearchParams({ src: clip.url });
  if (clip.videoId) {
    editorParams.set("videoId", String(clip.videoId));
  }

  return (
    <div className="bg-card border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b">
        <div className="flex items-center gap-3">
          {isZip ? (
            <FileArchive className="w-5 h-5 text-muted-foreground" />
          ) : (
            <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
              <span className="text-xs font-semibold text-primary">
                {index + 1}
              </span>
            </div>
          )}
          <div>
            <div className="font-medium">{clip.name}</div>
            {isZip && (
              <div className="text-xs text-muted-foreground">
                File nén chứa các clip
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Download Button */}
          <Button variant="outline" size="sm" asChild>
            <a
              href={clip.url}
              download={clip.name}
              target="_blank"
              rel="noreferrer"
            >
              <Download className="w-4 h-4 mr-2" />
              Tải xuống
            </a>
          </Button>

          {/* Edit Button (only for videos) */}
          {isVideo && (
            <Button
              variant="default"
              size="sm"
              asChild
              onClick={() => {
                console.log(
                  "[ResultsSection] Navigating to editor with URL:",
                  clip.url,
                );
              }}
            >
              <Link href={`/editor?${editorParams.toString()}`}>
                <Edit className="w-4 h-4 mr-2" />
                Chỉnh sửa
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {isZip ? (
          <div className="text-sm text-muted-foreground p-6 bg-muted/20 rounded text-center">
            <FileArchive className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p>Tải file zip và giải nén để xem các clip.</p>
          </div>
        ) : isVideo ? (
          <video
            className="w-full rounded border"
            controls
            src={clip.url}
            preload="metadata"
          >
            Trình duyệt của bạn không hỗ trợ video tag.
          </video>
        ) : (
          <div className="text-sm text-muted-foreground p-6 bg-muted/20 rounded text-center">
            <p>File không hỗ trợ xem trước. Vui lòng tải xuống để xem.</p>
          </div>
        )}
      </div>
    </div>
  );
}
