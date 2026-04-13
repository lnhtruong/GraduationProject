"use client";

interface Props {
  show: boolean;
}

export function InvalidVideoWarning({ show }: Props) {
  if (!show) return null;

  return (
    <p className="rounded-lg border border-dashed border-border/60 px-3 py-2 text-xs text-muted-foreground">
      Bài học cần có video để tạo quiz trong video.
    </p>
  );
}
