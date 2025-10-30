import type { Clip } from "../types";

interface ResultsSectionProps {
  clips: Clip[];
  isVisible: boolean;
}

export default function ResultsSection({
  clips,
  isVisible,
}: ResultsSectionProps) {
  if (!isVisible || clips.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-4">Kết quả</h3>
      <div className="grid gap-4">
        {clips.map((clip, idx) => (
          <div key={idx} className="bg-muted/10 p-4 rounded-lg border">
            <div className="flex items-center justify-between mb-3">
              <div className="font-medium">{clip.name}</div>
              <a
                className="text-sm text-primary hover:underline"
                href={clip.url}
                target="_blank"
                rel="noreferrer"
                download
              >
                Tải xuống
              </a>
            </div>

            {clip.url && clip.url.endsWith(".zip") ? (
              <div className="text-sm text-muted-foreground p-3 bg-muted/20 rounded">
                Tải file zip và giải nén để xem các clip.
              </div>
            ) : (
              <video
                className="w-full rounded border"
                controls
                src={clip.url}
                poster=""
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
