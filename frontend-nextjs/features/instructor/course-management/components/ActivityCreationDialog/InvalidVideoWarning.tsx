"use client";

interface Props {
  show: boolean;
}

export function InvalidVideoWarning({ show }: Props) {
  if (!show) return null;

  return (
    <p className="rounded-lg border border-dashed border-border/60 px-3 py-2 text-xs text-muted-foreground">
      Chỉ quiz trong video mới cần video đã có thời lượng. Quiz ngoài video có
      thể tạo ngay sau khi bài học có `videoId`.
    </p>
  );
}
